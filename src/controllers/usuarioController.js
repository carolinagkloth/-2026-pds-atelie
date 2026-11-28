const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { OAuth2Client } = require('google-auth-library');
const usuarioModel = require('../models/usuarioModel');
const { enviarEmailNovoAcesso, enviarEmailRecuperacao } = require('../services/emailService');
const { criptografar, descriptografar } = require('../services/criptografia');
const { dispararNotificacao } = require('../services/notificacaoService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UsuarioController {
  static async notificarNovoAcesso(usuario) {
    try {
      const idUsuario = usuario.id_usuario || usuario.id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 60 * 60 * 1000);

      await usuarioModel.salvarTokenRedefinicao(idUsuario, token, expiracao);
      await enviarEmailNovoAcesso(usuario.email, usuario.nome, token);
    } catch (err) {
      console.error('Erro ao gerar token de segurança no login:', err.message);
      enviarEmailNovoAcesso(usuario.email, usuario.nome);
    }
  }

  // --- AUTENTICAÇÃO E CONTA ---
  static async cadastrar(req, res) {
    const { nome, email, senha, telefone, tipo_usuario, perfil, endereco, cpf_cnpj } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const tipoFinal = tipo_usuario || perfil || 'Cliente';
    if (tipoFinal.toLowerCase() === 'costureira' && (!endereco || !endereco.trim())) {
      return res.status(400).json({ erro: 'O endereço de atendimento é obrigatório para cadastro de costureira.' });
    }

    try {
      const telDigitos = telefone ? telefone.replace(/\D/g, '') : '';
      const queryVerificacao = `
        SELECT email, telefone FROM usuarios 
        WHERE LOWER(email) = LOWER($1) 
           OR ($2::text <> '' AND regexp_replace(COALESCE(telefone, ''), '\\D', '', 'g') = $2::text);
      `;
      const resultVerificacao = await pool.query(queryVerificacao, [
        email.trim(),
        telDigitos
      ]);

      if (resultVerificacao.rows.length > 0) {
        const usuarioExistente = resultVerificacao.rows[0];
        if (usuarioExistente.email.toLowerCase() === email.trim().toLowerCase()) {
          return res.status(400).json({ erro: 'Este e-mail já está cadastrado em outra conta.' });
        }
        if (telDigitos) {
          return res.status(400).json({ erro: 'Este número de telefone/WhatsApp já está cadastrado em outra conta.' });
        }
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const cpfDigitos = cpf_cnpj ? cpf_cnpj.replace(/\D/g, '') : '';
      if (cpfDigitos) {
        const todosCpfsRes = await pool.query(
          "SELECT cpf_cnpj FROM usuarios WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '' AND senha <> 'CONTA_EXCLUIDA';"
        );
        const cpfJaCadastrado = todosCpfsRes.rows.some((row) => {
          const decifrado = descriptografar(row.cpf_cnpj) || '';
          return decifrado.replace(/\D/g, '') === cpfDigitos;
        });

        if (cpfJaCadastrado) {
          return res.status(400).json({ erro: 'Este CPF/CNPJ já está cadastrado em outra conta.' });
        }
      }

      const queryInsert = `
        INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario, endereco, cpf_cnpj)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_usuario AS id, id_usuario, nome, email, telefone, tipo_usuario, endereco, foto_perfil;
      `;

      const novoUsuario = await pool.query(queryInsert, [
        nome.trim(),
        email.trim().toLowerCase(),
        senhaHash,
        telefone ? telefone.trim() : null,
        tipoFinal,
        criptografar(endereco),
        criptografar(cpf_cnpj)
      ]);

      const usuarioCriado = {
        ...novoUsuario.rows[0],
        endereco: descriptografar(novoUsuario.rows[0].endereco) || ''
      };

      await pool.query(
        'INSERT INTO configuracoes_notificacoes (id_usuario) VALUES ($1) ON CONFLICT DO NOTHING;',
        [usuarioCriado.id_usuario]
      );

      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: usuarioCriado
      });

    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor ao cadastrar usuário.' });
    }
  }

  static async login(req, res) {
    try {
      const { email, identificador, senha } = req.body;
      const loginInput = (identificador || email || '').trim();
      if (!loginInput || !senha) {
        return res.status(400).json({ erro: 'Preencha o e-mail/telefone e a senha.' });
      }

      const usuario = await usuarioModel.buscarPorEmailOuTelefone(loginInput);
      if (!usuario) return res.status(400).json({ erro: 'Credenciais incorretas.' });

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) return res.status(400).json({ erro: 'Credenciais incorretas.' });

      UsuarioController.notificarNovoAcesso(usuario);

      return res.json({
        mensagem: 'Login realizado com sucesso!',
        usuario: { 
          id: usuario.id_usuario || usuario.id, 
          id_usuario: usuario.id_usuario || usuario.id, 
          nome: usuario.nome, 
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario || 'Cliente',
          foto_perfil: usuario.foto_perfil || null,
          telefone: usuario.telefone || null,
          endereco: usuario.endereco || ''
        }
      });
    } catch (error) {
      console.error('Erro ao gerar token de segurança no login:', err.message);
      enviarEmailNovoAcesso(usuario.email, usuario.nome).catch(() => {});
    }
  }

  static async googleAuth(req, res) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ erro: 'Token não fornecido.' });

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      const usuario = await usuarioModel.buscarPorEmail(email.trim().toLowerCase());

      if (!usuario) {
        return res.json({
          novoUsuario: true,
          dadosGoogle: { nome: name, email: email, foto_perfil: picture || null }
        });
      }

      UsuarioController.notificarNovoAcesso(usuario);

      return res.json({
        novoUsuario: false,
        mensagem: 'Login realizado com sucesso!',
        usuario: {
          id: usuario.id_usuario || usuario.id,
          id_usuario: usuario.id_usuario || usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario || 'Cliente',
          foto_perfil: usuario.foto_perfil || picture || null,
          telefone: usuario.telefone || null,
          endereco: usuario.endereco || ''
        }
      });
    } catch (err) {
      console.error('Erro Google Auth:', err);
      return res.status(401).json({ erro: 'Credencial inválida do Google.' });
    }
  }

  static async recuperarSenha(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'Informe o seu e-mail.' });

    try {
      const usuario = await usuarioModel.buscarPorEmail(email.trim().toLowerCase());
      if (!usuario) return res.status(404).json({ erro: 'Este e-mail não está cadastrado.' });

      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date(Date.now() + 60 * 60 * 1000);

      await usuarioModel.salvarTokenRedefinicao(usuario.id_usuario, token, expiracao);
      await enviarEmailRecuperacao(usuario.email, usuario.nome, token);

      return res.json({ mensagem: 'Enviamos um e-mail com o link para redefinir sua senha!' });
    } catch (err) {
      return res.status(500).json({ erro: err.message || 'Erro ao enviar e-mail de recuperação.' });
    }
  }

  static async redefinirSenha(req, res) {
    try {
      const { token, novaSenha } = req.body;
      if (!token) return res.status(400).json({ erro: 'Token ausente.' });
      if (!novaSenha || novaSenha.length < 8) return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres.' });

      const usuario = await usuarioModel.buscarPorTokenRedefinicao(token);
      if (!usuario) return res.status(400).json({ erro: 'Link inválido ou expirado.' });

      if (new Date() > new Date(usuario.token_expiracao)) {
        return res.status(400).json({ erro: 'Link expirado.' });
      }

      const senhaHash = await bcrypt.hash(novaSenha, 10);
      await usuarioModel.atualizarSenha(usuario.id_usuario, senhaHash);

      return res.json({ mensagem: 'Senha redefinida com sucesso!' });
    } catch (error) {
      return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
    }
  }

  // --- PERFIL E MEDIDAS ---
  static async obterPerfil(req, res) {
    const { id } = req.params;
    try {
      const usuario = await usuarioModel.buscarPorId(id);
      if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.json(usuario);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar dados do perfil.' });
    }
  }

  static async atualizarPerfil(req, res) {
    const { id } = req.params;
    const { nome, telefone, endereco, bio, especialidades, foto_perfil } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    try {
      const tipoRes = await pool.query('SELECT tipo_usuario FROM usuarios WHERE id_usuario = $1;', [id]);
      if (tipoRes.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      const tipoUsuarioAtual = (tipoRes.rows[0].tipo_usuario || '').toLowerCase();
      if (tipoUsuarioAtual === 'costureira' && (!endereco || !endereco.trim())) {
        return res.status(400).json({ erro: 'O endereço de atendimento é obrigatório para costureiras.' });
      }

      const usuarioAtualizado = await usuarioModel.atualizarPerfil(id, {
        nome: nome.trim(),
        telefone: telefone || null,
        endereco: endereco ? endereco.trim() : null,
        bio: bio || null,
        especialidades: especialidades || null,
        foto_perfil: foto_perfil || null
      });

      return res.json({ mensagem: 'Perfil atualizado com sucesso!', usuario: usuarioAtualizado });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar dados do perfil.' });
    }
  }

  static async excluirConta(req, res) {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        'SELECT id_usuario, nome, tipo_usuario FROM usuarios WHERE id_usuario = $1;',
        [id]
      );

      if (userRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      const usuarioExcluido = userRes.rows[0];
      const papel = (usuarioExcluido.tipo_usuario || '').toLowerCase() === 'costureira' ? 'A costureira' : 'A cliente';
      const nomeRotulo = (usuarioExcluido.tipo_usuario || '').toLowerCase() === 'costureira'
        ? 'Costureira (Conta Excluída)'
        : 'Cliente (Conta Excluída)';

      // Busca todos os pedidos e interlocutores vinculados a este usuário
      const pedidosRes = await client.query(
        `SELECT DISTINCT
           p.id_pedido,
           p.descricao,
           COALESCE(os.status_kanban, p.status_pedido) AS status_atual,
           CASE
             WHEN p.id_cliente = $1 THEN os.id_costureira
             ELSE p.id_cliente
           END AS id_outro_usuario
         FROM pedidos p
         LEFT JOIN ordens_servico os ON os.id_pedido = p.id_pedido
         LEFT JOIN mensagens_chat m ON m.id_pedido = p.id_pedido
         WHERE p.id_cliente = $1 OR os.id_costureira = $1 OR m.id_remetente = $1;`,
        [id]
      );

      const interlocutoresNotificados = new Set();

      for (const ped of pedidosRes.rows) {
        // Registra aviso automático dentro do chat para registro histórico
        await client.query(
          `INSERT INTO mensagens_chat (id_pedido, id_remetente, conteudo, tipo_mensagem, data_hora_envio, lida)
           VALUES ($1, $2, $3, 'sistema_conta_excluida', NOW(), false);`,
          [
            ped.id_pedido,
            id,
            `⚠️ ${papel} ${usuarioExcluido.nome} excluiu a conta na plataforma. Não é mais possível enviar mensagens neste atendimento.`
          ]
        );

        if (ped.id_outro_usuario && Number(ped.id_outro_usuario) !== Number(id) && !interlocutoresNotificados.has(ped.id_outro_usuario)) {
          interlocutoresNotificados.add(ped.id_outro_usuario);

          // Dispara notificação no sininho e no WhatsApp
          dispararNotificacao({
            idUsuarioDestino: ped.id_outro_usuario,
            tipoNotificacao: 'cancelamento',
            titulo: 'Conta de contato encerrada',
            mensagem: `⚠️ ${papel} ${usuarioExcluido.nome} excluiu a conta no Ateliê Entre Linhas. Confira o pedido #${ped.id_pedido} (${ped.status_atual || 'Aberto'}) na sua lista de conversas.`,
            idPedido: ped.id_pedido,
            forcarWhatsapp: true
          }).catch((err) => console.error('Erro ao notificar interlocutor sobre exclusão de conta:', err.message));
        }
      }

      // Anonimiza dados pessoais (LGPD) preservando histórico de mensagens e pedidos
      await client.query(
        `UPDATE usuarios
         SET nome = $1,
             email = $2,
             senha = 'CONTA_EXCLUIDA',
             telefone = NULL,
             cpf_cnpj = NULL,
             endereco = NULL,
             bio = NULL,
             especialidades = NULL,
             foto_perfil = NULL,
             token_redefinicao = NULL,
             token_expiracao = NULL
         WHERE id_usuario = $3;`,
        [nomeRotulo, `excluido_${id}_${Date.now()}@atelie.local`, id]
      );

      await client.query('COMMIT');
      return res.json({ mensagem: 'Conta excluída com sucesso.' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao excluir/anonimizar conta:', err);
      return res.status(500).json({ erro: 'Erro interno ao processar a exclusão da conta.' });
    } finally {
      client.release();
    }
  }

  static async obterAgenda(req, res) {
    const { id } = req.params;
    try {
      const agenda = await usuarioModel.buscarAgendaUsuario(id);
      return res.json(agenda);
    } catch (err) {
      console.error('Erro ao buscar agenda:', err);
      return res.status(500).json({ erro: 'Erro ao carregar compromissos da agenda.' });
    }
  }

  // --- TABELA DE PREÇOS REFERENCIAIS ---
  static async listarTabelaPrecos(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT id_preco AS id, id_preco, id_costureira, servico, categoria, valor 
         FROM tabela_precos 
         WHERE id_costureira = $1 
         ORDER BY id_preco ASC;`,
        [id]
      );
      return res.json(result.rows);
    } catch (err) {
      console.error('Erro ao listar tabela de preços:', err);
      return res.status(500).json({ erro: 'Erro ao carregar tabela de preços.' });
    }
  }

  static async adicionarPrecoReferencial(req, res) {
    const { id } = req.params;
    const { servico, categoria, valor } = req.body;

    if (!servico || !servico.trim() || valor === undefined || valor === null || isNaN(Number(valor))) {
      return res.status(400).json({ erro: 'Informe o nome do serviço e um valor válido.' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO tabela_precos (id_costureira, servico, categoria, valor)
         VALUES ($1, $2, $3, $4)
         RETURNING id_preco AS id, id_preco, id_costureira, servico, categoria, valor;`,
        [id, servico.trim(), categoria || 'Ajustes', Number(valor)]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Erro ao adicionar preço referencial:', err);
      return res.status(500).json({ erro: 'Erro ao salvar item na tabela de preços.' });
    }
  }

  static async deletarPrecoReferencial(req, res) {
    const { idPreco } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM tabela_precos WHERE id_preco = $1 RETURNING *;',
        [idPreco]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ erro: 'Item de preço não encontrado.' });
      }
      return res.json({ mensagem: 'Item de preço excluído com sucesso!' });
    } catch (err) {
      console.error('Erro ao excluir preço:', err);
      return res.status(500).json({ erro: 'Erro ao excluir item da tabela de preços.' });
    }
  }

  static async obterMedidas(req, res) {
    const { id } = req.params;
    try {
      const medidas = await usuarioModel.buscarMedidas(id);
      if (!medidas) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      return res.json(medidas);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao buscar medidas.' });
    }
  }

  static async salvarMedidas(req, res) {
    const { id } = req.params;
    try {
      await usuarioModel.atualizarMedidas(id, req.body);
      return res.json({ mensagem: 'Medidas salvas!' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao salvar medidas.' });
    }
  }

  // --- PREFERÊNCIAS DE NOTIFICAÇÕES ---
  static async obterConfigNotificacoes(req, res) {
    const { id } = req.params;
    try {
      const config = await usuarioModel.buscarConfigNotificacoes(id);
      return res.json(config);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao carregar preferências.' });
    }
  }

  static async salvarConfigNotificacoes(req, res) {
    const { id } = req.params;
    try {
      await usuarioModel.atualizarConfigNotificacoes(id, req.body);
      return res.json({ mensagem: 'Preferências salvas!' });
    } catch (err) {
      return res.status(500).json({ erro: 'Erro ao salvar preferências.' });
    }
  }
}

module.exports = UsuarioController;