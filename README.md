# MindRush

Plataforma web inteligente e gamificada voltada para a preparação de estudantes para o ENEM.

Este repositório é um **monorepo** com:

- `backend/`: API em **Java 21 + Spring Boot 3**, com **JWT**, **Flyway** e **PostgreSQL**
- `frontend/`: app web em **React + Vite**, consumindo a API via **proxy** (sem CORS em desenvolvimento)

---

## 📋 Sobre o Projeto (Extensão)

**Resumo do projeto**

O MindRush propõe transformar o processo de estudo para o ENEM em uma experiência **interativa, competitiva e personalizada**, usando **gamificação**, **análise de desempenho** e **recursos de inteligência artificial**.

A plataforma permitirá que estudantes resolvam questões, participem de batalhas em tempo real contra outros usuários, realizem simulados e recebam análises detalhadas do desempenho. Também estão previstas funcionalidades pagas (em evolução), como: avaliador automático de redação com IA, simulador TRI, histórico completo de desempenho e um chatbot educacional.

**Local de desenvolvimento**: IFTM e Home Office (Uberaba/MG)

**Data de referência**: Uberaba/MG, 19 de Agosto de 2025

---

## 👥 Equipe e Contato

**Autores**

- Alexandre Londe
- Luiz Alberto Cury Andalécio

---

## 🎯 Objetivos e Cronograma (visão macro)

**Objetivo geral**

Desenvolver uma plataforma web gamificada e inteligente para preparação ao ENEM por meio de exercícios, análise de desempenho, competição entre usuários e ferramentas de IA.

**Objetivos específicos (visão de produto)**

- Interface web (landing, login/registro, dashboard)
- Questões do ENEM organizadas por matérias/jornadas
- Sistema competitivo PvP (batalhas 1v1)
- Ranking, ligas, conquistas, níveis, moedas e loja
- Simulados + estimativa TRI
- IA: avaliador de redação e chatbot educacional
- Histórico e estatísticas de desempenho

**Cronograma macro (épicos)**

- 2026: Estrutura básica (Março)
- 2026: Questões do ENEM + Gamificação (Abril)
- 2026: Social + Estatísticas e Análise de Desempenho (Maio)
- 2026: PvP + Simulados/TRI + IA (Junho)
- 2026: Personalização/Loja + UX (Julho)

---

## 🌍 Impacto, Acompanhamento e Continuidade

**Impacto tecnológico**

- Aplicação prática de tecnologias modernas em desenvolvimento web, banco de dados, gamificação, análise de dados e IA.

**Impacto social**

- Incentivo à prática constante de estudos e ao engajamento por meio de competição saudável e progressão.
- Apoio ao estudante na identificação de dificuldades e evolução do desempenho.

**Impacto econômico**

- Plataforma digital escalável com potencial de evolução para produto/serviço na área de tecnologia educacional.

**Acompanhamento e avaliação**

- Progresso gerenciado no Jira, com validação das entregas pela equipe e Tech Lead rotativo a cada sprint de 2 semanas.

**Continuidade**

- Após a conclusão, o sistema pode ser expandido com novos modos competitivos, ampliação do banco de questões, trilhas personalizadas e novas integrações educacionais.

---

## 🧱 Tecnologias

**Confirmadas (ambiente de desenvolvimento)**

- Editor: VS Code
- Versionamento: Git + GitHub
- Gerenciador de pacotes: npm
- Containerização: Docker (PostgreSQL + pgAdmin)

**Stack do repositório (atual)**

Frontend:

- React + Vite + TypeScript
- Tailwind + shadcn/ui
- Axios (baseURL `/api`)

Backend:

- Java 21 + Spring Boot 3
- Spring Security + JWT
- Spring Data JPA
- Flyway (migrations SQL versionadas)

Banco/Dev:

- PostgreSQL via Docker Compose
- pgAdmin via Docker Compose (acesso via navegador)

---

## 📁 Estrutura do monorepo

```text
.
├── backend/            # Spring Boot API
├── frontend/           # React (Vite)
├── docker-compose.yml  # Postgres + pgAdmin
├── .env.example        # variáveis de ambiente (exemplo)
├── .env                # variáveis locais (ignorado no Git)
└── start.sh            # roda backend+frontend juntos
```

---

## 🚀 Começando (do zero)

### 1) Pré-requisitos

- Node.js 20+ e npm
- Java 21
- Maven 3.9+
- Docker + Docker Compose

Verifique no Linux:

```bash
node -v
npm -v
java -version
mvn -v
docker -v
docker compose version
```

### 2) Variáveis de ambiente

Na raiz do projeto:

