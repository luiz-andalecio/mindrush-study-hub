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
