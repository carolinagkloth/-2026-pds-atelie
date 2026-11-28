import React, { useState, useEffect, useRef } from 'react';

function ModalProva({ isOpen, onClose, onEnviar, enderecoCostureira, onIrParaPerfil, carregando = false }) {
  const [dataProva, setDataProva] = useState('');
  const [horarioProva, setHorarioProva] = useState('14:00');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const submetendoRef = useRef(false);

  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    if (isOpen) {
      setDataProva('');
      setHorarioProva('14:00');
      setObservacao('');
      setErro('');
      submetendoRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!carregando) {
      submetendoRef.current = false;
    }
  }, [carregando]);

  if (!isOpen) return null;

  const enderecoLimpo = (enderecoCostureira || '').trim();
  const bloqueado = !enderecoLimpo || carregando;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (carregando || submetendoRef.current) return;
    setErro('');

    if (!enderecoLimpo) {
      setErro('Cadastre seu endereço de atendimento no Perfil antes de propor uma prova.');
      return;
    }

    if (!dataProva) {
      setErro('Selecione a data sugerida para a prova.');
      return;
    }

    if (!horarioProva) {
      setErro('Informe o horário obrigatório para a prova.');
      return;
    }

    if (dataProva === hoje && horarioProva <= horaAtual) {
      setErro(`Para hoje, escolha um horário posterior ao horário atual (${horaAtual}).`);
      return;
    }

    submetendoRef.current = true;
    onEnviar({
      dataProva,
      horarioProva,
      observacao,
      local: enderecoLimpo
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 18, 34, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '430px', maxWidth: '100%', boxShadow: '0 8px 30px rgba(62, 36, 69, 0.25)', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
        <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#3E2445' }}>Propor Data para Prova da Peça</h3>
        <p style={{ marginTop: 0, marginBottom: '14px', fontSize: '12.5px', color: '#666' }}>
          O/a cliente receberá esta sugestão no chat para confirmar se pode comparecer no dia e horário.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Data Sugerida *</label>
              <input
                type="date"
                min={hoje}
                value={dataProva}
                disabled={carregando}
                onChange={(e) => setDataProva(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Horário da Prova *</label>
              <input
                type="time"
                min={dataProva === hoje ? horaAtual : undefined}
                value={horarioProva}
                disabled={carregando}
                onChange={(e) => setHorarioProva(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          <div
            style={{
              background: enderecoLimpo ? '#FAF6FA' : '#FFF8E1',
              border: enderecoLimpo ? '1px solid #EADCEB' : '1px solid #FFE082',
              borderLeft: `4px solid ${enderecoLimpo ? '#3E2445' : '#F57C00'}`,
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontSize: '13px'
            }}
          >
            <strong style={{ display: 'block', color: enderecoLimpo ? '#3E2445' : '#E65100', marginBottom: '3px' }}>
              Local da Prova (seu endereço cadastrado):
            </strong>
            {enderecoLimpo ? (
              <span style={{ color: '#333' }}>{enderecoLimpo}</span>
            ) : (
              <div style={{ color: '#5D4037', fontSize: '12.5px' }}>
                Você ainda não cadastrou um endereço no seu perfil.
                {onIrParaPerfil && (
                  <button
                    type="button"
                    onClick={onIrParaPerfil}
                    style={{
                      display: 'block',
                      marginTop: '6px',
                      padding: '5px 10px',
                      background: '#3E2445',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Completar Endereço no Meu Perfil
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Observações (opcional)</label>
            <textarea
              rows="2"
              value={observacao}
              disabled={carregando}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Traga o sapato que usará com a peça..."
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {erro && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '9px 12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '12px' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={carregando}
              onClick={onClose}
              style={{ padding: '9px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: carregando ? 'not-allowed' : 'pointer', opacity: carregando ? 0.6 : 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={bloqueado}
              style={{
                padding: '9px 16px',
                background: '#2E7D32',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: !bloqueado ? 'pointer' : 'not-allowed',
                opacity: !bloqueado ? 1 : 0.6
              }}
            >
              {carregando ? 'Enviando...' : 'Enviar Sugestão de Prova'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProva;