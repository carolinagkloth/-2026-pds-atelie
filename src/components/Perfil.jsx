import React, { useState, useEffect } from 'react';
import "../styles/Perfil.css";
import Portfolio from './Portfolio';
import TabelaPrecos from './TabelaPrecos';
import Agenda from './Agenda';
import { comprimirImagem } from '../services/comprimirImagem';

function Perfil({ usuario, onNavigate, onUpdateUsuario }) {
  const usuarioSalvo = (() => {
    try {
      const item = localStorage.getItem('usuarioAtelie');
      return item && item !== 'undefined' ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const user = usuario && Object.keys(usuario).length > 0 ? usuario : usuarioSalvo;
  const idUsuario = user?.id_usuario || user?.id;
  const isCliente = (user?.tipo_usuario || user?.tipoUsuario || 'Cliente').toString().toLowerCase() === 'cliente';

  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [erroImagem, setErroImagem] = useState(false);

  const [reputacao, setReputacao] = useState({ media: 0, totalAvaliacoes: 0, depoimentos: [] });

  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    bio: user?.bio || '',
    especialidades: user?.especialidades || '',
    foto_perfil: user?.foto_perfil || ''
  });

  // Ficha de Medidas do Cliente (RF07)
  const [medidas, setMedidas] = useState({
    busto: '',
    cintura: '',
    quadril: '',
    altura: '',
    comprimento: '',
    observacoes_medidas: ''
  });
  const [salvandoMedidas, setSalvandoMedidas] = useState(false);
  const [msgMedidas, setMsgMedidas] = useState('');

  useEffect(() => {
    if (idUsuario) {
      fetch(`/api/usuarios/${idUsuario}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.erro) {
            setFormData({
              nome: data.nome || '',
              email: data.email || '',
              telefone: data.telefone || '',
              endereco: data.endereco || '',
              bio: data.bio || '',
              especialidades: data.especialidades || '',
              foto_perfil: data.foto_perfil || ''
            });
          }
        })
        .catch(() => {});

      if (isCliente) {
        fetch(`/api/usuarios/${idUsuario}/medidas`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.erro) {
              setMedidas({
                busto: data.busto || '',
                cintura: data.cintura || '',
                quadril: data.quadril || '',
                altura: data.altura || '',
                comprimento: data.comprimento || '',
                observacoes_medidas: data.observacoes_medidas || ''
              });
            }
          })
          .catch(() => {});
      } else {
        fetch(`/api/avaliacoes/costureira/${idUsuario}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.erro) {
              setReputacao({
                media: data.media || data.media_nota || 0,
                totalAvaliacoes: data.totalAvaliacoes || data.total_avaliacoes || 0,
                depoimentos: data.depoimentos || data.avaliacoes || []
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [idUsuario, isCliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const comprimida = await comprimirImagem(file, { maxLargura: 600, qualidade: 0.8 });
      setErroImagem(false);
      setFormData((prev) => ({ ...prev, foto_perfil: comprimida }));
    } catch (err) {
      alert(err.message || 'Erro ao carregar foto de perfil.');
    }
  };

  const handleRemoverFoto = () => {
    setErroImagem(false);
    setFormData((prev) => ({ ...prev, foto_perfil: '' }));
  };

  const handleIniciarEdicao = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMensagem('');
    setErro('');
    setEditando(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setErro('');

    if (!isCliente && !formData.endereco.trim()) {
      setErro('O endereço de atendimento é obrigatório para profissionais de costura.');
      return;
    }

    setCarregando(true);

    try {
      const payload = {
        ...formData,
        endereco: formData.endereco.trim()
      };

      const response = await fetch(`/api/usuarios/${idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch {
        throw new Error('Servidor retornou uma resposta inválida.');
      }

      if (!response.ok) {
        throw new Error(data.erro || data.error || 'Erro ao atualizar perfil.');
      }

      const usuarioAtualizado = data.usuario || { ...user, ...payload };
      localStorage.setItem('usuarioAtelie', JSON.stringify(usuarioAtualizado));

      if (onUpdateUsuario) {
        onUpdateUsuario(usuarioAtualizado);
      }

      setMensagem('Perfil atualizado com sucesso!');
      setEditando(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // --- FUNÇÕES DA FICHA DE MEDIDAS (RF07) ---
  const handleSalvarMedidas = async (e) => {
    e.preventDefault();
    setSalvandoMedidas(true);
    setMsgMedidas('');
    try {
      const res = await fetch(`/api/usuarios/${idUsuario}/medidas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medidas)
      });
      if (!res.ok) throw new Error('Erro ao salvar medidas.');
      setMsgMedidas('Ficha de medidas salva com sucesso!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoMedidas(false);
    }
  };

  const possuiAlgumaMedida = () => {
    return Object.values(medidas).some((v) => String(v || '').trim() !== '');
  };

  const handleExportarMedidasTXT = () => {
    if (!possuiAlgumaMedida()) {
      alert('Preencha ao menos uma medida antes de exportar.');
      return;
    }

    const texto = [
      '========================================',
      'ATELIÊ ENTRE LINHAS - FICHA DE MEDIDAS',
      '========================================',
      `Cliente: ${formData.nome || 'Não informado'}`,
      `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
      '----------------------------------------',
      `Busto: ${medidas.busto ? `${medidas.busto} cm` : '-'}`,
      `Cintura: ${medidas.cintura ? `${medidas.cintura} cm` : '-'}`,
      `Quadril: ${medidas.quadril ? `${medidas.quadril} cm` : '-'}`,
      `Altura: ${medidas.altura ? `${medidas.altura} cm` : '-'}`,
      `Comprimento: ${medidas.comprimento ? `${medidas.comprimento} cm` : '-'}`,
      '----------------------------------------',
      'Observações:',
      medidas.observacoes_medidas || 'Nenhuma observação adicional.',
      '========================================'
    ].join('\n');

    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Medidas_${(formData.nome || 'Cliente').replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportarMedidasPDF = () => {
    if (!possuiAlgumaMedida()) {
      alert('Preencha ao menos uma medida antes de exportar.');
      return;
    }

    const janela = window.open('', '_blank', 'width=720,height=820');
    if (!janela) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Ficha de Medidas - ${formData.nome || 'Cliente'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2D2230; padding: 36px; }
          .topo { background: #3E2445; color: #fff; padding: 20px 24px; border-radius: 10px; }
          .topo h1 { margin: 0; font-size: 20px; }
          .topo p { margin: 4px 0 0 0; font-size: 13px; color: #EADCEB; }
          .info { margin: 20px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #D8C7DA; padding: 10px 14px; text-align: left; font-size: 14px; }
          th { background: #FAF6FA; color: #3E2445; width: 45%; }
          .obs { margin-top: 18px; padding: 14px; background: #FAF7FA; border-left: 4px solid #3E2445; border-radius: 6px; font-size: 13.5px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="topo">
          <h1>Ateliê Entre Linhas — Ficha de Medidas Corporais</h1>
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="info">
          <strong>Cliente:</strong> ${formData.nome || 'Não informado'}<br/>
          <strong>Contato:</strong> ${formData.telefone || formData.email || '-'}
        </div>
        <table>
          <tr><th>Busto</th><td>${medidas.busto ? `${medidas.busto} cm` : '-'}</td></tr>
          <tr><th>Cintura</th><td>${medidas.cintura ? `${medidas.cintura} cm` : '-'}</td></tr>
          <tr><th>Quadril</th><td>${medidas.quadril ? `${medidas.quadril} cm` : '-'}</td></tr>
          <tr><th>Altura</th><td>${medidas.altura ? `${medidas.altura} cm` : '-'}</td></tr>
          <tr><th>Comprimento</th><td>${medidas.comprimento ? `${medidas.comprimento} cm` : '-'}</td></tr>
        </table>
        <div class="obs">
          <strong>Observações:</strong><br/>
          ${(medidas.observacoes_medidas || 'Nenhuma observação registrada.').replace(/\n/g, '<br/>')}
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    janela.document.close();
  };

  // --- EXCLUSÃO DE CONTA (RF06) ---
  const handleExcluirConta = async () => {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir permanentemente sua conta e todos os seus dados pessoais? Esta ação não pode ser desfeita.'
    );
    if (!confirmou) return;

    try {
      const res = await fetch(`/api/usuarios/${idUsuario}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.erro || 'Não foi possível excluir a conta.');
      }
      localStorage.removeItem('usuarioAtelie');
      alert('Sua conta foi excluída com sucesso.');
      if (onNavigate) onNavigate('inicio');
    } catch (err) {
      alert(err.message);
    }
  };

  const primeiraLetra = (formData.nome || user?.nome || 'U').trim().charAt(0).toUpperCase();

  const handleVoltar = () => {
    if (onNavigate) {
      onNavigate(isCliente ? 'meusPedidos' : 'feedPedidos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioAtelie');
    if (onNavigate) {
      onNavigate('inicio');
    }
  };

  const renderEstrelas = (nota) => {
    const valor = Math.round(nota || 0);
    return '★'.repeat(valor) + '☆'.repeat(5 - valor);
  };

  return (
    <div className="perfil-container" style={{ maxWidth: '750px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      <div className="perfil-header-topo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
        <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>
          {isCliente ? 'Meu Perfil' : 'Perfil Profissional'}
        </h2>
        <button
          type="button"
          onClick={handleVoltar}
          style={{ padding: '8px 14px', background: '#F4EFF5', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          ← Voltar
        </button>
      </div>

      {mensagem && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{mensagem}</div>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{erro}</div>}

      {/* Resumo de Reputação */}
      {!isCliente && (
        <div style={{ background: '#FAF6FA', border: '1px solid #EADCEB', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, color: '#3E2445', fontSize: '16px' }}>Reputação & Avaliações</h3>
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '22px', color: '#FFB400', fontWeight: 'bold' }}>
                {reputacao.media ? Number(reputacao.media).toFixed(1) : '0.0'}
              </span>
              <span style={{ fontSize: '18px', color: '#FFB400' }}>
                {renderEstrelas(reputacao.media)}
              </span>
              <span style={{ fontSize: '13px', color: '#666' }}>
                ({reputacao.totalAvaliacoes || 0} avaliações)
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Foto de Perfil */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ margin: '0 auto 12px auto', width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #3E2445', background: '#3E2445', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {formData.foto_perfil && !erroImagem ? (
              <img 
                src={formData.foto_perfil} 
                alt="Foto de perfil" 
                referrerPolicy="no-referrer"
                onError={() => setErroImagem(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span style={{ color: '#ffffff', fontSize: '46px', fontWeight: 'bold', userSelect: 'none' }}>
                {primeiraLetra}
              </span>
            )}
          </div>

          {editando && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <label htmlFor="foto-upload" style={{ cursor: 'pointer', padding: '6px 14px', background: '#3E2445', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                Alterar Foto
              </label>

              {formData.foto_perfil && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  style={{ padding: '6px 14px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Remover Foto
                </button>
              )}

              <input
                id="foto-upload"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Nome */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>Nome</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={!editando}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9', fontSize: '14px', outline: 'none' }}
            required
          />
        </div>

        {/* E-mail */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>E-mail (Não editável)</label>
          <input
            type="email"
            value={formData.email}
            disabled
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: '#f0f0f0', fontSize: '14px' }}
          />
        </div>

        {/* Telefone */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>Telefone / WhatsApp</label>
          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            disabled={!editando}
            placeholder="(42) 99999-9999"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Endereço (Cliente opcional / Profissional obrigatório — protegido por AES-256) */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>
            {isCliente ? 'Endereço (Opcional)' : 'Endereço de Atendimento / Ateliê *'}
          </label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            disabled={!editando}
            required={!isCliente}
            placeholder="Ex: Rua XV de Novembro, 123 - Centro, Ponta Grossa / PR"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Campos adicionais para Profissional de Costura */}
        {!isCliente && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>Especialidades / Serviços Prestados</label>
              <input
                type="text"
                name="especialidades"
                value={formData.especialidades}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Ex: Vestidos de Festa, Ajustes de Jeans, Barra de Calça"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>Bio / Apresentação</label>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Descreva brevemente seus serviços e especialidades..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {editando && (
              <div
                style={{
                  background: '#FAF6FA',
                  border: '1px solid #EADCEB',
                  borderLeft: '4px solid #3E2445',
                  borderRadius: '6px',
                  padding: '11px 14px',
                  marginBottom: '18px',
                  fontSize: '12.5px',
                  color: '#4A3550',
                  lineHeight: '1.45'
                }}
              >
                <strong style={{ display: 'block', color: '#3E2445', marginBottom: '3px' }}>
                  Privacidade & LGPD
                </strong>
                Seu endereço e CPF/CNPJ são criptografados no banco de dados. Seus dados de contato (<strong>exceto CPF/CNPJ</strong>) só ficam visíveis para clientes com quem você firmar pedido.
              </div>
            )}
          </>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {!editando ? (
            <button
              type="button"
              onClick={handleIniciarEdicao}
              style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={carregando}
                style={{ flex: 1, padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer' }}
              >
                {carregando ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              <button
                type="button"
                onClick={() => setEditando(false)}
                style={{ padding: '12px 20px', background: '#757575', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </form>

      {/* Ficha de Medidas do Cliente com Exportação PDF / TXT (RF07) */}
      {isCliente && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
          <h3 style={{ color: '#3E2445', marginTop: 0, marginBottom: '6px', fontSize: '18px' }}>
            Minha Ficha de Medidas
          </h3>
          <p style={{ marginTop: 0, marginBottom: '14px', fontSize: '13px', color: '#666' }}>
            Mantenha suas medidas salvas para agilizar orçamentos ou exporte em PDF / TXT.
          </p>

          {msgMedidas && (
            <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '9px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
              {msgMedidas}
            </div>
          )}

          <form onSubmit={handleSalvarMedidas}>
            <div className="medidas-grid-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Busto (cm)</label>
                <input
                  type="text"
                  placeholder="Ex: 92"
                  value={medidas.busto}
                  onChange={(e) => setMedidas({ ...medidas, busto: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Cintura (cm)</label>
                <input
                  type="text"
                  placeholder="Ex: 74"
                  value={medidas.cintura}
                  onChange={(e) => setMedidas({ ...medidas, cintura: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Quadril (cm)</label>
                <input
                  type="text"
                  placeholder="Ex: 100"
                  value={medidas.quadril}
                  onChange={(e) => setMedidas({ ...medidas, quadril: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Altura (cm)</label>
                <input
                  type="text"
                  placeholder="Ex: 165"
                  value={medidas.altura}
                  onChange={(e) => setMedidas({ ...medidas, altura: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Comprimento (cm)</label>
                <input
                  type="text"
                  placeholder="Ex: 98"
                  value={medidas.comprimento}
                  onChange={(e) => setMedidas({ ...medidas, comprimento: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#3E2445', marginBottom: '4px' }}>Observações / Outras Medidas</label>
              <textarea
                rows="2"
                placeholder="Ex: Ombro a ombro 40cm, preferência por caimento mais solto..."
                value={medidas.observacoes_medidas}
                onChange={(e) => setMedidas({ ...medidas, observacoes_medidas: e.target.value })}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px' }}
              />
            </div>

            <div className="botoes-exportar-medidas" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={salvandoMedidas}
                style={{ flex: 1, minWidth: '140px', padding: '10px 14px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                {salvandoMedidas ? 'Salvando...' : 'Salvar Medidas'}
              </button>
              <button
                type="button"
                onClick={handleExportarMedidasPDF}
                style={{ padding: '10px 14px', background: '#FAF6FA', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={handleExportarMedidasTXT}
                style={{ padding: '10px 14px', background: '#FAF6FA', color: '#3E2445', border: '1px solid #3E2445', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Baixar TXT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agenda de Entregas e Provas */}
      <Agenda idUsuario={idUsuario} isCliente={isCliente} />

      {/* Depoimentos dos Clientes */}
      {!isCliente && reputacao.depoimentos && reputacao.depoimentos.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
          <h3 style={{ color: '#3E2445', marginTop: 0, fontSize: '18px' }}>Depoimentos dos Clientes</h3>
          {reputacao.depoimentos.map((dep, index) => (
            <div key={dep.id || index} style={{ padding: '12px 0', borderBottom: '1px dashed #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#3E2445' }}>{dep.clienteNome || dep.nome_cliente}</strong>
                <span style={{ color: '#FFB400', fontSize: '14px' }}>{renderEstrelas(dep.nota)}</span>
              </div>
              {dep.comentario && <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>"{dep.comentario}"</p>}
              <span style={{ fontSize: '11px', color: '#aaa' }}>{dep.data ? new Date(dep.data).toLocaleDateString('pt-BR') : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de Preços e Portfólio */}
      {!isCliente && (
        <>
          <TabelaPrecos modoEdicao={editando} idCostureira={idUsuario} />
          <Portfolio idCostureira={idUsuario} modoEdicao={editando} />
        </>
      )}

      {/* Botões de Sair e Excluir Conta no rodapé do Perfil (RF04 & RF06) */}
      <div style={{ marginTop: '35px', borderTop: '2px solid #F4EFF5', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: '#FFEBEE',
            color: '#C62828',
            border: '1px solid #EF9A9A',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Sair da Conta
        </button>

        <button
          type="button"
          onClick={handleExcluirConta}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: '#888',
            border: '1px solid #DDD',
            borderRadius: '6px',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          Excluir Minha Conta Permanentemente
        </button>
      </div>

    </div>
  );
}

export default Perfil;