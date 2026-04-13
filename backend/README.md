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

Health check:

- `GET http://localhost:8080/api/health`
