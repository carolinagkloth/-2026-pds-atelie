import React, { useState, useEffect } from 'react';

function ModalMedidas({ isOpen, onClose, medidasAtuais, medidas: medidasProp, onSalvar, carregando = false }) {
  const [medidas, setMedidas] = useState(medidasAtuais || medidasProp || {});

  useEffect(() => {
    if (isOpen) {
      setMedidas(medidasAtuais || medidasProp || {});
    }
  }, [isOpen, medidasAtuais, medidasProp]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSalvar && !carregando) {
      onSalvar(medidas);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '100%', boxShadow: '0 8px 30px rgba(62, 36, 69, 0.25)' }}
      >
        <h3 style={{ marginTop: 0, color: '#3E2445' }}>Editar Ficha de Medidas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '3px', color: '#444' }}>Busto (cm)</label>
            <input
              type="text"
              placeholder="Ex: 90"
              disabled={carregando}
              value={medidas?.busto || ''}
              onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '3px', color: '#444' }}>Cintura (cm)</label>
            <input
              type="text"
              placeholder="Ex: 72"
              disabled={carregando}
              value={medidas?.cintura || ''}
              onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '3px', color: '#444' }}>Quadril (cm)</label>
            <input
              type="text"
              placeholder="Ex: 98"
              disabled={carregando}
              value={medidas?.quadril || ''}
              onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '3px', color: '#444' }}>Outras medidas e observações</label>
            <textarea
              rows="3"
              placeholder="Comprimento, ombro, observações..."
              disabled={carregando}
              value={medidas?.observacoes_medidas || ''}
              onChange={(e) => setMedidas({ ...medidas, observacoes_medidas: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={carregando}
            onClick={onClose}
            style={{ padding: '8px 14px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={carregando}
            style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: carregando ? 0.7 : 1 }}
          >
            {carregando ? 'Salvando...' : 'Salvar Medidas'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModalMedidas;