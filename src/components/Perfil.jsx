import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import "../styles/Perfil.css";
import Portfolio from './Portfolio';
import TabelaPrecos from './TabelaPrecos';

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

  // Estados integrados para Avaliações (DER) e Agenda de Ordens de Serviço
  const [reputacao, setReputacao] = useState({ media: 0, totalAvaliacoes: 0, depoimentos: [] });
  const [ordensServico, setOrdensServico] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    bio: user?.bio || '',
    especialidades: user?.especialidades || '',
    foto_perfil: user?.foto_perfil || ''
  });

  useEffect(() => {
    if (idUsuario) {
      // 1. Carrega os dados do Perfil
      fetch(`/api/usuarios/${idUsuario}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Erro ao carregar dados do usuário');
          }
          return res.json();
        })
        .then((data) => {
          if (data && !data.erro) {
            setFormData({
              nome: data.nome || '',
              email: data.email || '',
              telefone: data.telefone || '',
              endereco: data.endereco || '',
              bio: data.bio || '',
              especialidades: data.especialidades || '',
              foto_perfil: data.foto_perfil || user?.foto_perfil || ''
            });
          }
        })
        .catch(() => {});

      // 2. Carrega as Ordens de Serviço do usuário para a Agenda
      fetch(`/api/ordens-servico/usuario/${idUsuario}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setOrdensServico(data);
          }
        })
        .catch(() => {});

      // 3. Se for Costureira, carrega a média e os depoimentos da tabela avaliacoes
      if (!isCliente) {
        fetch(`/api/avaliacoes/costureira/${idUsuario}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.erro) {
              setReputacao(data);
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setErroImagem(false);
        setFormData((prev) => ({ ...prev, foto_perfil: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
    setCarregando(true);

    try {
      const response = await fetch(`/api/usuarios/${idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao atualizar perfil.');
      }

      const usuarioAtualizado = data.usuario || { ...user, ...formData };

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

  const primeiraLetra = (formData.nome || user?.nome || 'U').trim().charAt(0).toUpperCase();

  const handleVoltar = () => {
    if (onNavigate) {
      onNavigate(isCliente ? 'meusPedidos' : 'feedPedidos');
    }
  };

  const renderEstrelas = (nota) => {
    const valor = Math.round(nota || 0);
    return '★'.repeat(valor) + '☆'.repeat(5 - valor);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62, 36, 69, 0.12)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
        <h2 style={{ color: '#3E2445', margin: 0, fontSize: '22px' }}>
          {isCliente ? 'Meu Perfil' : 'Perfil Profissional da Costureira'}
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
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px', color: '#FFB400', fontWeight: 'bold' }}>
                {reputacao.media ? reputacao.media.toFixed(1) : '0.0'}
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
            <div>
              <label htmlFor="foto-upload" style={{ cursor: 'pointer', padding: '6px 14px', background: '#3E2445', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                Alterar Foto
              </label>

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

        {/* E-mail (Somente Leitura) */}
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

        {/* Campos adicionais para Costureira */}
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

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#3E2445' }}>Endereço / Ateliê</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Ex: Centro - Ponta Grossa / PR"
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

      {/* Agenda de Entregas */}
      <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
        <h3 style={{ color: '#3E2445', marginTop: 0, fontSize: '18px' }}>
          Agenda de Entregas e Provas (Ordens de Serviço)
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
          <Calendar onChange={setDataSelecionada} value={dataSelecionada} />
          
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '15px' }}>
              Entregas em {dataSelecionada.toLocaleDateString('pt-BR')}:
            </h4>
            {ordensServico.filter(os => os.previsaoEntrega && new Date(os.previsaoEntrega).toDateString() === dataSelecionada.toDateString()).length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>Sem entregas ou provas previstas para esta data.</p>
            ) : (
              ordensServico
                .filter(os => os.previsaoEntrega && new Date(os.previsaoEntrega).toDateString() === dataSelecionada.toDateString())
                .map(item => (
                  <div key={item.id} style={{ background: '#F9F9F9', borderLeft: `4px solid ${item.statusKanban === 'Aguardando Prova' ? '#E67E22' : '#2E7D32'}`, padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
                    <strong style={{ fontSize: '13px', color: '#3E2445' }}>Status: {item.statusKanban}</strong><br />
                    <small style={{ color: '#555', display: 'block', marginTop: '3px' }}>{item.pedidoDescricao}</small>
                    <small style={{ color: '#888', display: 'block', marginTop: '2px' }}>
                      {isCliente ? `Costureira: ${item.costureiraNome}` : `Cliente: ${item.clienteNome}`}
                    </small>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Depoimentos dos Clientes */}
      {!isCliente && reputacao.depoimentos && reputacao.depoimentos.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #F4EFF5', paddingTop: '20px' }}>
          <h3 style={{ color: '#3E2445', marginTop: 0, fontSize: '18px' }}>Depoimentos dos Clientes</h3>
          {reputacao.depoimentos.map((dep) => (
            <div key={dep.id} style={{ padding: '12px 0', borderBottom: '1px dashed #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#3E2445' }}>{dep.clienteNome}</strong>
                <span style={{ color: '#FFB400', fontSize: '14px' }}>{renderEstrelas(dep.nota)}</span>
              </div>
              {dep.comentario && <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>"{dep.comentario}"</p>}
              <span style={{ fontSize: '11px', color: '#aaa' }}>{new Date(dep.data).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de Preços e Portfólio (Exibidos apenas no perfil de costureiras) */}
      {!isCliente && (
        <>
          <TabelaPrecos modoEdicao={editando} />
          <Portfolio idCostureira={idUsuario} modoEdicao={editando} />
        </>
      )}

    </div>
  );
}

export default Perfil;