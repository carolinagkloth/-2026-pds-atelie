import React, { useState, useEffect, useRef } from 'react';
import { comprimirImagem } from '../../services/comprimirImagem';

const COLUNAS_KANBAN = [
  { id: 'A Fazer', titulo: 'A Fazer', cor: '#757575' },
  { id: 'Em Produção', titulo: 'Em Produção', cor: '#29B6F6' },
  { id: 'Aguardando Prova', titulo: 'Aguardando Prova', cor: '#FFA726' },
  { id: 'Concluído', titulo: 'Concluído', cor: '#66BB6A' }
];

const OPCOES_COM_SINAL = [
  'Aguardando Sinal',
  'Sinal Pago',
  'Aguardando Restante',
  'Pago Integralmente',
  'Em Débito'
];

const OPCOES_SEM_SINAL = [
  'Aguardando Valor Total',
  'Pago Integralmente',
  'Em Débito'
];

const ORDEM_ETAPA = {
  'Aguardando Sinal': 1,
  'Aguardando Valor Total': 1,
  'Sinal Pago': 2,
  'Aguardando Restante': 2,
  'Em Débito': 2,
  'Pago Integralmente': 3
};

const podeAvancarPara = (statusAtual, destino) => {
  if (destino === statusAtual) return true;
  if (statusAtual === 'Pago Integralmente') return false;

  const nivelAtual = ORDEM_ETAPA[statusAtual] || 1;
  const nivelDestino = ORDEM_ETAPA[destino] || 1;

  if (destino === 'Em Débito') return true;
  if (statusAtual === 'Em Débito' && destino === 'Aguardando Sinal') return false;

  return nivelDestino >= nivelAtual;
};

