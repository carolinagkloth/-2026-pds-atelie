const OrdemServicoModel = require('../models/ordemServicoModel');
const usuarioModel = require('../models/usuarioModel');

class OrdemServicoController {
  // POST /api/ordens-servico
  static async criar(req, res) {
    try {
      const { id_pedido, id_costureira, valor_total, previsao_entrega, status_kanban } = req.body;

      // Validação de campos obrigatórios
      if (!id_pedido || !id_costureira || !valor_total) {
        return res.status(400).json({ 
          error: 'Os campos id_pedido, id_costureira e valor_total são obrigatórios.' 
        });
      }

      // Validação do perfil da costureira
      const costureira = await usuarioModelModel.buscarPorId(id_costureira);
      if (!costureira || costureira.tipo_usuario !== 'Costureira') {
        return res.status(400).json({ 
          error: 'O id_costureira informado não pertence a uma costureira válida.' 
        });
      }

      const idInserido = await OrdemServicoModel.criar({
        id_pedido,
        id_costureira,
        valor_total,
        previsao_entrega,
        status_kanban
      });

      return res.status(201).json({
        message: 'Ordem de Serviço criada com sucesso!',
        id_ordem_servico: idInserido
      });
    } catch (error) {
      console.error('Erro ao criar Ordem de Serviço:', error);
      return res.status(500).json({ error: 'Erro interno ao criar ordem de serviço.' });
    }
  }

  // GET /api/ordens-servico
  static async listarTodos(req, res) {
    try {
      const ordens = await OrdemServicoModel.listarTodos();
      return res.status(200).json(ordens);
    } catch (error) {
      console.error('Erro ao listar Ordens de Serviço:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar ordens de serviço.' });
    }
  }

  // GET /api/ordens-servico/:id
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const ordem = await OrdemServicoModel.buscarPorId(id);

      if (!ordem) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      }

      return res.status(200).json(ordem);
    } catch (error) {
      console.error('Erro ao buscar Ordem de Serviço:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar ordem de serviço.' });
    }
  }

  // PATCH /api/ordens-servico/:id/status
  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_kanban } = req.body;

      const statusValidos = ['A Fazer', 'Em Produção', 'Aguardando Prova', 'Concluído'];
      
      if (!status_kanban || !statusValidos.includes(status_kanban)) {
        return res.status(400).json({ 
          error: `Status inválido. Use um dos valores: ${statusValidos.join(', ')}` 
        });
      }

      const atualizado = await OrdemServicoModel.atualizarStatus(id, status_kanban);

      if (!atualizado) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      }

      return res.status(200).json({ message: 'Status do Kanban atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar status da OS:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar status.' });
    }
  }
}

module.exports = OrdemServicoController;