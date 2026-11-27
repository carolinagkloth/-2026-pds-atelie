# Ateliê entre Linhas

**Uma plataforma que digitaliza a costura sob medida, eliminando barreiras de comunicação para centralizar orçamentos, ordens de serviço e agendamentos com praticidade e segurança.**<br>
<br>
**Disciplina:** Projeto e Desenvolvimento de Sistemas (PDS) · IFPR – Centro de Referência Ponta Grossa · 2026<br>
**Curso:** Técnico em Informática Integrado ao Ensino Médio<br>
**Orientador:** Prof. Dr. João Henrique Berssanette (GitHub: @Profe-Berssa-IFPR)<br>

---

## 👥 Equipe

| Nome | GitHub (@usuário) | Função no projeto |
|---|---|---|
| Carolina Giacchini Kloth | @carolinagkloth | back-end / banco de dados |
| Livia de Cássia Protasiewicz Sebaje | @liviasebaje | front-end |
| Maria Clara Anzuategui | @{{usuario3}} | diagramas / docs |

---

## 🔗 Links do projeto

| O quê | Link |
|---|---|
| 📄 **Documento do Projeto Final (público)** | https://1drv.ms/w/c/f4526d03325e87ba/IQBSgheWC5-wQq6-dQOL_emeAQN-iDdfmgSV5H6Wg2kwxgI?e=lWOGg3 |
| 🖥️ Sistema / deploy (se já houver) | {{link do deploy ou "em fase de publicação"}} |
| 🎨 Protótipo no Figma | {{link do protótipo}} |

---

## 🎯 Sobre o projeto

**Problema:** A falta de visibilidade no mercado de costura sob medida e a gestão informal e desorganizada de ateliês autônomos.<br>
**Solução proposta:** Plataforma web em que clientes publicam seus pedidos de costura e profissionais de costura gerenciam o atendimento em um só ambiente, incluindo fichas de medidas, portfólio, tabela de preços, chat de negociação, orçamentos, ordens de serviço (Kanban), agendamentos e avaliações.<br>
**Público-alvo:** Profissionais autônomos da costura, pequenos ateliês e seus clientes.<br>

**Tecnologias (stack):** React.js (Vite), Node.js (Express), PostgreSQL, WhatsApp Web (`whatsapp-web.js`) e Nodemailer.

---

## 🗂️ Estrutura do repositório

```text
.
├── README.md  ← este arquivo (identificação + links + instruções)
├── docs/  ← documentação do Projeto Final (entregas)
│   ├── E1-pre-projeto-corrigido/
│   ├── aprovacao-e-termos-de-concordancia/
│   ├── E2-introducao/
│   ├── E3-fundamentacao-teorica/
│   ├── E4-metodologia/
│   └── E5-desenvolvimento/
├── diagramas/  ← .drawio + exportações PNG/SVG
├── prototipos/  ← exportações/links do Figma
├── src/  ← código-fonte da aplicação (front-end React e API Node/Express)
│   ├── components/  ← telas e componentes da interface
│   ├── config/      ← conexão com banco de dados PostgreSQL
│   ├── controllers/ ← regras de negócio
│   ├── jobs/        ← tarefas agendadas (lembretes)
│   ├── middlewares/ ← autenticação e controle de acesso
│   ├── models/      ← consultas SQL
│   ├── routes/      ← rotas da API REST
│   ├── services/    ← criptografia (LGPD) e notificações
│   ├── styles/      ← folhas de estilo CSS
│   ├── app.js       ← configuração do Express
│   ├── App.jsx      ← componente raiz React
│   └── main.jsx     ← entrada do front-end
├── server.js     ← inicialização do servidor back-end
├── index.html    ← página base (Vite)
└── package.json  ← dependências e scripts do projeto
```

> A estrutura completa e o passo a passo estão em **`GUIA-DO-REPOSITORIO.md`**. Cada pasta de entrega usa o **Modelo de Entrega** (`_TEMPLATE-ENTREGA.md`).

---

## 📦 Entregas do 2º Trimestre (status)

| # | Entrega | Peso | Status | Onde está |
|---|---|---|---|---|
| E1 | Pré-Projeto corrigido (banca) | 10% | ✅ | `docs/E1-pre-projeto-corrigido/` |
| 📄 | Aprovação do Pré-Projeto + Termos de Concordância | 10% | ✅ | `docs/aprovacao-e-termos-de-concordancia/` |
| E2 | Capa, Folha de Rosto e Introdução | 10% | ✅ | `docs/E2-introducao/` |
| E3 | Fundamentação Teórica | 10% | ✅ | `docs/E3-fundamentacao-teorica/` |
| E4 | Metodologia / Materiais e Métodos | 10% | ✅ | `docs/E4-metodologia/` |
| E5 | Desenvolvimento do Sistema | 30% | ✅ | `docs/E5-desenvolvimento/` + `src/` |

> Marque ✅ quando concluir cada entrega. **E6 (Conceito do Orientador, 20%)** é avaliação contínua — não vai para o repositório.

---

## ▶️ Como rodar o sistema

### Pré-requisitos
- Node.js (v18 ou superior)
- PostgreSQL (v14 ou superior)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/carolinagkloth/2026-pds-atelie.git
cd 2026-pds-atelie

# 2. Instalar as dependências
npm install

# 3. Configurar as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto com as credenciais do banco e chaves:
# PORT=3001
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/atelie_entre_linhas
# JWT_SECRET=sua_chave_secreta
# CHAVE_CRIPTOGRAFIA=sua_chave_32_caracteres

# 4. Iniciar o servidor back-end (Terminal 1)
node server.js

# 5. Iniciar o front-end React/Vite (Terminal 2)
npm run dev
```