const estiloBadgePagamento = (status) => {
  if (status === 'Pago Integralmente') {
    return { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' };
  }
  if (status === 'Sinal Pago' || status === 'Aguardando Restante') {
    return { background: '#E3F2FD', color: '#1565C0', border: '1px solid #90CAF9' };
  }
  if (status === 'Em Débito') {
    return { background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' };
  }
  return { background: '#FFF8E1', color: '#EF6C00', border: '1px solid #FFE082' };
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcularRestante = (total, entrada, statusAtual) => {
  if (statusAtual === 'Pago Integralmente') return 0;
  if (statusAtual === 'Sinal Pago' || statusAtual === 'Aguardando Restante') {
    return Math.max(total - entrada, 0);
  }
  return total;
};

function KanbanOrdens({ idCostureira, onNavigate }) {
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [pagamentoConfirmar, setPagamentoConfirmar] = useState(null);
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  const [ordemFotosModal, setOrdemFotosModal] = useState(null);
  const [legendaFoto, setLegendaFoto] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [fotoZoom, setFotoZoom] = useState(null);
  const inputFotoOSRef = useRef(null);

  const carregarOrdens = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/ordens-servico/usuario/${idCostureira}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao carregar ordens de serviço.');
      const lista = Array.isArray(data) ? data : [];
      setOrdens(lista);

      if (ordemFotosModal) {
        const atualizada = lista.find((o) => o.id === ordemFotosModal.id);
        if (atualizada) setOrdemFotosModal(atualizada);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (idCostureira) carregarOrdens();
  }, [idCostureira]);

  const handleMoverStatus = async (idOrdem, novoStatus) => {
    try {
      const response = await fetch(`/api/ordens-servico/${idOrdem}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_kanban: novoStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao mudar status.');

      setOrdens((prev) =>
        prev.map((ordem) =>
          ordem.id === idOrdem ? { ...ordem, statusKanban: novoStatus } : ordem
        )
      );
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleConfirmarAlteracaoPagamento = async () => {
    if (!pagamentoConfirmar || salvandoPagamento) return;
    const { idOrdem, idPedido, novoPagamento } = pagamentoConfirmar;

    setSalvandoPagamento(true);
    try {
      const url = idPedido
        ? `/api/ordens-servico/pedido/${idPedido}/pagamento`
        : `/api/ordens-servico/${idOrdem}/pagamento`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_pagamento: novoPagamento,
          id_costureira: Number(idCostureira)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao atualizar pagamento.');

      setOrdens((prev) =>
        prev.map((ordem) =>
          ordem.id === idOrdem
            ? { ...ordem, statusPagamento: novoPagamento, status_pagamento: novoPagamento }
            : ordem
        )
      );
      setPagamentoConfirmar(null);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvandoPagamento(false);
    }
  };

  const handleUploadFotoOS = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !ordemFotosModal) return;

    setEnviandoFoto(true);
    try {
      const base64Comprimido = await comprimirImagem(arquivo, { maxLargura: 1080, qualidade: 0.75 });
      const response = await fetch(`/api/ordens-servico/${ordemFotosModal.id}/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_imagem: base64Comprimido,
          legenda: legendaFoto
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao enviar foto.');

      setLegendaFoto('');
      setOrdens((prev) =>
        prev.map((o) => (o.id === ordemFotosModal.id ? { ...o, fotosAndamento: data.fotosAndamento } : o))
      );
      setOrdemFotosModal((prev) => (prev ? { ...prev, fotosAndamento: data.fotosAndamento } : null));
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviandoFoto(false);
      e.target.value = '';
    }
  };

  const handleRemoverFotoOS = async (idFoto) => {
    if (!ordemFotosModal || !window.confirm('Remover esta foto do andamento da OS?')) return;
    try {
      const response = await fetch(`/api/ordens-servico/${ordemFotosModal.id}/fotos/${idFoto}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao remover foto.');

      setOrdens((prev) =>
        prev.map((o) => (o.id === ordemFotosModal.id ? { ...o, fotosAndamento: data.fotosAndamento } : o))
      );
      setOrdemFotosModal((prev) => (prev ? { ...prev, fotosAndamento: data.fotosAndamento } : null));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '30px auto', padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#3E2445', margin: 0 }}>Quadro Kanban - Ordens de Serviço</h2>
        {onNavigate && (
          <button
            onClick={() => onNavigate('perfil')}
            style={{ padding: '8px 16px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Ver Perfil
          </button>
        )}
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#666' }}>Carregando quadro...</p>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px' }}>{erro}</div>}

      {!carregando && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {COLUNAS_KANBAN.map((coluna) => {
            const ordensDaColuna = ordens.filter(
              (o) => (o.statusKanban || 'A Fazer') === coluna.id
            );

            return (
              <div
                key={coluna.id}
                style={{
                  background: '#FAF8F5',
                  borderRadius: '10px',
                  padding: '15px',
                  borderTop: `5px solid ${coluna.cor}`,
                  minHeight: '400px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#3E2445' }}>{coluna.titulo}</h3>
                  <span style={{ background: '#E8D5C4', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {ordensDaColuna.length}
                  </span>
                </div>

                {ordensDaColuna.map((item) => {
                  const total = Number(item.valorTotal || 0);
                  const entrada = Number(item.valorEntrada || 0);
                  const temSinal = entrada > 0;

                  const opcoesPagamento = temSinal ? OPCOES_COM_SINAL : OPCOES_SEM_SINAL;
                  const statusBruto = item.statusPagamento || item.status_pagamento || '';
                  const statusPag = opcoesPagamento.includes(statusBruto)
                    ? statusBruto
                    : (temSinal ? 'Aguardando Sinal' : 'Aguardando Valor Total');

                  const restante = calcularRestante(total, entrada, statusPag);
                  const fotos = Array.isArray(item.fotosAndamento) ? item.fotosAndamento : [];
                  const badgePag = estiloBadgePagamento(statusPag);
                  const encerrado = statusPag === 'Pago Integralmente';

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid #E8D5C4',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      <strong style={{ display: 'block', color: '#3E2445', fontSize: '14px', marginBottom: '4px' }}>
                        Cliente: {item.clienteNome}
                      </strong>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                        {item.pedidoDescricao}
                      </p>

                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                        <strong>Valor Total:</strong> {formatarMoeda(total)}
                        {temSinal && (
                          <span> (Sinal: {formatarMoeda(entrada)})</span>
                        )}
                        <br />
                        <strong>Restante a Pagar:</strong>{' '}
                        <span style={{ color: restante === 0 ? '#2E7D32' : '#3E2445', fontWeight: 'bold' }}>
                          {formatarMoeda(restante)}
                        </span>
                        <br />
                        <strong>Entrega:</strong> {item.previsaoEntrega ? new Date(item.previsaoEntrega).toLocaleDateString('pt-BR') : 'Não informada'}
                      </div>

                      {/* Controle de Pagamento (RF10) */}
                      <div style={{ marginBottom: '10px', padding: '8px', background: '#FAF7FA', borderRadius: '6px', border: '1px solid #EADCEB' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>
                          Status do Pagamento:
                        </label>
                        <select
                          value={statusPag}
                          disabled={encerrado}
                          onChange={(e) => {
                            const escolhido = e.target.value;
                            if (escolhido !== statusPag) {
                              setPagamentoConfirmar({
                                idOrdem: item.id,
                                idPedido: item.idPedido,
                                statusAtual: statusPag,
                                novoPagamento: escolhido
                              });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: encerrado ? 'not-allowed' : 'pointer',
                            ...badgePag
                          }}
                        >
                          {opcoesPagamento.map((op) => (
                            <option
                              key={op}
                              value={op}
                              disabled={!podeAvancarPara(statusPag, op)}
                            >
                              {op}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fotos do Andamento da Peça (RF21) */}
                      <div style={{ marginBottom: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setOrdemFotosModal(item)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            background: '#F4EFF5',
                            color: '#3E2445',
                            border: '1px solid #D8C7DA',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Fotos do Andamento ({fotos.length})
                        </button>
                      </div>

                      {/* Botões para transição de status */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                        {coluna.id !== 'A Fazer' && (
                          <button
                            onClick={() => {
                              const prevIndex = COLUNAS_KANBAN.findIndex((c) => c.id === coluna.id) - 1;
                              handleMoverStatus(item.id, COLUNAS_KANBAN[prevIndex].id);
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Voltar
                          </button>
                        )}

                        {coluna.id !== 'Concluído' && (
                          <button
                            onClick={() => {
                              const nextIndex = COLUNAS_KANBAN.findIndex((c) => c.id === coluna.id) + 1;
                              handleMoverStatus(item.id, COLUNAS_KANBAN[nextIndex].id);
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
                          >
                            Avançar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Alteração de Pagamento */}
      {pagamentoConfirmar && (
        <div
          onClick={() => !salvandoPagamento && setPagamentoConfirmar(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '430px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#3E2445', fontSize: '18px' }}>
              Confirmar Atualização de Pagamento
            </h3>

            <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#444', lineHeight: '1.5' }}>
              Você está prestes a alterar o status financeiro deste pedido de{' '}
              <strong>{pagamentoConfirmar.statusAtual}</strong> para{' '}
              <strong style={{ color: '#3E2445' }}>{pagamentoConfirmar.novoPagamento}</strong>.
            </p>

            <div
              style={{
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12.5px',
                color: '#5D4037',
                lineHeight: '1.5',
                marginBottom: '18px'
              }}
            >
              <strong>Aviso importante:</strong> Esta ferramenta é destinada apenas ao controle e organização de quem presta o serviço de costura, pois os pagamentos são combinados diretamente fora da plataforma. Após confirmar, não será possível retornar para etapas anteriores e o/a cliente será notificado(a) no chat.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={salvandoPagamento}
                onClick={() => setPagamentoConfirmar(null)}
                style={{
                  padding: '9px 16px',
                  background: '#EEE',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoPagamento}
                onClick={handleConfirmarAlteracaoPagamento}
                style={{
                  padding: '9px 16px',
                  background: '#3E2445',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {salvandoPagamento ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fotos do Andamento da OS (RF21) */}
      {ordemFotosModal && (
        <div
          onClick={() => setOrdemFotosModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '12px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '22px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#3E2445', fontSize: '18px' }}>
                Andamento da Peça — Pedido #{ordemFotosModal.idPedido}
              </h3>
              <button
                onClick={() => setOrdemFotosModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
              >
                Fechar
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#666', marginTop: 0, marginBottom: '15px' }}>
              Cliente: <strong>{ordemFotosModal.clienteNome}</strong> • {ordemFotosModal.pedidoDescricao}
            </p>

            {/* Formulário de envio de nova foto */}
            <div style={{ background: '#FAF7FA', padding: '12px', borderRadius: '8px', border: '1px solid #EADCEB', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Legenda opcional (ex.: Corte do tecido, Prova de ajuste...)"
                value={legendaFoto}
                onChange={(e) => setLegendaFoto(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px', boxSizing: 'border-box', fontSize: '13px' }}
              />
              <input
                ref={inputFotoOSRef}
                type="file"
                accept="image/*"
                onChange={handleUploadFotoOS}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                disabled={enviandoFoto}
                onClick={() => inputFotoOSRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#3E2445',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {enviandoFoto ? 'Comprimindo e enviando...' : 'Tirar Foto ou Anexar Imagem do Andamento'}
              </button>
            </div>

            {/* Galeria de fotos já enviadas */}
            {(!ordemFotosModal.fotosAndamento || ordemFotosModal.fotosAndamento.length === 0) ? (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '20px 0' }}>
                Nenhuma foto do andamento registrada nesta Ordem de Serviço ainda.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {ordemFotosModal.fotosAndamento.map((foto) => (
                  <div key={foto.id} style={{ border: '1px solid #E0D0E0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                    <img
                      src={foto.url}
                      alt={foto.legenda || 'Andamento da peça'}
                      onClick={() => setFotoZoom(foto.url)}
                      style={{ width: '100%', height: '130px', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
                    />
                    <div style={{ padding: '8px', fontSize: '11.5px', color: '#444' }}>
                      {foto.legenda && <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{foto.legenda}</div>}
                      <div style={{ color: '#888', fontSize: '10.5px', marginBottom: '6px' }}>
                        {foto.data ? new Date(foto.data).toLocaleDateString('pt-BR') : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverFotoOS(foto.id)}
                        style={{ width: '100%', padding: '4px', background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {fotoZoom && (
        <div
          onClick={() => setFotoZoom(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', cursor: 'zoom-out' }}
        >
          <img src={fotoZoom} alt="Foto ampliada" style={{ maxWidth: '92%', maxHeight: '90vh', borderRadius: '10px' }} />
        </div>
      )}
    </div>
  );
}

export default KanbanOrdens;