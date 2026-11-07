const cron = require('node-cron');
const pool = require('../config/database');
const { dispararNotificacao } = require('../services/notificacaoService');

function iniciarCronJobs() {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Executando verificação diária de lembretes...');
    try {
      const query = `
        SELECT os.id_ordem_servico, os.id_pedido, os.status_kanban, os.previsao_entrega,
               cli.id_usuario AS id_cliente, cost.id_usuario AS id_costureira
        FROM ordens_servico os
        JOIN pedidos p ON os.id_pedido = p.id_pedido
        JOIN usuarios cli ON p.id_cliente = cli.id_usuario
        JOIN usuarios cost ON os.id_costureira = cost.id_usuario
        WHERE os.status_kanban IN ('Em Produção', 'Aguardando Prova')
          AND os.previsao_entrega = CURRENT_DATE + INTERVAL '1 day';
      `;
      const { rows } = await pool.query(query);

      for (const item of rows) {
        const tipoCompromisso = item.status_kanban === 'Aguardando Prova' ? 'Prova da Peça' : 'Entrega do Serviço';

        // Notificação para o Cliente
        await dispararNotificacao({
          idUsuario: item.id_cliente,
          titulo: 'Lembrete do Ateliê ⏰',
          mensagem: `Aviso de Véspera: Seu compromisso de ${tipoCompromisso} referente ao Pedido #${item.id_pedido} é AMANHÃ!`,
          tipo: 'lembrete',
          idPedido: item.id_pedido,
          forcarWhatsapp: true
        });

        // Notificação para a Costureira
        await dispararNotificacao({
          idUsuario: item.id_costureira,
          titulo: 'Lembrete de Agenda AMANHÃ 🗓️',
          mensagem: `Você possui um compromisso de ${tipoCompromisso} agendado para amanhã referente ao Pedido #${item.id_pedido}.`,
          tipo: 'lembrete',
          idPedido: item.id_pedido,
          forcarWhatsapp: true
        });
      }
    } catch (err) {
      console.error('Erro na rotina de lembretes:', err);
    }
  });
}

module.exports = { iniciarCronJobs };