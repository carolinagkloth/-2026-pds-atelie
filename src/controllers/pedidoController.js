const PedidoModel = require('../models/pedidoModel');

class PedidoController {
  static async criar(req, res) {
    try {
      const { id_cliente, descricao, fotos_referencia, prazo_desejado } = req.body;
      
      // Validação básica baseada no DER
      if (!id_cliente || !descricao) {
        return res.status(400).json({ error: 'ID do cliente e descrição são obrigatórios.' });
      }

      const id_pedido = await PedidoModel.create({ id_cliente, descricao, fotos_referencia, prazo_desejado });
      return res.status(201).json({ message: 'Pedido publicado com sucesso!', id_pedido });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listarTodos(req, res) {
    try {
      const pedidos = await PedidoModel.findAll();
      return res.status(200).json(pedidos);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_pedido } = req.body;
      
      const statusPermitidos = ['Aberto', 'Em Produção', 'Concluído', 'Cancelado'];
      if (!statusPermitidos.includes(status_pedido)) {
        return res.status(400).json({ error: 'Status de pedido inválido.' });
      }

      await PedidoModel.updateStatus(id, status_pedido);
      return res.status(200).json({ message: 'Status do pedido atualizado!' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PedidoController;