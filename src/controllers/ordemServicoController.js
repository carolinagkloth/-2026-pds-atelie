const pool = require('../config/database');
const OrdemServicoModel = require('../models/ordemServicoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class OrdemServicoController {
  static async criar(req, res) {
    try {
      const { id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban } = req.body;
      const os = await OrdemServicoModel.criar({ id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban });
      return res.status(201).json({ message: 'Ordem de serviço criada com sucesso!', id_ordem_servico: os.id_ordem_servico, os });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async listarTodos(req, res) {
    try {
      const ordens = await OrdemServicoModel.listarTodos();
      return res.status(200).json(ordens);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const ordem = await OrdemServicoModel.buscarPorId(id);
      if (!ordem) return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      return res.status(200).json(ordem);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async aceitarProposta(req, res) {
    const { id_pedido, id_costureira, valor_total, previsao_entrega, valor_entrada } = req.body;
    if (!id_pedido || !id_costureira) {
      return res.status(400).json({ erro: 'Informações incompletas para gerar Ordem de Serviço.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ordemServico = await OrdemServicoModel.aceitarProposta(client, {
        id_pedido, 
        id_costureira, 
        valor_total, 
        previsao_entrega, 
        valor_entrada
      });

      await client.query('COMMIT');

      await dispararNotificacao({
        idUsuario: id_costureira,
        titulo: 'Proposta Aceita! 🎉',
        mensagem: `A cliente aprovou sua proposta para o Pedido #${id_pedido}. O serviço está marcado como Em Produção!`,
        tipo: 'status',
        idPedido: id_pedido,
        forcarWhatsapp: true
      });

      return res.status(201).json({ mensagem: 'Proposta aceita com sucesso!', ordemServico });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao aceitar proposta:', err);
      return res.status(500).json({ erro: 'Erro interno ao gerar Ordem de Serviço.' });
    } finally {
      client.release();
    }
  }

  static async recusarProposta(req, res) {
    const { id_pedido, id_mensagem, id_costureira } = req.body;
    if (!id_pedido || !id_mensagem) {
      return res.status(400).json({ erro: 'ID do pedido e da mensagem são obrigatórios.' });
    }

    try {
      const queryAtualizarMsg = `
        UPDATE mensagens_chat 
        SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"recusada"')
        WHERE id_mensagem = $1 RETURNING *;
      `;
      await pool.query(queryAtualizarMsg, [id_mensagem]);

      if (id_costureira) {
        await dispararNotificacao({
          idUsuario: id_costureira,
          titulo: 'Proposta Recusada ❌',
          mensagem: `O cliente recusou a proposta enviada para o Pedido #${id_pedido}. Você pode enviar uma nova proposta revisada pelo chat.`,
          tipo: 'proposta',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Proposta recusada com sucesso!' });
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
      return res.status(500).json({ erro: 'Erro ao recusar proposta.' });
    }
  }

  // --- AGENDAMENTO DE PROVA (PERSISTE DATA E HORA NA BANCO) ---
  static async agendarProva(req, res) {
    const { id_pedido, dataProva, horarioProva, semPreferenciaHorario, observacao, id_costureira } = req.body;
    if (!id_pedido || !dataProva) {
      return res.status(400).json({ erro: 'ID do pedido e data da prova são obrigatórios.' });
    }

    const horarioTexto = semPreferenciaHorario ? 'Horário a combinar' : (horarioProva || 'Horário a definir');
    const observacaoComHorario = `Horário: ${horarioTexto}.${observacao ? ` Obs: ${observacao}` : ''}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Grava data_prova e horario_prova na tabela ordens_servico (Alimenta a Agenda)
      await client.query(
        `UPDATE ordens_servico 
         SET status_kanban = 'Aguardando Prova', 
             data_prova = $2, 
             horario_prova = $3 
         WHERE id_pedido = $1;`,
        [id_pedido, dataProva, horarioTexto]
      );

      // 2. Atualiza status no pedido
      await client.query(
        `UPDATE pedidos SET status_pedido = 'Aguardando Prova' WHERE id_pedido = $1;`,
        [id_pedido]
      );

      // 3. Formata a data para a mensagem no chat
      const [ano, mes, dia] = dataProva.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      const msgTexto = `📅 PROVA AGENDADA!\nSua prova da peça foi agendada para o dia ${dataFormatada}. ${observacaoComHorario}`;

      // 4. Insere mensagem no histórico do chat
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_costureira || null, msgTexto]
      );

      await client.query('COMMIT');

      // 5. Notifica o Cliente
      const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
      const idCliente = pedRes.rows[0]?.id_cliente;

      if (idCliente) {
        await dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Prova Agendada! 🗓️',
          mensagem: `${msgTexto}`,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Prova agendada com sucesso!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao agendar prova:', err);
      return res.status(500).json({ erro: err.message });
    } finally {
      client.release();
    }
  }

  // --- CANCELAMENTO DE PROVA (LIMPA AS DATAS DA AGENDA) ---
  static async cancelarProva(req, res) {
    const { id_pedido, id_remetente } = req.body;
    if (!id_pedido) {
      return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Limpa data_prova e horario_prova da ordem de serviço
      await client.query(
        `UPDATE ordens_servico 
         SET status_kanban = 'Em Produção', 
             data_prova = NULL, 
             horario_prova = NULL 
         WHERE id_pedido = $1;`,
        [id_pedido]
      );
      await client.query(
        `UPDATE pedidos SET status_pedido = 'Em Produção' WHERE id_pedido = $1;`,
        [id_pedido]
      );

      const msgTexto = `⚠️ PROVA CANCELADA!\nO agendamento da prova do Pedido #${id_pedido} foi cancelado. Alinhe uma nova data no chat.`;
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_remetente || null, msgTexto]
      );

      await client.query('COMMIT');

      const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
      const osRes = await pool.query('SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1', [id_pedido]);

      const idCliente = pedRes.rows[0]?.id_cliente;
      const idCostureira = osRes.rows[0]?.id_costureira;
      const idDestinatario = Number(id_remetente) === Number(idCliente) ? idCostureira : idCliente;

      if (idDestinatario) {
        await dispararNotificacao({
          idUsuario: idDestinatario,
          titulo: 'Prova Cancelada ⚠️',
          mensagem: `A prova do Pedido #${id_pedido} foi cancelada. Verifique as mensagens no chat.`,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Prova cancelada com sucesso!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao cancelar prova:', err);
      return res.status(500).json({ erro: 'Erro interno ao cancelar prova.' });
    } finally {
      client.release();
    }
  }

  // --- FLUXO DE CONCLUSÃO E ENTREGA ---
  static async concluirServico(req, res) {
    const { id_pedido, id_costureira } = req.body;
    if (!id_pedido) {
      return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`UPDATE ordens_servico SET status_kanban = 'Concluído' WHERE id_pedido = $1;`, [id_pedido]);
      await client.query(`UPDATE pedidos SET status_pedido = 'Concluído' WHERE id_pedido = $1;`, [id_pedido]);

      const msgTexto = `🎉 PEÇA CONCLUÍDA!\nA costureira finalizou o seu pedido. Entre em contato para alinhar a retirada/entrega e confirme o recebimento assim que estiver com a peça em mãos.`;
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_costureira || null, msgTexto]
      );

      await client.query('COMMIT');

      const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
      const idCliente = pedRes.rows[0]?.id_cliente;

      if (idCliente) {
        await dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Sua Peça está Pronta! 🎉',
          mensagem: `A costureira concluiu o Pedido #${id_pedido}. Alinhe a entrega e confirme o recebimento no aplicativo.`,
          tipo: 'status',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Serviço marcado como concluído com sucesso!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao concluir serviço:', err);
      return res.status(500).json({ erro: 'Erro interno ao concluir serviço.' });
    } finally {
      client.release();
    }
  }

  static async confirmarEntrega(req, res) {
    const { id_pedido, id_cliente } = req.body;
    if (!id_pedido) {
      return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const osResult = await client.query(
        `UPDATE ordens_servico SET status_kanban = 'Entregue' WHERE id_pedido = $1 RETURNING id_ordem_servico, id_costureira;`,
        [id_pedido]
      );
      await client.query(`UPDATE pedidos SET status_pedido = 'Entregue' WHERE id_pedido = $1;`, [id_pedido]);

      const ordemServico = osResult.rows[0];

      const msgTexto = `✅ ENTREGA CONFIRMADA!\nO cliente confirmou o recebimento da peça. O pedido foi finalizado com sucesso!`;
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_cliente || null, msgTexto]
      );

      await client.query('COMMIT');

      if (ordemServico?.id_costureira) {
        await dispararNotificacao({
          idUsuario: ordemServico.id_costureira,
          titulo: 'Entrega Confirmada! ⭐',
          mensagem: `O cliente confirmou o recebimento do Pedido #${id_pedido}. O serviço foi finalizado com sucesso!`,
          tipo: 'status',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ 
        mensagem: 'Recebimento confirmado com sucesso!', 
        id_ordem_servico: ordemServico?.id_ordem_servico || null 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao confirmar entrega:', err);
      return res.status(500).json({ erro: 'Erro interno ao confirmar entrega.' });
    } finally {
      client.release();
    }
  }

  static async listarPorUsuario(req, res) {
    const { idUsuario } = req.params;
    try {
      const ordens = await OrdemServicoModel.listarPorUsuario(idUsuario);
      return res.json(ordens);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar ordens de serviço.' });
    }
  }

  static async atualizarStatus(req, res) {
    const idOrdem = req.params.idOrdem || req.params.id;
    const { status_kanban } = req.body;

    const statusValidos = ['A Fazer', 'Em Produção', 'Aguardando Prova', 'Concluído', 'Entregue'];
    if (!status_kanban || !statusValidos.includes(status_kanban)) {
      return res.status(400).json({ error: 'Status inválido fornecido.', erro: 'Status inválido fornecido.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ordem = await OrdemServicoModel.atualizarStatus(client, idOrdem, status_kanban);
      if (!ordem) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.', erro: 'Ordem de serviço não encontrada.' });
      }

      await client.query('COMMIT');

      const idCliente = await OrdemServicoModel.buscarClientePorPedido(ordem.id_pedido);

      if (status_kanban === 'Concluído' && idCliente) {
        await dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Seu Pedido está Pronto! ⭐',
          mensagem: `Sua peça do Pedido #${ordem.id_pedido} foi concluída. Confirme a entrega e deixe sua avaliação!`,
          tipo: 'avaliacao',
          idPedido: ordem.id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ message: 'Status do pedido atualizado!', mensagem: `Status atualizado para "${status_kanban}" com sucesso!`, ordem });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar status kanban:', err);
      return res.status(500).json({ error: 'Erro ao atualizar status.', erro: 'Erro ao atualizar status.' });
    } finally {
      client.release();
    }
  }
}

module.exports = OrdemServicoController;