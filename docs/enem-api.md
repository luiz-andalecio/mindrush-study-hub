# Integração ENEM (enem.dev) — MindRush

Este documento descreve **como a integração com a API pública do ENEM (enem.dev)** funciona no MindRush: arquitetura, configuração, endpoints internos, cache/rate-limit, fallback no banco, self-hosting e como o frontend consome.

> Objetivo: o **frontend nunca chama a enem.dev diretamente**. O fluxo é:
>
> **Frontend → Backend MindRush (/api) → enem.dev**
>
> Assim você controla cache, evita 429, e tem fallback local.

---

## 1) Visão geral da API enem.dev

- Base URL (docs): `https://api.enem.dev/v1`
- Documentação:
  - Introdução: https://docs.enem.dev/introduction
  - Rate limits: https://docs.enem.dev/rate-limits
  - Erros: https://docs.enem.dev/errors
  - Self-hosting: https://docs.enem.dev/self-hosting

### Endpoints utilizados

- Listar provas: `GET /v1/exams`
- Detalhe da prova por ano: `GET /v1/exams/{year}`
- Listar questões (paginado): `GET /v1/exams/{year}/questions?limit=&offset=&language=`
- Detalhe de questão por número: `GET /v1/exams/{year}/questions/{index}?language=`

### Paginação (enem.dev)

A listagem de questões retorna:

```json
{
  "metadata": { "limit": 10, "offset": 0, "total": 180, "hasMore": true },
  "questions": [ ... ]
}
```

### Erros (enem.dev)

Formato padrão:

```json
{
  "error": {
    "code": "not_found",
    "message": "The requested resource was not found.",
    "docUrl": "https://enem.dev/docs/errors#not-found"
  }
}
```

Códigos comuns:
- `bad_request` (400)
- `not_found` (404)
- `unprocessable_entity` (422)
- `rate_limit_exceeded` (429)
- `internal_server_error` (500)

### Rate limit (enem.dev)

A API expõe cabeçalhos IETF:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (ms)
- `Retry-After` (ms)

Quando o limite é excedido, o backend deve respeitar `Retry-After`.

---

## 2) Arquitetura no backend (Express + Prisma)

### Onde fica o código

O módulo foi implementado em:

- `backend/src/modules/enem/*`

Arquivos principais:
- `enem.routes.ts`: rotas internas (`/api/enem/...`)
- `enem.controller.ts`: validação/parse de params/query
- `enem.service.ts`: orquestra (cache + leitura + fallback no banco)
- `enem.client.ts`: HTTP client com timeout + retry/backoff + tratamento de 429
- `enem.cache.ts`: cache em memória com TTL
- `enem.mapper.ts`: normalização para DTOs internos

### Configuração (ENV)

Variável principal:
- `ENEM_API_BASE_URL` (default: `https://api.enem.dev/v1`)

Isso permite **self-hosting** sem mudar código.

Exemplo em `.env`/`backend/.env`:

```bash
ENEM_API_BASE_URL=https://api.enem.dev/v1
```

Se você hospedar sua instância (ex.: Vercel), aponte para ela:

```bash
ENEM_API_BASE_URL=https://minha-instancia.vercel.app/v1
```

> Observação importante: comandos do Prisma exigem `DATABASE_URL` definida (o Prisma CLI lê `.env`, não lê `env.ts`).

### Endpoints internos do MindRush

Base: `/api/enem`

- `GET /api/enem/provas`
  - Busca `GET {ENEM_API_BASE_URL}/exams`
  - Cache 1h
  - Runtime **read-only** (não persiste)
  - Fallback: banco local (se já estiver pré-carregado)

- `GET /api/enem/provas/:year`
  - Busca `GET {ENEM_API_BASE_URL}/exams/{year}`
  - Cache 1h
  - Runtime **read-only** (não persiste)
  - Fallback: banco local (se já estiver pré-carregado)

- `GET /api/enem/provas/:year/questoes?limit=&offset=&language=`
  - Busca `GET {ENEM_API_BASE_URL}/exams/{year}/questions`
  - Cache 1h por combinação (`year|limit|offset|language`)
  - Runtime **read-only** (não persiste)
  - Fallback: banco local com `skip/take` (best-effort)

- `GET /api/enem/provas/:year/questoes/:index?language=`
  - Busca `GET {ENEM_API_BASE_URL}/exams/{year}/questions/{index}`
  - Cache 1h
  - Runtime **read-only** (não persiste)
  - Fallback: banco local (tenta com language e sem language)

### Cache

- Cache em memória, TTL = **1 hora**.
- O cache é intencionalmente simples (MVP) para reduzir 429.
- Não cacheia erros.

### Retry + 429

O client (`enem.client.ts`) aplica retry em:
- `429` (respeitando `Retry-After` em milissegundos)
- `5xx`
- timeouts/erros de rede

Estratégia:
- exponential backoff + jitter
- máximo de tentativas controlado

### Persistência (Prisma) e fallback

Modelos adicionados em `backend/prisma/schema.prisma`:

- `EnemExam` → tabela `enem_exams`
- `EnemQuestion` → tabela `enem_questions`

Chave da questão (`EnemQuestion.id`):
- formato: `"{year}:{index}:{languageOrPt}"`
- exemplo: `2020:42:ingles`

**Importante:** no estágio atual, os endpoints `/api/enem/*` **não fazem escrita no banco**.
A persistência é feita por um script dedicado de ingestão (pré-carga).

#### Script de ingestão (pré-carga)

O backend inclui o script:

```bash
cd backend
npm run enem:sync
```

Ele:
- baixa a lista de provas (`/exams`)
- faz upsert em `enem_exams`
- baixa páginas de questões por ano (`/exams/{year}/questions?limit=&offset=`)
- repete para os idiomas disponíveis (ex.: `ingles`, `espanhol`) e também a versão default
- faz upsert em `enem_questions`

Fallback:
- se a chamada externa falhar, o backend tenta responder do banco local
- se não houver dados locais, retorna erro de indisponibilidade/404 conforme o caso

---

## 3) Como rodar (dev)

1) Subir Postgres:

```bash
docker compose up -d
```

2) Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

3) Smoke test:

- `GET http://localhost:8080/api/health`
- `GET http://localhost:8080/api/enem/provas`

---

## 4) Consumo no frontend (React)

### Service

Arquivo:
- `frontend/src/services/enemService.ts`

Ele chama a API interna (`/api/enem/...`) via Axios configurado em `frontend/src/services/api.ts`.

### Hook

Arquivo:
- `frontend/src/hooks/useQuestoes.ts`

Exemplo de uso:

```ts
const { data, loading, error, refetch } = useQuestoes({
  year: 2023,
  limit: 10,
  offset: 0,
  language: "ingles" // opcional
});
```

### Página integrada

A página existente foi adaptada para consumir a API real:
- `frontend/src/pages/Questions.tsx`

Comportamento:
- filtros mínimos: `Ano`, `Idioma`, `Por página`
- paginação por `offset` é aplicada ao avançar além da última questão do “lote” atual

---

## 5) Observações e próximos passos (técnicos)

- A enem.dev não fornece explicação detalhada das questões.
- No modo **Jornada de Questões**, o app evita expor **gabarito** durante a tentativa: o resultado só aparece ao **finalizar** o questionário.
- Próxima evolução natural:
  - Persistir tentativas do usuário (acerto/erro/tempo) para gamificação e estatísticas.
  - Criar um endpoint interno tipo `POST /api/questions/:id/attempt` (separado do ENEM) para registrar desempenho.
  - (Opcional) trocar cache em memória por Redis em produção.
