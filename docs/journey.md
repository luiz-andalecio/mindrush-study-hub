# Jornada de Questões (Duolingo-like) — MindRush

Este documento descreve o fluxo atual da **Jornada de Questões**: como os cards (nodes) funcionam, quais endpoints o frontend usa e quais são as regras de negócio.

> Objetivo do design: durante a tentativa, o usuário pode **navegar e editar respostas livremente**, mas **não vê gabarito nem acerto/erro**. O resultado só é mostrado quando o usuário clicar em **Finalizar Questionário**.

---

## 1) Pré-requisito: questões pré-carregadas no banco

A Jornada seleciona questões **somente do banco** (`enem_questions`).

Antes de usar, faça a ingestão (uma vez):

```bash
cd backend
npm run enem:sync
```

- O runtime normal (`/api/enem/*`) trata a enem.dev como **read-only**.
- Se a enem.dev estiver fora do ar, o sistema segue funcionando via **fallback** para o banco, desde que ele esteja pré-carregado.

---

## 2) Conceitos

- **Journey**: uma “trilha” para uma área do ENEM.
- **Node (card)**: um card com um conjunto fixo de questões (ex.: 5) que precisa ser concluído para avançar.
- **Attempt (tentativa)**: cada vez que o usuário faz o questionário de um node.
- **Answer**: resposta salva para uma questão dentro de uma tentativa.

Status de um node:
- `LOCKED`: bloqueado (não pode iniciar)
- `AVAILABLE`: disponível
- `COMPLETED`: concluído (pode ver histórico/resultados)

---

## 3) API (Backend)

Base: `/api/journey` (rotas protegidas por autenticação).

### 3.1) Listar jornadas

`GET /api/journey`

Retorna o resumo das jornadas do usuário.

### 3.2) Criar jornada

`POST /api/journey`

Body:

```json
{
  "area": "Linguagens" | "Ciências Humanas" | "Ciências da Natureza" | "Matemática",
  "language": "ingles" | "espanhol" 
}
```

- `language` é usado **somente** quando `area === "Linguagens"`.
- Para Português, a seleção usa a versão padrão (na base, o campo pode aparecer como `null`).

### 3.3) Obter jornada (mapa + nodes)

`GET /api/journey/:id`

Retorna a jornada e seus nodes, com status (`LOCKED`/`AVAILABLE`/`COMPLETED`).

---

## 4) Fluxo do questionário por Node

### 4.1) Detalhes do node (inclui tentativa e respostas)

`GET /api/journey/nodes/:nodeId`

Retorna:
- `node`: dados do card (ano, disciplina, regras de XP/coins, questões)
- `attempt`: tentativa atual (se existir) + respostas salvas

Regras importantes:
- Se a tentativa **ainda não foi finalizada**, as questões retornam no formato **público** (sem `correctAlternative`).
- Se a tentativa já foi concluída, os detalhes podem incluir questões com gabarito (para histórico).

### 4.2) Salvar resposta (editável)

`POST /api/journey/nodes/:nodeId/answer`

Body:

```json
{
  "enemQuestionId": "2020:42:pt",
  "selectedAlternative": "A"
}
```

Comportamento:
- Cria uma tentativa se ainda não existir.
- Salva/atualiza a resposta (pode sobrescrever).
- Não calcula acerto/erro.
- Não finaliza automaticamente.

### 4.3) Finalizar (calcula resultado + recompensa)

`POST /api/journey/nodes/:nodeId/finalize`

Comportamento:
- Valida se o usuário respondeu todas as questões obrigatórias do node.
- Calcula `correctCount`, `passed` e recompensa (`xpEarned`, `coinsEarned`).
- Marca tentativa como concluída.
- Desbloqueia o próximo node (se aplicável).
- Retorna `results` com:
  - `isCorrect`
  - `selectedAlternative` vs `correctAlternative`
  - questão com gabarito (para renderizar verde/vermelho)

### 4.4) Tentar de novo (nova tentativa)

`POST /api/journey/nodes/:nodeId/retry`

Comportamento:
- Cria uma nova tentativa para o mesmo node.
- Zera as respostas do “estado atual” (porque troca de attempt).
- A UI volta para o modo questionário.

---

## 5) Frontend (página de Questões)

A página que consome esse fluxo é:

- `frontend/src/pages/Questions.tsx`

Comportamento esperado:
- Usuário escolhe área (e idioma, em Linguagens) e cria/abre uma Jornada.
- Abre um node disponível e responde as questões.
- Pode navegar entre as questões já respondidas e editar respostas livremente.
- Só vê resultado ao clicar em **Finalizar Questionário** (com modal de confirmação).
- Em node concluído, a UI permite ver o histórico (resultado) e clicar em **Tentar de novo**.

---

## 6) Dica de renderização (Markdown + imagens)

Os textos vindos do ENEM podem conter markdown básico (ex.: `**negrito**`, links e imagens inline `![](url)`).

O frontend renderiza esses blocos com `react-markdown` + `remark-gfm`.
