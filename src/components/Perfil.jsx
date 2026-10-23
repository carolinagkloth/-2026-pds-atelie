import React, { useState, useEffect } from 'react';

function Perfil({ usuario, onUpdateUsuario }) {
  const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioAtelie') || '{}');
  const user = usuario || usuarioSalvo;
  const idUsuario = user?.id || user?.id_usuario;
  const isCliente = user?.tipo_usuario === 'Cliente';

  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    bio: user?.bio || '',
    foto_perfil: user?.foto_perfil || ''
  });

  useEffect(() => {
    if (idUsuario) {
      fetch(`http://localhost:3000/api/usuarios/${idUsuario}`)
        .then((res) => {
          if (!res.ok) throw new Error('Erro ao carregar dados do usuário');
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
              foto_perfil: data.foto_perfil || ''
            });
          }
        })
        .catch(() => {});
    }
  }, [idUsuario]);

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
      const response = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`, {
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

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3E2445', marginTop: 0, marginBottom: '20px' }}>Meu Perfil</h2>

      {mensagem && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{mensagem}</div>}
      {erro && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ margin: '0 auto 10px auto', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #3E2445', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {formData.foto_perfil ? (
              <img src={formData.foto_perfil} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#888', fontSize: '14px' }}>Sem foto</span>
            )}
          </div>

          {editando && (
            <div>
              <label htmlFor="foto-upload" style={{ cursor: 'pointer', padding: '6px 12px', background: '#3E2445', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
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

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Nome</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={!editando}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>E-mail (Não editável)</label>
          <input
            type="email"
            value={formData.email}
            disabled
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', background: '#f0f0f0' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Telefone / WhatsApp</label>
          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            disabled={!editando}
            placeholder="(42) 99999-9999"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9' }}
          />
        </div>

        {!isCliente && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Endereço / Cidade</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Ex: Centro - Ponta Grossa / PR"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Bio / Apresentação</label>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Descreva brevemente seus serviços e especialidades..."
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', background: editando ? '#fff' : '#f9f9f9' }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {!editando ? (
            <button
              type="button"
              onClick={handleIniciarEdicao}
              style={{ width: '100%', padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={carregando}
                style={{ flex: 1, padding: '12px', background: '#3E2445', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {carregando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                style={{ padding: '12px 20px', background: '#757575', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default Perfil;