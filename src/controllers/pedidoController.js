const PedidoModel = require('../models/pedidoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class PedidoController {
  static async criar(req, res) {
    try {
      const id_cliente = req.body.id_cliente || req.usuarioId || (req.usuario && req.usuario.id);
      const { descricao, fotos_referencia, prazo_desejado, status_pedido } = req.body;
      
      if (!id_cliente || !descricao || !prazo_desejado) {
        return res.status(400).json({ error: 'ID do cliente, descrição e prazo desejado são obrigatórios.' });
      }

      const pedido = await PedidoModel.criar({ 
        id_cliente, 
        descricao, 
        fotos_referencia, 
        prazo_desejado, 
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
    const { descricao, fotos_referencia, prazo_desejado } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'A descrição do pedido é obrigatória.' });
    }

    try {
      const checagem = await PedidoModel.buscarPorId(id);
      if (!checagem) return res.status(404).json({ error: 'Pedido não encontrado.' });

      if (checagem.status_pedido !== 'Aberto') {
        return res.status(400).json({ error: 'Não é possível editar um pedido que já teve proposta aceita ou está em produção.' });
      }

      const pedidoAtualizado = await PedidoModel.atualizar(id, id_cliente, { descricao, fotos_referencia, prazo_desejado });
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
          mensagem: `O pedido #${id} foi cancelado pelo cliente.`,
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