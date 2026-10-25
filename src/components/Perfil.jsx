import React, { useState, useEffect } from 'react';
import "../styles/Perfil.css";

function Perfil({ usuario, onUpdateUsuario }) {
  const usuarioSalvo = JSON.parse(
    localStorage.getItem('usuarioAtelie') || '{}'
  );

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
        setFormData((prev) => ({
          ...prev,
          foto_perfil: reader.result
        }));
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
      const response = await fetch(
        `http://localhost:3000/api/usuarios/${idUsuario}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || 'Erro ao atualizar perfil.'
        );
      }

      const usuarioAtualizado =
        data.usuario || { ...user, ...formData };

      localStorage.setItem(
        'usuarioAtelie',
        JSON.stringify(usuarioAtualizado)
      );

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
    <div className="perfil-card">

      <h2>Meu Perfil</h2>

      {mensagem && (
        <div className="perfil-mensagem">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="perfil-erro">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="perfil-foto-area">

          <div className="perfil-foto">
            {formData.foto_perfil ? (
              <img
                src={formData.foto_perfil}
                alt="Foto de perfil"
              />
            ) : (
              <span className="perfil-sem-foto">
                Sem foto
              </span>
            )}
          </div>

          {editando && (
            <div>
              <label
                htmlFor="foto-upload"
                className="perfil-alterar-foto"
              >
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

        <div className="perfil-form-group">
          <label>Nome</label>

          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={!editando}
            required
          />
        </div>

        <div className="perfil-form-group perfil-email">
          <label>E-mail (Não editável)</label>

          <input
            type="email"
            value={formData.email}
            disabled
          />
        </div>

        <div className="perfil-form-group">
          <label>Telefone / WhatsApp</label>

          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            disabled={!editando}
            placeholder="(42) 99999-9999"
          />
        </div>

        {!isCliente && (
          <>
            <div className="perfil-form-group">
              <label>Endereço / Cidade</label>

              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Ex: Centro - Ponta Grossa / PR"
              />
            </div>

            <div className="perfil-form-group">
              <label>Bio / Apresentação</label>

              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editando}
                placeholder="Descreva brevemente seus serviços e especialidades..."
              />
            </div>
          </>
        )}

        <div className="perfil-botoes">

          {!editando ? (
            <button
              type="button"
              onClick={handleIniciarEdicao}
              className="perfil-button-principal"
            >
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={carregando}
                className="perfil-button-principal"
              >
                {carregando
                  ? 'Salvando...'
                  : 'Salvar Alterações'}
              </button>

              <button
                type="button"
                onClick={() => setEditando(false)}
                className="perfil-button-cancelar"
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