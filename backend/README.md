# MindRush Backend (Express + Prisma)

Este backend substitui o antigo `backend-java/` (Spring Boot), mantendo:

- Base path `/api` (compatível com `frontend/src/services/api.ts`)
- JWT no header `Authorization: Bearer <token>`
- Payloads compatíveis com os types do frontend

## Pré-requisitos

- Node.js 20+
- Docker (para Postgres do `docker-compose.yml` da raiz)

## Rodar o banco (raiz do repo)

```bash
docker compose up -d
```

## Variáveis de ambiente

Você pode:

1) Usar o `.env` da raiz (recomendado para manter um lugar só), ou
2) Criar `backend/.env` baseado em `backend/.env.example`.

> Importante: comandos do Prisma (`prisma db push`, `prisma migrate`, `prisma studio`) precisam da variável `DATABASE_URL` definida no ambiente.
> Quando você roda dentro da pasta `backend/`, o Prisma procura `backend/.env`.

## Instalar dependências

```bash
npm install
```

## Prisma

```bash
npm run prisma:generate

# Se você já tem o banco criado pelo backend antigo (Flyway), use db push (evita “drift”):
npm run prisma:push

# Se você quer migrations Prisma (e aceita resetar a base em dev):
# npm run prisma:migrate -- --name init
```

## Subir a API

```bash
npm run dev
```

## ENEM: pré-carregar questões no banco (recomendado)

Para a **Jornada de Questões**, o app assume que as questões do ENEM já estão **pré-carregadas** no Postgres.

Rode uma vez (pode demorar alguns minutos):

```bash
npm run enem:sync
```

Observações:
- O script busca todas as provas e páginas de questões na `ENEM_API_BASE_URL` e faz **upsert** no banco.
- No runtime normal (endpoints `/api/enem/*`), o backend trata a enem.dev como **read-only**: usa cache em memória e, se a API externa falhar, faz **fallback** para o banco local.

Health check:

- `GET http://localhost:8080/api/health`

---

## Simulados ENEM (API)

O backend expõe um modo de **Simulado** com persistência por **tentativa** (attempt), incluindo pausa/retomada e reinício.

### Identificadores

- `simuladoId`: string no formato `YYYY-d1` ou `YYYY-d2`
	- Ex.: `2022-d1` (Dia 1: Linguagens + Humanas)
	- Ex.: `2022-d2` (Dia 2: Natureza + Matemática)
- `attemptId`: id da tentativa em andamento/concluída (gerado pelo backend)

### Rotas

- `GET /api/simulados`
	- Lista simulados (por ano + dia), com status: `pending | in_progress | completed`.

- `GET /api/simulados/history`
	- Lista o histórico de **todas** as tentativas concluídas do usuário (inclui data/hora de início e término).

- `POST /api/simulados/:simuladoId/start`
	- Inicia uma nova tentativa.
	- Body (opcional): `{ "languageChoice": "ingles" | "espanhol" }`
		- Usado apenas no `d1` (língua estrangeira).

- `GET /api/simulados/:attemptId`
	- Carrega a tentativa (inclui snapshot de questões e respostas salvas).

- `POST /api/simulados/:attemptId/answer`
	- Salva uma resposta durante a prova.

- `POST /api/simulados/:attemptId/pause`
	- Pausa o timer (persiste em `pausedAt` + `pausedSeconds`).

- `POST /api/simulados/:attemptId/resume`
	- Retoma o timer (acumula tempo pausado em `pausedSeconds`).

- `POST /api/simulados/:attemptId/restart`
	- Reinicia a prova: zera respostas/flags e reinicia o timer.

- `POST /api/simulados/:attemptId/submit`
	- Finaliza e corrige.

- `GET /api/simulados/:attemptId/result`
	- Obtém o resultado corrigido.
