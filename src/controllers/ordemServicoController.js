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

  static async agendarProva(req, res) {
    const { id_pedido, dataProva, observacao, id_costureira } = req.body;
    if (!id_pedido || !dataProva) {
      return res.status(400).json({ erro: 'ID e data são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { idCliente, msgTexto } = await OrdemServicoModel.agendarProva(client, {
        id_pedido, 
        dataProva, 
        observacao, 
        id_costureira
      });

      await client.query('COMMIT');

      if (idCliente) {
        await dispararNotificacao({
          idUsuario: idCliente,
          titulo: 'Prova Agendada! 🗓️',
          mensagem: msgTexto,
          tipo: 'prova',
          idPedido: id_pedido,
          forcarWhatsapp: true
        });
      }

      return res.json({ mensagem: 'Prova agendada e cliente notificado!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao agendar prova:', err);
      return res.status(500).json({ erro: err.message });
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

    const statusValidos = ['A Fazer', 'Em Produção', 'Aguardando Prova', 'Concluído'];
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