# Autenticação (JWT + Refresh Cookie + CSRF)

Este projeto usa um fluxo moderno de autenticação com **Access Token (JWT) de curta duração** e **Refresh Token em cookie httpOnly**, com proteção contra **XSS** e **CSRF**.

## Objetivos

- **Não armazenar tokens em `localStorage`** (reduz impacto de XSS).
- Manter a UX de “sessão persistente”: ao recarregar a página, o app tenta recuperar a sessão via `refresh`.
- Reduzir risco de **CSRF** em endpoints que dependem de cookies.
- Permitir **rotação** de refresh token e invalidação de sessão.

## Resumo do fluxo

1) **Login / Register**
- O backend cria uma sessão (tabela `sessions`) e retorna:
  - `token` (access token) no corpo da resposta
  - cookie `mindrush_rt` (refresh token) **httpOnly**
  - cookie `mindrush_csrf` (token CSRF) **não-httpOnly**
- O frontend guarda o `token` **somente em memória**.

2) **Requests autenticadas**
- O frontend envia `Authorization: Bearer <accessToken>`.

3) **Expiração do access token**
- Se uma request recebe `401`, o Axios tenta:
  - chamar `POST /api/auth/refresh`
  - receber um novo access token
  - repetir a request original automaticamente

4) **Logout**
- O frontend chama `POST /api/auth/logout`.
- O backend revoga a sessão e limpa cookies.

## Por que access token em memória?

- Guardar access token em `localStorage` deixa o token exposto em caso de **XSS**.
- Guardar em memória limita a “janela” do ataque: ao recarregar/fechar o navegador, o token some.
- A persistência de sessão é feita com refresh token **httpOnly** (não acessível via JS).

Trade-off:
- Ao recarregar a página, precisamos fazer `refresh` para obter um novo access token.

## Cookies e CSRF (Double Submit Cookie)

Como o refresh token está em cookie, o browser o envia automaticamente. Isso abre a possibilidade de **CSRF**.

Mitigação adotada: **double submit**
- Backend envia um cookie `mindrush_csrf` (não-httpOnly)
- Frontend lê esse cookie e envia o mesmo valor no header `x-csrf-token`
- Backend valida se **cookie CSRF == header CSRF**

Endpoints que exigem CSRF:
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Rotação de Refresh Token

No backend, cada refresh token está associado a uma **sessão**.
Em cada `refresh`:
- o backend valida a sessão
- **rotaciona** o refresh token (gera um novo)
- invalida o refresh antigo (protege contra replay)

## Frontend: onde está implementado

- [frontend/src/contexts/AuthContext.tsx](../frontend/src/contexts/AuthContext.tsx)
  - `refreshSession()` roda no boot para recuperar a sessão
  - `login()`, `register()`, `logout()` controlam a sessão no React

- [frontend/src/services/api.ts](../frontend/src/services/api.ts)
  - Interceptor de request:
    - adiciona `Authorization` com token em memória
    - adiciona `x-csrf-token` a partir do cookie `mindrush_csrf`
  - Interceptor de response:
    - em `401`, tenta `POST /auth/refresh` e repete a request

- [frontend/src/auth/tokenStore.ts](../frontend/src/auth/tokenStore.ts)
  - access token guardado somente em memória (variável de módulo)

## Backend: endpoints relevantes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Notas importantes (produção)

- **HTTPS**: em produção, configure cookies com `Secure` e use HTTPS.
- **CORS**: se frontend e backend estiverem em domínios diferentes, configure `cors({ credentials: true, origin: ... })` no backend.
- **SameSite**:
  - `Lax` funciona bem para muitos cenários “same-site” e reduz CSRF.
  - Para cross-site (domínios diferentes) pode exigir `SameSite=None; Secure`.