```bash
cp .env.example .env
```

Notas:

- O backend lê automaticamente o `.env` em desenvolvimento (via `spring.config.import`).
- Não commite o `.env`.

### 3) Subir Postgres + pgAdmin (Docker)

Na raiz do projeto:

```bash
docker compose up -d
docker compose ps
```

Se a porta do Postgres estiver ocupada (ex.: `address already in use` na `5432`):

1. No `.env`, mude `DB_PORT` (ex.: `5440`)
2. No `.env`, atualize `DB_URL` para a mesma porta (ex.: `jdbc:postgresql://localhost:5440/mindrush`)
3. Rode `docker compose up -d` novamente

Logs:

```bash
docker compose logs -f postgres
docker compose logs -f pgadmin
```

Parar:

```bash
docker compose down
```

### 4) Acessar o banco no navegador (pgAdmin)

O `docker-compose.yml` sobe o pgAdmin.

- URL: `http://127.0.0.1:<PGADMIN_PORT>`
  - Padrão (no `.env.example`): `5051`
  - Se a porta estiver ocupada, mude `PGADMIN_PORT` no `.env` (ex.: `5052`) e rode `docker compose up -d`.

Login do pgAdmin (vem do `.env`/`.env.example`):

- Email: `PGADMIN_DEFAULT_EMAIL` (padrão: `admin@mindrush.com`)
- Senha: `PGADMIN_DEFAULT_PASSWORD` (padrão: `admin`)

Conectar no Postgres (mesmo Docker network):

No pgAdmin: “Register > Server…” → aba **Connection**:

- Host name/address: `postgres`
- Port: `5432`
- Maintenance database: `mindrush`
- Username: valor de `DB_USER` (padrão: `mindrush`)
- Password: valor de `DB_PASSWORD` (padrão: `mindrush`)

### 5) Rodar backend + frontend

Terminal 1 (Banco):

```bash
docker compose up -d
```

Terminal 2 (Backend):

```bash
cd backend
mvn spring-boot:run
```

Terminal 3 (Frontend):

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 Integração Frontend ↔ Backend (sem CORS em dev)

- O frontend chama a API em `/api/*`.
- O Vite faz proxy de `/api` para o backend.
- Se você mudar `SERVER_PORT` no `.env`, o `start.sh` exporta `VITE_BACKEND_PORT` e o proxy acompanha.

---

## 🔐 Endpoints (MVP atual)

- Health: `GET /api/health`
- Cadastro: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Perfil: `GET /api/users/me` (precisa `Authorization: Bearer <token>`)

---

## 🗄️ Banco e Migrations (Flyway)

As migrations SQL ficam em:

- `backend/src/main/resources/db/migration/`

### Criar uma nova migration

1) Crie um arquivo seguindo o padrão:

- `V2__descricao_curta.sql`
- `V3__outra_mudanca.sql`

2) Rode o backend (Flyway aplica na inicialização):

```bash
cd backend
mvn spring-boot:run
```

### Verificar se aplicou

- No pgAdmin: tabela `flyway_schema_history`
- Ou via terminal:

```bash
docker exec -it mindrush_db psql -U mindrush -d mindrush
```

Dentro do `psql`:

```sql
\dt
select * from flyway_schema_history order by installed_rank;
```

### Reset completo (dev)

```bash
docker compose down -v
docker compose up -d
```

---

## 🧯 Troubleshooting rápido

**Porta 8080 ocupada (Spring não sobe)**

- Erro: `java.net.BindException: Endereço já em uso`
- Solução: no `.env`, mude `SERVER_PORT=8081` e rode de novo.

**Porta do Postgres ocupada**

- Solução: mude `DB_PORT` e atualize `DB_URL` no `.env`.

**Porta do pgAdmin ocupada**

- Solução: mude `PGADMIN_PORT` no `.env`.

**pgAdmin abre no browser mas não conecta no banco**

- Dentro do pgAdmin, use Host `postgres` e Port `5432` (não use `localhost`).

---

## 🗺️ Próximos passos (sugestão prática)

> **Estado atual**: temos o molde do frontend (UI/rotas) e um backend com fluxo básico de usuário (cadastro/login + rota protegida).

### 1) Base do produto (MVP)

- [ ] Definir o **MVP v0.1** (ex.: questões + histórico + ranking simples) e escrever critérios de aceite
- [ ] Fechar a **modelagem do banco** (entidades e relacionamentos) e desenhar um ERD
- [ ] Padronizar contratos da API (nomenclatura, paginação, erros, validação) e tipos compartilhados no frontend

### 2) Autenticação e contas

