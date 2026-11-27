const pool = require('../config/database');
const MensagemChatModel = require('../models/mensagemChatModel');
const PedidoModel = require('../models/pedidoModel');
const notificacaoModel = require('../models/notificacaoModel');
const { dispararNotificacao } = require('../services/notificacaoService');

class MensagemChatController {
  static async enviar(req, res, next) {
    try {
      const {
        id_pedido,
        conteudo,
        tipo_mensagem,
        dados_proposta,
        valor_proposta,
        prazo_proposta,
        valor_entrada,
        anexo_imagem
      } = req.body;
      const id_remetente = req.body.id_remetente || req.usuarioId || (req.usuario && req.usuario.id);

      if (!id_remetente) {
        return res.status(401).json({ error: 'Não foi possível identificar o usuário remetente.' });
      }

      if (!id_pedido || (!conteudo && !anexo_imagem)) {
        return res.status(400).json({ error: 'Informe uma mensagem ou anexe uma foto.' });
      }

      // Regra de negócio: só permite enviar um novo orçamento se o anterior foi recusado
      if (tipo_mensagem === 'proposta') {
        const propostaAtivaRes = await pool.query(
          `SELECT id_mensagem,
                  LOWER(COALESCE(dados_proposta::jsonb->>'status', 'pendente')) AS status_proposta
           FROM mensagens_chat
           WHERE id_pedido = $1
             AND id_remetente = $2
             AND tipo_mensagem = 'proposta'
             AND LOWER(COALESCE(dados_proposta::jsonb->>'status', 'pendente')) NOT IN ('recusada', 'cancelada')
           ORDER BY id_mensagem DESC
           LIMIT 1;`,
          [id_pedido, id_remetente]
        );

        if (propostaAtivaRes.rows.length > 0) {
          const statusAtual = propostaAtivaRes.rows[0].status_proposta;
          const msgErro =
            statusAtual === 'aceita'
              ? 'Já existe um orçamento aceito para este pedido.'
              : 'Você já possui um orçamento aguardando resposta do cliente. Só é possível enviar um novo orçamento se o anterior for recusado.';

          return res.status(400).json({ error: msgErro, erro: msgErro });
        }
      }

      const textoFinal = (conteudo || '').trim() || '📷 Foto enviada';

      let dadosPropostaTratados = dados_proposta;
      if (tipo_mensagem === 'proposta') {
        const objDados =
          typeof dados_proposta === 'string'
            ? JSON.parse(dados_proposta || '{}')
            : (dados_proposta ? { ...dados_proposta } : {});
        if (!objDados.status) {
          objDados.status = 'pendente';
        }
        dadosPropostaTratados = objDados;
      }

      const novaMensagem = await MensagemChatModel.criar({
        id_pedido,
        id_remetente,
        conteudo: textoFinal,
        tipo_mensagem: tipo_mensagem || (anexo_imagem ? 'imagem' : 'texto'),
        dados_proposta: dadosPropostaTratados,
        valor_proposta: valor_proposta || null,
        prazo_proposta: prazo_proposta || null,
        valor_entrada: valor_entrada || 0,
        anexo_imagem: anexo_imagem || null
      });

      const [pedido, idCostureira] = await Promise.all([
        PedidoModel.buscarPorId(id_pedido),
        PedidoModel.buscarCostureiraVinculada(id_pedido)
      ]);

      const idCliente = pedido?.id_cliente;
      const idDestinatario = Number(id_remetente) === Number(idCliente) ? idCostureira : idCliente;

      if (idDestinatario) {
        const tipoNotif = tipo_mensagem === 'proposta' ? 'proposta' : 'chat';
        const tituloNotif = tipo_mensagem === 'proposta' ? 'Nova Proposta Recebida' : 'Nova Mensagem no Chat';

        dispararNotificacao({
          idUsuario: idDestinatario,
          titulo: tituloNotif,
          mensagem: textoFinal,
          tipo: tipoNotif,
          idPedido: id_pedido,
          forcarWhatsapp: false
        }).catch((err) => console.error('Erro assíncrono ao notificar chat:', err.message));
      }

      return res.status(201).json({
        message: 'Mensagem enviada com sucesso!',
        mensagem: 'Mensagem enviada com sucesso!',
        id_mensagem: novaMensagem.id_mensagem,
        item: novaMensagem,
        ...novaMensagem
      });
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listar(req, res, next) {
    try {
      const id_pedido = req.params.idPedido || req.params.id_pedido;
      const idUsuarioLeitor = req.query.id_usuario || req.query.idUsuario || req.usuarioId;

      if (idUsuarioLeitor && id_pedido) {
        Promise.all([
          MensagemChatModel.marcarComoLidas(id_pedido, idUsuarioLeitor),
          typeof notificacaoModel.marcarComoLidasPorPedido === 'function'
            ? notificacaoModel.marcarComoLidasPorPedido(idUsuarioLeitor, id_pedido)
            : Promise.resolve()
        ]).catch((errLeitura) => {
          console.error('Aviso ao marcar mensagens/notificações como lidas:', errLeitura.message);
        });
      }

      const mensagens = await MensagemChatModel.listarPorPedido(id_pedido);
      return res.status(200).json(mensagens);
    } catch (error) {
      if (next) return next(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async listarConversasDoUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const conversas = await MensagemChatModel.buscarConversasUsuario(idUsuario);
      return res.status(200).json(conversas);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MensagemChatController;