const pool = require('../config/database');
const OrdemServicoModel = require('../models/ordemServicoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

const ORDEM_PAGAMENTO = {
  'Aguardando Sinal': 1,
  'Aguardando Valor Total': 1,
  'Sinal Pago': 2,
  'Aguardando Restante': 2,
  'Em Débito': 2,
  'Pago Integralmente': 3
};

let sincronizandoProvas = false;

function validarTransicaoPagamento(statusAtual, novoStatus) {
  if (!statusAtual || statusAtual === novoStatus) return true;
  if (statusAtual === 'Pago Integralmente') return false;
  if (novoStatus === 'Em Débito') return true;
  if (statusAtual === 'Em Débito' && novoStatus === 'Aguardando Sinal') return false;
  return (ORDEM_PAGAMENTO[novoStatus] || 1) >= (ORDEM_PAGAMENTO[statusAtual] || 1);
}

function LOWER_STATUS(val) {
  return String(val || '').trim().toLowerCase();
}

class OrdemServicoController {
  // --- TRANSIÇÃO AUTOMÁTICA: 'Aguardando Prova' -> 'Em Produção' NO HORÁRIO DA PROVA ---
  static async sincronizarProvasVencidas() {
    if (sincronizandoProvas) return;
    sincronizandoProvas = true;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const osVencidas = await client.query(
        `UPDATE ordens_servico
         SET status_kanban = 'Em Produção',
             data_prova = NULL,
             horario_prova = NULL
         WHERE status_kanban = 'Aguardando Prova'
           AND data_prova IS NOT NULL
           AND (data_prova::date + COALESCE(substring(horario_prova from '^[0-9]{2}:[0-9]{2}'), '23:59')::time) <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
         RETURNING id_pedido;`
      );

      if (osVencidas.rows.length > 0) {
        const idsPedidos = osVencidas.rows.map((r) => r.id_pedido);
        await client.query(
          `UPDATE pedidos
           SET status_pedido = 'Em Produção'
           WHERE id_pedido = ANY($1::int[])
             AND status_pedido = 'Aguardando Prova';`,
          [idsPedidos]
        );
      }

      await client.query(
        `UPDATE pedidos p
         SET status_pedido = 'Em Produção'
         FROM ordens_servico os
         WHERE p.id_pedido = os.id_pedido
           AND p.status_pedido = 'Aguardando Prova'
           AND os.status_kanban = 'Em Produção';`
      );

      await client.query('COMMIT');

      try {
        await pool.query(
          `UPDATE agendamentos_prova
           SET status = 'Concluída'
           WHERE COALESCE(status, 'Agendada') = 'Agendada'
             AND data_prova IS NOT NULL
             AND (data_prova::date + COALESCE(substring(horario_prova from '^[0-9]{2}:[0-9]{2}'), '23:59')::time) <= (NOW() AT TIME ZONE 'America/Sao_Paulo');`
        );
      } catch (_) {}
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao sincronizar provas vencidas:', err.message);
    } finally {
      client.release();
      sincronizandoProvas = false;
    }
  }

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
    const { id_pedido, id_costureira, valor_total, valor_entrada, id_mensagem } = req.body;
    let previsao_entrega =
      req.body.previsao_entrega ||
      req.body.previsaoEntrega ||
      req.body.prazo ||
      req.body.prazo_proposta ||
      null;

    if (!id_pedido || !id_costureira) {
      return res.status(400).json({ erro: 'Informações incompletas para gerar Ordem de Serviço.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const msgQuery = id_mensagem
        ? `SELECT id_mensagem, valor_proposta, valor_entrada, prazo_proposta, dados_proposta FROM mensagens_chat WHERE id_mensagem = $1`
        : `SELECT id_mensagem, valor_proposta, valor_entrada, prazo_proposta, dados_proposta
           FROM mensagens_chat
           WHERE id_pedido = $1
             AND tipo_mensagem = 'proposta'
             AND LOWER(COALESCE(dados_proposta::jsonb->>'status', 'pendente')) = 'pendente'
           ORDER BY id_mensagem DESC
           LIMIT 1`;
      const msgRes = await client.query(msgQuery, [id_mensagem || id_pedido]);
      const row = msgRes.rows[0];

      const idMensagemAceita = id_mensagem || row?.id_mensagem || null;
      let valorTotalFinal = valor_total;
      let valorEntradaFinal = valor_entrada;

      if (row) {
        const dados = typeof row.dados_proposta === 'string' ? JSON.parse(row.dados_proposta) : (row.dados_proposta || {});
        if (LOWER_STATUS(dados.status) === 'recusada') {
          await client.query('ROLLBACK');
          return res.status(400).json({ erro: 'Esta proposta já foi recusada e não pode ser aceita.' });
        }
        if (!previsao_entrega) {
          previsao_entrega = row.prazo_proposta || dados.previsaoEntrega || dados.previsao_entrega || dados.prazo || null;
        }
        if (valorTotalFinal === undefined || valorTotalFinal === null) {
          valorTotalFinal = row.valor_proposta ?? dados.valorTotal ?? dados.valor_total ?? 0;
        }
        if (valorEntradaFinal === undefined || valorEntradaFinal === null) {
          valorEntradaFinal = row.valor_entrada ?? dados.valorEntrada ?? dados.valor_entrada ?? 0;
        }
      }

      if (idMensagemAceita) {
        await client.query(
          `UPDATE mensagens_chat
           SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"aceita"')
           WHERE id_mensagem = $1;`,
          [idMensagemAceita]
        );

        await client.query(
          `UPDATE mensagens_chat
           SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"recusada"')
           WHERE id_pedido = $1
             AND tipo_mensagem = 'proposta'
             AND id_mensagem <> $2
             AND LOWER(COALESCE(dados_proposta::jsonb->>'status', 'pendente')) = 'pendente';`,
          [id_pedido, idMensagemAceita]
        );
      }

      const ordemServico = await OrdemServicoModel.aceitarProposta(client, {
        id_pedido,
        id_costureira,
        valor_total: valorTotalFinal,
        previsao_entrega,
        valor_entrada: valorEntradaFinal
      });

      await client.query('COMMIT');

      dispararNotificacao({
        idUsuario: id_costureira,
        titulo: 'Proposta Aceita!',
        mensagem: `O/a cliente aprovou sua proposta para o Pedido #${id_pedido}. O serviço está marcado como Em Produção!`,
        tipo: 'status',
        idPedido: id_pedido,
        forcarWhatsapp: true
      }).catch((err) => console.error('Erro ao notificar aceite de proposta:', err.message));

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
        dispararNotificacao({
          idUsuario: id_costureira,
          titulo: 'Proposta Recusada',
          mensagem: `O/a cliente recusou a proposta enviada para o Pedido #${id_pedido}. Você pode enviar uma nova proposta revisada pelo chat.`,
          tipo: 'proposta',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar recusa de proposta:', err.message));
      }

      return res.json({ mensagem: 'Proposta recusada com sucesso!' });
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
      return res.status(500).json({ erro: 'Erro ao recusar proposta.' });
    }
  }

  // --- ACEITE DE PROPOSTA DE PROVA PELO/A CLIENTE (HORÁRIO OBRIGATÓRIO) ---
  static async aceitarProva(req, res) {
    const {
      id_pedido,
      id_mensagem,
      id_cliente,
      id_costureira,
      dataProva,
      horarioProva,
      observacao,
      local
    } = req.body;

    if (!id_pedido || !dataProva || !horarioProva) {
      return res.status(400).json({ erro: 'ID do pedido, data e horário da prova são obrigatórios.' });
    }

    const horarioTexto = String(horarioProva).trim();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO agendamentos_prova (id_pedido, id_costureira, data_prova, horario_prova, observacao, status)
         VALUES ($1, $2, $3, $4, $5, 'Agendada');`,
        [id_pedido, id_costureira || null, dataProva, horarioTexto, observacao || null]
      );

      await client.query(
        `INSERT INTO ordens_servico (id_pedido, id_costureira, valor_total, data_prova, horario_prova, status_kanban)
         VALUES ($1, $2, 0, $3, $4, 'Aguardando Prova')
         ON CONFLICT (id_pedido) DO UPDATE SET 
           status_kanban = 'Aguardando Prova', 
           data_prova = $3, 
           horario_prova = $4,
           id_costureira = COALESCE(ordens_servico.id_costureira, $2);`,
        [id_pedido, id_costureira, dataProva, horarioTexto]
      );

      await client.query(
        `UPDATE pedidos SET status_pedido = 'Aguardando Prova' WHERE id_pedido = $1;`,
        [id_pedido]
      );

      if (id_mensagem) {
        await client.query(
          `UPDATE mensagens_chat 
           SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"aceita"')
           WHERE id_mensagem = $1;`,
          [id_mensagem]
        );
      }

      const [ano, mes, dia] = dataProva.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      const localTexto = local ? `\nLocal: ${local}` : '';
      const msgTexto = `PROVA CONFIRMADA!\nO/a cliente aceitou o agendamento para o dia ${dataFormatada} às ${horarioTexto}.${localTexto}`;

      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_cliente || null, msgTexto]
      );

      await client.query('COMMIT');

      if (id_costureira) {
        dispararNotificacao({
          idUsuario: id_costureira,
          titulo: 'Prova Confirmada!',
          mensagem: `O/a cliente confirmou a prova do Pedido #${id_pedido} para ${dataFormatada} às ${horarioTexto}.`,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar prova confirmada:', err.message));
      }

      return res.json({ mensagem: 'Prova confirmada e adicionada à agenda!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao aceitar prova:', err);
      return res.status(500).json({ erro: err.message });
    } finally {
      client.release();
    }
  }

  // --- RECUSA DE PROPOSTA DE PROVA PELO/A CLIENTE ---
  static async recusarProva(req, res) {
    const { id_pedido, id_mensagem, id_costureira } = req.body;
    if (!id_pedido || !id_mensagem) {
      return res.status(400).json({ erro: 'ID do pedido e da mensagem são obrigatórios.' });
    }

    try {
      await pool.query(
        `UPDATE mensagens_chat 
         SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"recusada"')
         WHERE id_mensagem = $1;`,
        [id_mensagem]
      );

      if (id_costureira) {
        dispararNotificacao({
          idUsuario: id_costureira,
          titulo: 'Sugestão de Prova Recusada',
          mensagem: `O/a cliente não pôde confirmar o horário sugerido para a prova do Pedido #${id_pedido}. Combine outra data pelo chat.`,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar recusa de prova:', err.message));
      }

      return res.json({ mensagem: 'Sugestão de prova recusada.' });
    } catch (err) {
      console.error('Erro ao recusar prova:', err);
      return res.status(500).json({ erro: 'Erro ao recusar sugestão de prova.' });
    }
  }

  static async agendarProva(req, res) {
    return OrdemServicoController.aceitarProva(req, res);
  }

  // --- CANCELAMENTO DE PROVA ---
  static async cancelarProva(req, res) {
    const { id_pedido, id_remetente, id_prova, observacao } = req.body;
    if (!id_pedido) {
      return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (id_prova) {
        await client.query(`UPDATE agendamentos_prova SET status = 'Cancelada' WHERE id_prova = $1;`, [id_prova]);
      } else {
        await client.query(`UPDATE agendamentos_prova SET status = 'Cancelada' WHERE id_pedido = $1 AND status = 'Agendada';`, [id_pedido]);
      }

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

      await client.query(
        `UPDATE mensagens_chat
         SET dados_proposta = jsonb_set(COALESCE(dados_proposta::jsonb, '{}'::jsonb), '{status}', '"cancelada"')
         WHERE id_pedido = $1
           AND tipo_mensagem = 'proposta_prova'
           AND COALESCE(dados_proposta::jsonb->>'status', '') = 'aceita';`,
        [id_pedido]
      );

      const obsLimpa = (observacao || '').trim();
      const msgTexto = obsLimpa
        ? `PROVA CANCELADA!\nO agendamento da prova do Pedido #${id_pedido} foi cancelado.\nObservação: "${obsLimpa}"\nAlinhe uma nova data no chat.`
        : `PROVA CANCELADA!\nO agendamento da prova do Pedido #${id_pedido} foi cancelado. Alinhe uma nova data no chat.`;

      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_remetente || null, msgTexto]
      );

      await client.query('COMMIT');

      const [pedRes, osRes] = await Promise.all([
        pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]),
        pool.query('SELECT id_costureira FROM ordens_servico WHERE id_pedido = $1', [id_pedido])
      ]);

      const idCliente = pedRes.rows[0]?.id_cliente;
      const idCostureira = osRes.rows[0]?.id_costureira;
      const idDestinatario = Number(id_remetente) === Number(idCliente) ? idCostureira : idCliente;

      if (idDestinatario) {
        dispararNotificacao({
          idUsuario: idDestinatario,
          titulo: 'Prova Cancelada',
          mensagem: obsLimpa
            ? `A prova do Pedido #${id_pedido} foi cancelada. Observação: "${obsLimpa}"`
            : `A prova do Pedido #${id_pedido} foi cancelada. Verifique as mensagens no chat.`,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar cancelamento de prova:', err.message));
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

    await OrdemServicoController.sincronizarProvasVencidas();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const checkRes = await client.query(
        `SELECT status_kanban FROM ordens_servico WHERE id_pedido = $1;`,
        [id_pedido]
      );

      if (checkRes.rows[0]?.status_kanban === 'Aguardando Prova') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          erro: 'Não é possível concluir a peça enquanto houver uma prova agendada. Aguarde a prova ou cancele o agendamento.'
        });
      }

      await client.query(`UPDATE ordens_servico SET status_kanban = 'Concluído' WHERE id_pedido = $1;`, [id_pedido]);
      await client.query(`UPDATE pedidos SET status_pedido = 'Concluído' WHERE id_pedido = $1;`, [id_pedido]);

      const msgTexto = `PEÇA CONCLUÍDA!\nO serviço do seu pedido foi finalizado. Entre em contato para alinhar a retirada/entrega e confirme o recebimento assim que estiver com a peça em mãos.`;
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_costureira || null, msgTexto]
      );

      await client.query('COMMIT');

      const pedRes = await pool.query('SELECT id_cliente FROM pedidos WHERE id_pedido = $1', [id_pedido]);
      const idCliente = pedRes.rows[0]?.id_cliente;

      if (idCliente) {
        dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Sua Peça está Pronta!',
          mensagem: `O serviço do Pedido #${id_pedido} foi concluído. Alinhe a entrega e confirme o recebimento no aplicativo.`,
          tipo: 'status',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar conclusão de serviço:', err.message));
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
        `UPDATE ordens_servico 
         SET status_kanban = 'Entregue',
             data_entrega = CURRENT_DATE
         WHERE id_pedido = $1 
         RETURNING id_ordem_servico, id_costureira, TO_CHAR(data_entrega, 'YYYY-MM-DD') AS data_entrega;`,
        [id_pedido]
      );
      await client.query(`UPDATE pedidos SET status_pedido = 'Entregue' WHERE id_pedido = $1;`, [id_pedido]);

      const ordemServico = osResult.rows[0];

      const msgTexto = `ENTREGA CONFIRMADA!\nO/a cliente confirmou o recebimento da peça. O pedido foi finalizado com sucesso!`;
      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem) VALUES ($1, $2, $3, 'texto')`,
        [id_pedido, id_cliente || null, msgTexto]
      );

      await client.query('COMMIT');

      if (ordemServico?.id_costureira) {
        dispararNotificacao({
          idUsuario: ordemServico.id_costureira,
          titulo: 'Entrega Confirmada!',
          mensagem: `O/a cliente confirmou o recebimento do Pedido #${id_pedido}. O serviço foi finalizado com sucesso!`,
          tipo: 'status',
          idPedido: id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar entrega confirmada:', err.message));
      }

      return res.json({
        mensagem: 'Recebimento confirmado com sucesso!',
        id_ordem_servico: ordemServico?.id_ordem_servico || null,
        data_entrega: ordemServico?.data_entrega || null
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
        dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Seu Pedido está Pronto!',
          mensagem: `Sua peça do Pedido #${ordem.id_pedido} foi concluída. Confirme a entrega e deixe sua avaliação!`,
          tipo: 'avaliacao',
          idPedido: ordem.id_pedido,
          forcarWhatsapp: true
        }).catch((err) => console.error('Erro ao notificar conclusão kanban:', err.message));
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

  static async atualizarPagamento(req, res) {
    const idOrdem = req.params.idOrdem || req.params.id;
    const { status_pagamento } = req.body;

    const statusValidos = [
      'Aguardando Sinal',
      'Sinal Pago',
      'Aguardando Restante',
      'Aguardando Valor Total',
      'Pago Integralmente',
      'Em Débito'
    ];
    if (!status_pagamento || !statusValidos.includes(status_pagamento)) {
      return res.status(400).json({ erro: 'Status de pagamento inválido.' });
    }

    try {
      const ordemAtual = await OrdemServicoModel.buscarPorId(idOrdem);
      if (!ordemAtual) {
        return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      }

      if (!validarTransicaoPagamento(ordemAtual.status_pagamento, status_pagamento)) {
        return res.status(400).json({ erro: 'Não é permitido retornar o pagamento para uma etapa anterior.' });
      }

      const ordem = await OrdemServicoModel.atualizarPagamento(idOrdem, status_pagamento);
      return res.json({ mensagem: 'Status de pagamento atualizado!', status_pagamento, ordem });
    } catch (err) {
      console.error('Erro ao atualizar status de pagamento:', err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar status de pagamento.' });
    }
  }

  static async buscarPagamentoPorPedido(req, res) {
    const { idPedido } = req.params;
    try {
      const os = await OrdemServicoModel.buscarPorPedido(idPedido);
      if (!os) {
        return res.json({ possui_os: false, status_pagamento: null });
      }
      return res.json({
        possui_os: true,
        id_ordem_servico: os.id_ordem_servico,
        valor_total: Number(os.valor_total || 0),
        valor_entrada: Number(os.valor_entrada || 0),
        status_pagamento: os.status_pagamento
      });
    } catch (err) {
      console.error('Erro ao buscar pagamento por pedido:', err);
      return res.status(500).json({ erro: 'Erro ao consultar pagamento do pedido.' });
    }
  }

  static async atualizarPagamentoPorPedido(req, res) {
    const { idPedido } = req.params;
    const { status_pagamento, id_costureira } = req.body;

    const statusValidos = [
      'Aguardando Sinal',
      'Sinal Pago',
      'Aguardando Restante',
      'Aguardando Valor Total',
      'Pago Integralmente',
      'Em Débito'
    ];
    if (!status_pagamento || !statusValidos.includes(status_pagamento)) {
      return res.status(400).json({ erro: 'Status de pagamento inválido.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const osAtual = await OrdemServicoModel.buscarPorPedido(idPedido);
      if (!osAtual) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: 'Ordem de serviço não encontrada para este pedido.' });
      }

      if (!validarTransicaoPagamento(osAtual.status_pagamento, status_pagamento)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ erro: 'Não é permitido retornar o pagamento para uma etapa anterior.' });
      }

      const ordem = await OrdemServicoModel.atualizarPagamentoPorPedido(idPedido, status_pagamento);

      await client.query(
        `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem)
         VALUES ($1, $2, $3, 'texto')`,
        [idPedido, id_costureira || ordem.id_costureira || null, `STATUS DO PAGAMENTO ATUALIZADO: ${status_pagamento}.`]
      );

      await client.query('COMMIT');

      const idCliente = await OrdemServicoModel.buscarClientePorPedido(idPedido);
      if (idCliente) {
        dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Status de Pagamento Atualizado',
          mensagem: `O status de pagamento do Pedido #${idPedido} foi atualizado para: "${status_pagamento}".`,
          tipo: 'status',
          idPedido: idPedido,
          forcarWhatsapp: false
        }).catch((err) => console.error('Erro ao notificar atualização de pagamento:', err.message));
      }

      return res.json({ mensagem: 'Status de pagamento atualizado!', status_pagamento, ordem });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar pagamento por pedido:', err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar status de pagamento.' });
    } finally {
      client.release();
    }
  }

  static async adicionarFotoAndamento(req, res) {
    const idOrdem = req.params.idOrdem || req.params.id;
    const { url_imagem, legenda } = req.body;

    if (!url_imagem) {
      return res.status(400).json({ erro: 'Selecione uma imagem do andamento da peça.' });
    }

    try {
      const resultado = await OrdemServicoModel.adicionarFotoAndamento(idOrdem, { url_imagem, legenda });
      if (!resultado) {
        return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      }

      const idCliente = await OrdemServicoModel.buscarClientePorPedido(resultado.ordem.id_pedido);
      if (idCliente) {
        dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Nova Foto do Andamento da Peça',
          mensagem: `Uma nova atualização visual foi adicionada ao Pedido #${resultado.ordem.id_pedido}.`,
          tipo: 'status',
          idPedido: resultado.ordem.id_pedido,
          forcarWhatsapp: false
        }).catch((err) => console.error('Erro ao notificar foto andamento:', err.message));
      }

      return res.status(201).json({
        mensagem: 'Foto do andamento adicionada com sucesso!',
        fotosAndamento: resultado.fotosAndamento
      });
    } catch (err) {
      console.error('Erro ao salvar foto do andamento:', err);
      return res.status(500).json({ erro: 'Erro interno ao salvar foto do andamento.' });
    }
  }

  static async removerFotoAndamento(req, res) {
    const idOrdem = req.params.idOrdem || req.params.id;
    const { idFoto } = req.params;

    try {
      const resultado = await OrdemServicoModel.removerFotoAndamento(idOrdem, idFoto);
      if (!resultado) {
        return res.status(404).json({ erro: 'Ordem de serviço não encontrada.' });
      }
      return res.json({
        mensagem: 'Foto removida com sucesso!',
        fotosAndamento: resultado.fotosAndamento
      });
    } catch (err) {
      console.error('Erro ao remover foto do andamento:', err);
      return res.status(500).json({ erro: 'Erro interno ao remover foto.' });
    }
  }
}

// Verifica a cada 30 segundos em segundo plano (sem travar as requisições dos usuários)
setInterval(() => {
  OrdemServicoController.sincronizarProvasVencidas();
}, 30000);

module.exports = OrdemServicoController;