- [ ] Evoluir JWT para **access + refresh token**
- [ ] Implementar **logout** (invalidação/rotação de refresh)
- [ ] Adicionar **edição de perfil** (nome, foto/avatar, bio, privacidade)
- [ ] Implementar **roles** (ex.: `USER`, `ADMIN`) e endpoints de administração mínimos
- [ ] Adicionar proteções: rate limiting/cooldown em login e reset de senha
- [ ] Implementar **recuperação de senha** (token de reset + envio de e-mail) e tela no frontend

### 3) Sistema de Questões (núcleo da plataforma)

- [ ] Definir a origem das questões (API/arquivo) e o formato de ingestão
- [ ] Criar pipeline de **importação/seed** (Flyway ou job) com matérias, habilidades e tags
- [ ] Implementar catálogo e filtros:
  - [ ] `GET /api/subjects`
  - [ ] `GET /api/questions` (paginação, assunto, dificuldade, ano, prova)
  - [ ] `GET /api/questions/:id`
- [ ] Implementar resolução:
  - [ ] `POST /api/questions/:id/attempt` (resposta do usuário)
  - [ ] Registrar acertos/erros, tempo, tentativa, e justificativa quando existir
- [ ] Implementar **histórico** e revisão:
  - [ ] `GET /api/users/me/attempts`
  - [ ] “Caderno de erros” (questões erradas para refazer)

### 4) Gamificação

- [ ] Implementar XP/nível/coin (regras iniciais simples)
- [ ] Conquistas e badges (ex.: streak, matérias concluídas, PvP wins)
- [ ] Missões diárias e desafios semanais (modelo + agendamento)
- [ ] Loja/personalização (itens cosméticos, títulos, molduras, etc.)

### 5) Ranking e Ligas

- [ ] Ranking global e por período (semanal/mensal)
- [ ] Sistema de ligas (bronze/prata/ouro) com promoção/rebaixamento
- [ ] Ranking entre amigos (quando o social estiver pronto)

### 6) Social (comunidade)

- [ ] Amigos (adicionar/aceitar/remover)
- [ ] Perfis públicos/privados
- [ ] Convites e desafios entre amigos

### 7) PvP (batalhas 1v1)

- [ ] Definir modo de jogo (turnos, tempo, número de questões)
- [ ] Implementar matchmaking e sala de batalha
- [ ] Adicionar comunicação em tempo real (provável WebSocket) e anti-trapaça básica
- [ ] Registrar resultado (vitória/derrota) e recompensas (XP/coins)

### 8) Simulados + TRI

- [ ] Criar o módulo de simulados (criação, execução, resultado)
- [ ] Implementar cálculo **estimado** (começar simples) e evoluir para aproximação TRI
- [ ] Histórico de simulados e comparativo por área

### 9) Estatísticas e análise de desempenho

- [ ] Dashboard de desempenho (por matéria, por período, por dificuldade)
- [ ] Gráficos e insights (acertos, tempo, evolução, pontos fracos)
- [ ] Recomendação de estudo (ex.: “refaça questões erradas de X”)

### 10) IA (chatbot e redação)

- [ ] Chatbot educacional: integração inicial e guardrails (limites, contexto, custo)
- [ ] Avaliador de redação: pipeline (upload/texto, rubric ENEM, feedback)
- [ ] Histórico de interações e opt-in de dados (privacidade)

### 11) Planos pagos e feature gating

- [ ] Modelar planos/assinaturas e permissões por feature
- [ ] Implementar gating no backend e no frontend (ex.: redação/tri/chatbot)
- [ ] Definir estratégia de pagamentos (provider) e fluxo de upgrade/downgrade

### 12) Moderação, denúncias e segurança

- [ ] Sistema de denúncia (conteúdo/usuário) e fluxo de revisão
- [ ] Logs de auditoria para ações sensíveis
- [ ] Hardening geral: validações, CORS em produção, headers, sanitização de input

### 13) Qualidade, testes e CI/CD

- [ ] Testes no backend (unit + integração para auth e questions)
- [ ] Testes no frontend (Vitest) e E2E (Playwright) para fluxos críticos
- [ ] Pipeline CI (lint + build + testes) e ambiente de staging

### 14) Documentação e UX

- [ ] Documentar endpoints (OpenAPI/Swagger) e exemplos de requisição
- [ ] FAQ/Central de ajuda dentro do app
- [ ] Revisar responsividade, acessibilidade e microcopy (mensagens/erros)

-----

## 📓 Convenção de Commits

