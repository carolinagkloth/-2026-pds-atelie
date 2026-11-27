const pool = require('../config/database');
const PedidoModel = require('../models/pedidoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class PedidoController {
  static async criar(req, res) {
    try {
      const id_cliente = req.body.id_cliente || req.usuarioId || (req.usuario && req.usuario.id);
      const { descricao, fotos_referencia, prazo_desejado, horario_limite, status_pedido } = req.body;
      
      if (!id_cliente || !descricao || !prazo_desejado) {
        return res.status(400).json({ error: 'ID do cliente, descrição e prazo desejado são obrigatórios.' });
      }

      const pedido = await PedidoModel.criar({ 
        id_cliente, 
        descricao, 
        fotos_referencia, 
        prazo_desejado,
        horario_limite: horario_limite || null,
        status_pedido 
      });

      return res.status(201).json({ 
        mensagem: 'Pedido criado com sucesso!', 
        message: 'Pedido publicado com sucesso!',
        pedido,
        id_pedido: pedido.id_pedido 
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Erro ao registrar pedido.' });
    }
  }

  static async listarTodos(req, res) {
    try {
      const pedidos = await PedidoModel.listarTodos();
      return res.status(200).json(pedidos);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Erro ao buscar pedidos.' });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const pedido = await PedidoModel.buscarPorId(id);

      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      return res.status(200).json(pedido);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Erro ao buscar pedido.' });
    }
  }

  static async atualizar(req, res) {
    const { id } = req.params;
    const id_cliente = req.body.id_cliente || req.usuarioId || (req.usuario && req.usuario.id);
    const { descricao, fotos_referencia, prazo_desejado, horario_limite } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'A descrição do pedido é obrigatória.' });
    }

    try {
      const checagem = await PedidoModel.buscarPorId(id);
      if (!checagem) return res.status(404).json({ error: 'Pedido não encontrado.' });

      if (checagem.status_pedido !== 'Aberto') {
        return res.status(400).json({ error: 'Não é possível editar um pedido que já teve proposta aceita ou está em produção.' });
      }

      const pedidoAtualizado = await PedidoModel.atualizar(id, id_cliente, {
        descricao,
        fotos_referencia,
        prazo_desejado,
        horario_limite: horario_limite !== undefined ? (horario_limite || null) : checagem.horario_limite
      });
      return res.json({ mensagem: 'Pedido atualizado com sucesso!', pedido: pedidoAtualizado });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao atualizar pedido.' });
    }
  }

  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_pedido, status } = req.body;
      const novoStatus = status_pedido || status;
      
      const statusPermitidos = ['Aberto', 'Em Produção', 'Concluído', 'Cancelado'];
      if (!statusPermitidos.includes(novoStatus)) {
        return res.status(400).json({ error: 'Status de pedido inválido.' });
      }

      const pedidoAtualizado = await PedidoModel.atualizarStatus(id, novoStatus);
      return res.status(200).json({ message: 'Status do pedido atualizado!', pedido: pedidoAtualizado });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Erro ao atualizar status.' });
    }
  }

  static async cancelar(req, res) {
    const { id_pedido, id_usuario, observacao } = req.body;

    if (!id_pedido || !id_usuario) {
      return res.status(400).json({ error: 'ID do pedido e ID do usuário são obrigatórios.' });
    }

    // Garante que a constraint de status_kanban aceite 'Cancelado'
    try {
      const checkRes = await pool.query(
        `SELECT pg_get_constraintdef(oid) AS def
         FROM pg_constraint
         WHERE conname = 'ordens_servico_status_kanban_check'`
      );
      const def = checkRes.rows[0]?.def || '';
      if (def && !def.includes('Cancelado')) {
        await pool.query(`ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_kanban_check`);
        await pool.query(`
          ALTER TABLE ordens_servico
          ADD CONSTRAINT ordens_servico_status_kanban_check
          CHECK (status_kanban IN ('A Fazer', 'Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue', 'Cancelado', 'Cancelada'))
        `);
      }
    } catch (constraintErr) {
      console.warn('Aviso ao atualizar constraint status_kanban:', constraintErr.message);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pedRes = await client.query(
        `SELECT p.*, cli.nome AS cliente_nome
         FROM pedidos p
         JOIN usuarios cli ON p.id_cliente = cli.id_usuario
         WHERE p.id_pedido = $1`,
        [id_pedido]
      );

      if (pedRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      const pedido = pedRes.rows[0];
      if (['Cancelado', 'Entregue'].includes(pedido.status_pedido)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Este pedido já foi finalizado e não pode ser cancelado.' });
      }

      const canceladoPorCliente = Number(id_usuario) === Number(pedido.id_cliente);

      const userRes = await client.query(
        'SELECT nome FROM usuarios WHERE id_usuario = $1',
        [id_usuario]
      );
      const nomeQuemCancelou = userRes.rows[0]?.nome || (canceladoPorCliente ? 'O/a cliente' : 'O(a) profissional de costura');

      // Localiza a costureira vinculada (pela OS, prova agendada ou histórico do chat)
      let idCostureira = null;
      const osRes = await client.query(
        'SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1 LIMIT 1',
        [id_pedido]
      );
      if (osRes.rows[0]?.id_costureira) {
        idCostureira = osRes.rows[0].id_costureira;
      } else {
        const provaRes = await client.query(
          'SELECT id_costureira FROM agendamentos_prova WHERE id_pedido = $1 AND id_costureira IS NOT NULL LIMIT 1',
          [id_pedido]
        );
        if (provaRes.rows[0]?.id_costureira) {
          idCostureira = provaRes.rows[0].id_costureira;
        } else {
          const chatRes = await client.query(
            'SELECT id_remetente FROM mensagens_chat WHERE id_pedido = $1 AND id_remetente <> $2 ORDER BY data_hora_envio DESC LIMIT 1',
            [id_pedido, pedido.id_cliente]
          );
          if (chatRes.rows[0]?.id_remetente) {
            idCostureira = chatRes.rows[0].id_remetente;
          }
        }
      }

      if (!canceladoPorCliente && !idCostureira) {
        idCostureira = Number(id_usuario);
      }

      // Atualiza status no pedido, na ordem de serviço e cancela provas futuras na agenda
      await client.query(
        `UPDATE pedidos SET status_pedido = 'Cancelado' WHERE id_pedido = $1`,
        [id_pedido]
      );
      await client.query(
        `UPDATE ordens_servico SET status_kanban = 'Cancelado' WHERE id_pedido = $1`,
        [id_pedido]
      );
      await client.query(
        `UPDATE agendamentos_prova SET status = 'Cancelada' WHERE id_pedido = $1 AND COALESCE(status, 'Agendada') <> 'Cancelada'`,
        [id_pedido]
      );

      // Registra o cancelamento e a observação opcional no chat
      const obsLimpa = (observacao || '').trim();
      const autorTexto = canceladoPorCliente ? 'PELO(A) CLIENTE' : 'PELO(A) PROFISSIONAL DE COSTURA';
      const msgChat = obsLimpa
        ? `❌ PEDIDO CANCELADO ${autorTexto}.\nObservação enviada: "${obsLimpa}"`
        : `❌ PEDIDO CANCELADO ${autorTexto}.`;

      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem)
         VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_usuario, msgChat]
      );

      await client.query('COMMIT');

      // Notifica a outra parte com a observação, se houver
      if (canceladoPorCliente && idCostureira) {
        await dispararNotificacao({
          idUsuario: idCostureira,
          titulo: 'Pedido Cancelado ❌',
          mensagem: obsLimpa
            ? `O/a cliente ${pedido.cliente_nome} cancelou o Pedido #${id_pedido}. Observação: "${obsLimpa}"`
            : `O/a cliente ${pedido.cliente_nome} cancelou o Pedido #${id_pedido}.`,
          tipo: 'cancelamento',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      } else if (!canceladoPorCliente && pedido.id_cliente) {
        await dispararNotificacao({
          idUsuario: pedido.id_cliente,
          titulo: 'Pedido Cancelado pelo(a) Profissional ❌',
          mensagem: obsLimpa
            ? `${nomeQuemCancelou} cancelou/desistiu do Pedido #${id_pedido}. Observação: "${obsLimpa}"`
            : `${nomeQuemCancelou} cancelou/desistiu do Pedido #${id_pedido}.`,
          tipo: 'cancelamento',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Pedido cancelado com sucesso!' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao cancelar pedido:', error);
      return res.status(500).json({ error: 'Erro interno ao cancelar pedido.' });
    } finally {
      client.release();
    }
  }

  static async deletar(req, res) {
    const { id } = req.params;
    try {
      const ped = await PedidoModel.buscarPorId(id);
      if (!ped) return res.status(404).json({ error: 'Pedido não encontrado.' });

      const idCostureira = await PedidoModel.buscarCostureiraVinculada(id);
      await PedidoModel.deletar(id);

      if (idCostureira) {
        await dispararNotificacao({
          idUsuario: idCostureira,
          titulo: 'Pedido Cancelado',
          mensagem: `O pedido #${id} foi cancelado pelo(a) cliente.`,
          tipo: 'cancelamento',
          forcarWhatsapp: false
        });
      }

      return res.json({ mensagem: 'Pedido cancelado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cancelar pedido.' });
    }
  }
}

module.exports = PedidoController;