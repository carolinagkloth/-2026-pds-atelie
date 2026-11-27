import React, { useState, useEffect } from 'react';

function ModalMedidas({ isOpen, onClose, medidasAtuais, onSalvar }) {
  const [medidas, setMedidas] = useState(medidasAtuais);

  useEffect(() => {
    setMedidas(medidasAtuais);
  }, [medidasAtuais]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#3E2445' }}>Editar Ficha de Medidas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <input type="text" placeholder="Busto (cm)" value={medidas.busto || ''} onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Cintura (cm)" value={medidas.cintura || ''} onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Quadril (cm)" value={medidas.quadril || ''} onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <textarea placeholder="Outras medidas e observações" value={medidas.observacoes_medidas || ''} onChange={(e) => setMedidas({ ...medidas, observacoes_medidas: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 14px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={() => onSalvar(medidas)} style={{ padding: '8px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Medidas</button>
        </div>
      </div>
    </div>
  );
}

export default ModalMedidas;