Este repositório segue uma variação do padrão [Conventional Commits](https://www.conventionalcommits.org/). Essa abordagem ajuda a manter o histórico claro e organizado, contribuindo para automação de versão e geração de changelog.

### ✔️ Formato

```bash
<type>(scope):<ENTER>
<mensagem curta descrevendo o que o commit faz>
```

### 📍 O que é o "type"?

    * `feat`: Nova funcionalidade
    * `fix`: Correção de bug
    * `docs`: Alterações na documentação
    * `style`: Ajustes de estilo (css, cores, imagens, etc.)
    * `refactor`: Refatoração sem alteração de comportamento
    * `perf`: Melhorias de performance
    * `test`: Criação ou modificação de testes
    * `build`: Mudanças que afetam o build (dependências, scripts)
    * `ci`: Configurações de integração contínua

### 📍 O que é o "scope"?

Define a parte do projeto afetada pelo commit, como um módulo (`encryption`), uma página (`login-page`) ou uma feature (`carousel`).

### 📝 Exemplo

```bash
git commit -am "refactor(encryption):
> Melhora a indentação."

git commit -am "fix(login-page):
> Corrige bug de login nulo."

git commit -am "feat(carousel):
> Implementa carrossel na página inicial."
```

-----

## 🪢 Convenção de Branches

Este documento descreve o padrão de versionamento e organização de branches para o projeto MindRush, usando Git para um fluxo de trabalho mais organizado e rastreável.

### 1. Convenção de nomes de branch

Toda nova branch criada deve seguir o padrão abaixo para garantir consistência e clareza quanto ao propósito.

**Padrão:** `<descrição-curta-em-minúsculas-com-hifens>`

A descrição deve ser curta e usar hifens para separar palavras.

**Exemplos de nomes de branch:**

- `landing-page`
- `backend-configuration`
- `login-form`

**Comando para criar uma branch:**

Para criar uma nova branch a partir de `dev` e mudar para ela:

```bash
git checkout -b landing-page
```

### 2. Branches locais vs remotas (origin)

É importante entender a diferença entre uma branch na sua máquina (local) e a branch no repositório remoto (origin).

- **Branch Local:** Versão do repositório que existe apenas no seu computador. É onde você desenvolve, testa e faz commits.
- **Branch Remota (origin):** Versão da branch armazenada no servidor central (GitHub, GitLab, etc.). Serve como ponto de sincronização para a equipe.

Embora sua branch local e a remota tenham o **mesmo nome** (ex.: `landing-page`), são entidades diferentes. Você desenvolve na branch local e, quando quiser compartilhar, faz push para a remota.

**Fluxo básico:**

1. Crie a branch `landing-page` **localmente**.
2. Desenvolva e faça commits nessa branch local.
3. Faça push das alterações para o repositório remoto com `git push`.

> Obs: O parâmetro `-u` (ou `--set-upstream`) liga sua branch local à remota, facilitando `git push` e `git pull` futuros.

### 3. Fluxo de desenvolvimento

1. **Sincronize sua branch `dev` local:**
        ```bash
        git checkout dev
        git pull origin dev
        ```
2. **Crie sua branch de tarefa:**
        Crie a branch local a partir do `dev` atualizado, seguindo a convenção de nomes.
        ```bash
        git checkout -b login-form
        ```
3. **Desenvolva e commit:**
        Trabalhe no código e faça commits claros e concisos. Lembre-se da convenção de commits.
        ```bash
        git add .
        git commit -m "feat(login-form):
        > Adiciona validação de campos"
        ```
4. **Envie seu trabalho ao remoto:**
        Faça push dos commits para a branch remota com o mesmo nome.
        ```bash
        git push origin -u login-form
        ```

### 4. Siga a Convenção de Commits

[Veja a convenção de commits detalhada acima](#convenção-de-commits) para garantir mensagens claras, rastreáveis e sempre referenciando a parte relevante do projeto.

### 5. Processo de Pull Request (PR)

Um Pull Request (PR) é o mecanismo para revisar e integrar código de uma branch para outra.

- **Ao finalizar uma tarefa:**
        Ao terminar o desenvolvimento na sua branch de tarefa (ex.: `login-form`) e testá-la, abra um **Pull Request** da sua branch para a `dev`.
        Isso serve para:
        1. Permitir revisão de código por outros membros.
        2. Manter um registro histórico das mudanças integradas.
        3. Tornar o código disponível em `dev` para outros desenvolvedores, se necessário.

- **No fim de um Sprint:**
        A branch `main` é a produção e deve conter somente código estável e testado. Atualizações para `main` ocorrem apenas ao final do ciclo de desenvolvimento (Sprint).
        Ao final do sprint, será aberto um **Pull Request** de `dev` para `main`, contendo todas as features e fixes desenvolvidos no ciclo.

-----