# Backend da Somos do Bem

API REST da associação **Somos do Bem** (Indaiatuba, SP), desenvolvida para o FIC 2026. É o motor
que sustenta o site público e o painel da equipe: recebe doações, vende convites e produtos, emite
recibos verificáveis, publica notícias, desenha certificados e agradece publicamente a quem
autorizou.

O site que consome esta API fica em `../frontend`. A visão geral do projeto está no
[README da raiz](../README.md).

## Sumário

1. [O que a API resolve](#o-que-a-api-resolve)
2. [Stack](#stack)
3. [Arquitetura](#arquitetura)
4. [Domínios e rotas](#domínios-e-rotas)
5. [Fluxos principais](#fluxos-principais)
6. [Segurança](#segurança)
7. [Como executar](#como-executar)
8. [Variáveis de ambiente](#variáveis-de-ambiente)
9. [Comandos](#comandos)
10. [Testes](#testes)
11. [Convenções de código](#convenções-de-código)

## O que a API resolve

Antes deste sistema, a associação controlava doações, patrocínios, convites e produtos em
ferramentas separadas e em planilhas. A API reúne tudo isso em um único lugar, a partir de uma
ideia simples: **toda entrada de dinheiro é uma transação**. Uma doação, um patrocínio, um convite
de evento e a compra de uma camiseta passam pelo mesmo caminho, pelo mesmo checkout e pelo mesmo
painel financeiro.

Em linguagem direta, a API permite:

- **Receber contribuições** por PIX, cartão ou boleto, com confirmação automática do pagamento.
- **Vender convites e produtos** com controle de vagas e de estoque que nunca vende o que não tem.
- **Emitir recibos** numerados que qualquer pessoa consegue conferir pela internet, sem login.
- **Desenhar certificados** de agradecimento por campanha ou evento, guardando cada versão.
- **Publicar notícias** com rascunho, publicação e arquivamento.
- **Manter o Mural do Bem**, que mostra o nome de quem pediu para aparecer, sem nunca revelar valores.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript 7 (`strict`), ESM, `nodenext`, alvo ES2024 |
| Runtime | Node.js 24 |
| HTTP | Express 5.2 |
| Banco de dados | MySQL 8.4 (Docker) com Sequelize 6 e `sequelize-cli` |
| Validação e OpenAPI | Zod 4 (`zod/v4`) e `zod-openapi`, servidos pelo `swagger-ui-express` |
| Autenticação | JWT (`jsonwebtoken`, HS256, 2 horas) e `bcryptjs` (custo 10) |
| Pagamentos | Stripe 22 (Checkout Session e webhooks assinados) |
| Documentos | PDFKit (recibo e certificado) e `qrcode` |
| Proteção | `helmet`, `express-rate-limit` (200 requisições por minuto), CORS |
| Observabilidade | `pino-http` com `pino-pretty` em desenvolvimento |
| Testes | Jest 30 via Babel |
| Execução em desenvolvimento | `tsx --watch` |

## Arquitetura

A API segue uma arquitetura em camadas (MVC com camada de serviço), organizada **primeiro por papel
e depois por domínio**. Cada camada tem uma responsabilidade única, o que deixa o código previsível
para quem vai mantê-lo depois da competição.

```mermaid
flowchart LR
  C[Cliente HTTP] --> R[Route]
  R --> A{AuthMiddleware<br/>RoleMiddleware}
  A --> CT[Controller]
  CT --> S[Service]
  S --> M[Model Sequelize]
  M --> DB[(MySQL 8.4)]
  S --> G[Stripe]
  S --> U[utils: PDF, hash, layout]
```

| Camada | Responsabilidade |
|---|---|
| `routes/` | Apenas a ligação entre caminho, middlewares e controller. Nenhuma regra mora aqui. |
| `middlewares/` | `AuthMiddleware` valida o Bearer JWT e recarrega o usuário do banco; `RoleMiddleware` confere o papel. |
| `controllers/` | Valida a entrada com Zod, chama o serviço, traduz erro de domínio em status HTTP e monta a resposta. |
| `services/` | Regras de negócio e acesso a dados. Nunca toca em `req` ou `res`; lança erros de domínio. |
| `models/` | Classes Sequelize e as associações, reunidas em `models/index.ts`. |
| `utils/` | Funções puras e templates de documento: PDF, corrente de hash, dinheiro, layout do certificado. |
| `docs/` | Um arquivo `*.doc.ts` por endpoint, transformado em OpenAPI 3 pelo `config/swagger.ts`. |

### Estrutura de pastas

```
src/
├── server.ts              raiz de composição: cadeia de middlewares e inicialização
├── @types/                extensão global do Request (req.user)
├── config/                env, sequelize, errors, swagger, stripe, organization, database.cjs
├── models/                classes Sequelize e o barrel index.ts com as associações
├── migrations/            migrations do sequelize-cli (CommonJS)
├── routes/                um router por domínio, montados em routes/index.ts
├── controllers/<domínio>/ validação Zod, mapeamento de erro e formato da resposta
├── services/<domínio>/    regras de negócio
├── middlewares/           autenticação e autorização por papel
├── interfaces/            formas das entidades, consumidas via Pick<> nos serviços
├── docs/<domínio>/        documentação OpenAPI como código
├── utils/                 helpers puros e templates de PDF
├── assets/                logos, fontes livres do certificado e imagens de demonstração
├── scripts/               seed de demonstração e gerador da tabela de larguras de fonte
└── tests/                 testes unitários em formato de jornada
```

### Princípios de projeto

- **Um domínio resolve quatro fluxos.** Doação, patrocínio, convite e produto são tipos da mesma
  `Transaction`, o que reduz o custo de manutenção e mantém um único painel financeiro.
- **Dinheiro nunca passa por ponto flutuante.** Colunas `DECIMAL` trafegam como `string`, a
  aritmética acontece no SQL (`increment` e `decrement`) e conversões inevitáveis usam centavos
  inteiros (`utils/money.ts`).
- **Preço nunca vem do corpo da requisição.** Produto e convite são precificados pelo catálogo; um
  valor enviado pelo cliente é recusado com 400.
- **Recurso finito é debitado de forma atômica.** Estoque e vagas usam `UPDATE ... WHERE` condicional
  com conferência das linhas afetadas, nunca ler, decidir e escrever.
- **Uma ação de negócio é uma transação de banco.** Todos os efeitos, inclusive a linha de auditoria,
  acontecem juntos ou não acontecem. Chamadas de rede ficam fora da transação, para nenhuma trava de
  linha esperar uma API externa.
- **Erro como fluxo de controle.** Serviços lançam `NotFoundError`, `BadRequestError`,
  `UnauthorizedError` e `ForbiddenError`; cada controller traduz com `instanceof`.

## Domínios e rotas

Todas as rotas ficam sob o prefixo `/api/v1`. A convenção é por ação (`/<domínio>/<ação>`), e o
verbo HTTP continua carregando a intenção. Conteúdo público é endereçado por `slug` e documento
verificável por `hash`, nunca por um id numérico.

Legenda de acesso: **público** (sem login), **autenticado** (qualquer papel) ou os papéis exigidos
(`admin`, `finance`, `communication`).

### Usuário

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/user/create` | público | Cadastro; o papel nasce sempre `volunteer` |
| POST | `/user/auth` | público | Login; devolve o JWT |
| GET | `/user/profile` | autenticado | Perfil de quem está logado |
| DELETE | `/user/delete` | autenticado | Remove a própria conta |

### Transação, itens e doadores

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/transaction/create` | público | Cria a transação e a sessão de checkout do Stripe |
| POST | `/transaction/webhook` | Stripe (assinatura) | Recebe os eventos do gateway |
| GET | `/transaction/status/:id` | público | Status do pedido; o UUID é a credencial |
| GET | `/transaction/list` | admin, finance | Lista com filtros |
| GET | `/transaction/:id` | admin, finance | Detalhe com itens e auditoria |
| PATCH | `/transaction/confirm/:id` | admin, finance | Confirmação manual com motivo |
| PATCH | `/transaction/refuse/:id` | admin, finance | Recusa com motivo |
| PATCH | `/transaction/cancel/:id` | admin, finance | Cancelamento com motivo |
| PATCH | `/transaction/refund/:id` | admin, finance | Estorno no gateway e reversão dos efeitos |
| GET | `/transaction-item/list` | admin, finance | Itens vendidos |
| GET | `/transaction-item/summary` | admin, finance | Resumo de vendas por produto |
| POST | `/donor/create` | admin, finance | Cadastro manual de doador |
| GET | `/donor/list` | admin, finance | Lista de doadores |
| GET | `/donor/profile` | autenticado | Doador ligado ao usuário logado |
| GET | `/donor/:id` | admin, finance | Detalhe do doador |
| PUT | `/donor/update/:id` | admin, finance | Atualização de cadastro |
| PATCH | `/donor/anonymize/:id` | admin | Anonimização (LGPD) |

### Campanhas, eventos e produtos

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/campaign/create` | admin, communication | Cria campanha (rascunho) |
| GET | `/campaign/list` | público | Campanhas publicadas |
| GET | `/campaign/list-all` | admin, communication | Todas as campanhas |
| GET | `/campaign/:slug` | público | Detalhe por slug |
| PUT | `/campaign/update/:id` | admin, communication | Edição |
| PATCH | `/campaign/publish/:id` · `/campaign/finish/:id` | admin, communication | Publica ou encerra |
| PATCH | `/campaign/cancel/:id` | admin | Cancela |
| DELETE | `/campaign/delete/:id` | admin | Apaga |
| POST | `/event/create` | admin, communication | Cria evento |
| GET | `/event/list` · `/event/:slug` | público | Agenda e detalhe |
| GET | `/event/list-all` | admin, communication | Todos os eventos |
| PUT | `/event/update/:id` | admin, communication | Edição |
| PATCH | `/event/publish/:id` · `/event/capacity/:id` · `/event/finish/:id` | admin, communication | Publica, ajusta capacidade ou encerra |
| PATCH | `/event/cancel/:id` | admin | Cancela |
| DELETE | `/event/delete/:id` | admin | Apaga |
| POST | `/product/create` | admin, communication | Cria produto |
| GET | `/product/list` · `/product/:id` | público | Catálogo e detalhe |
| GET | `/product/list-all` | admin, communication | Todos os produtos |
| PUT | `/product/update/:id` | admin, communication | Edição |
| PATCH | `/product/activate/:id` · `/product/deactivate/:id` · `/product/stock/:id` | admin, communication | Ativa, desativa ou ajusta estoque |
| DELETE | `/product/delete/:id` | admin | Apaga |

### Recibos e certificados

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/receipt/verify/:hash` | público | Confere o recibo contra a corrente de hash |
| GET | `/receipt/download/:hash` | público | PDF do recibo institucional |
| GET | `/receipt/certificate/:hash` | público | PDF do certificado de agradecimento |
| GET | `/receipt/view-certificate/:hash` | público | Dados da segunda via para o site desenhar |
| GET | `/receipt/list` · `/receipt/:id` | admin, finance | Lista e detalhe |
| GET | `/certificate/list-folders` | admin, communication | Pastas: padrão, por campanha e por evento |
| GET | `/certificate/list-designs` | admin, communication | Versões de uma pasta |
| POST | `/certificate/create-design` | admin, communication | Salva a próxima versão |
| POST | `/certificate/preview` | admin, communication | Prévia em PDF de um desenho não salvo |
| GET | `/certificate/preview/:id` | admin, communication | Prévia em PDF de uma versão salva |
| GET | `/certificate/list-issued` | admin, finance | Certificados emitidos |
| POST | `/certificate/upload-asset` | admin, communication | Envio de imagem crua (PNG ou JPEG) |
| GET | `/certificate/list-assets` | admin, communication | Biblioteca de imagens |
| GET | `/certificate/asset/:id` | público | Imagem da biblioteca, imutável |

### Notícias e Mural do Bem

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/post/create` | admin, communication | Cria rascunho |
| GET | `/post/list` · `/post/:slug` | público | Notícias publicadas e leitura por slug |
| GET | `/post/list-all` | admin, communication | Todas as notícias |
| PUT | `/post/update/:id` | admin, communication | Edição |
| PATCH | `/post/publish/:id` · `/post/archive/:id` | admin, communication | Publica ou arquiva |
| DELETE | `/post/delete/:id` | admin | Apaga (somente rascunho) |
| GET | `/supporter/list` | público | Mural geral |
| GET | `/supporter/campaign/:slug` · `/supporter/event/:slug` | público | Mural de uma campanha ou evento |

A documentação interativa completa, com corpos, parâmetros e respostas, está no Swagger UI em
`http://localhost:3333/api-docs`, e a especificação OpenAPI bruta em
`http://localhost:3333/openapi.json`.

### Formato das respostas

Sucesso devolve `{ "message": "Title Case Sentence", "<entidade>": { ... } }`. Falha devolve
`{ "error": "..." }`, e falhas de validação acrescentam `errors: [{ code, message, path }]`.

| Status | Quando |
|---|---|
| 400 | Falha de validação Zod ou `BadRequestError` |
| 401 | Token ausente, inválido ou expirado |
| 403 | Papel sem permissão para a rota |
| 404 | Recurso inexistente |
| 429 | Limite de requisições excedido |
| 500 | Erro inesperado, registrado no log |

## Fluxos principais

### Pagamento e confirmação

A transação é gravada **antes** de o pagador ir ao Stripe, e só o webhook assinado confirma o
pagamento. Voltar do checkout não prova nada: o site consulta o status até a API dizer
`confirmed`.

```mermaid
sequenceDiagram
  participant S as Site
  participant A as API
  participant DB as MySQL
  participant ST as Stripe
  S->>A: POST /transaction/create
  A->>DB: grava transação pending e linha de auditoria
  A->>ST: cria Checkout Session (fora da transação de banco)
  A-->>S: checkout_url
  S->>ST: pagador conclui o pagamento
  ST->>A: POST /transaction/webhook (assinado)
  A->>A: confere assinatura e valor em centavos
  A->>DB: confirma, soma na campanha, debita vaga ou estoque, emite recibo
  S->>A: GET /transaction/status/:id (consulta periódica)
  A-->>S: confirmed e hash do recibo
```

Estados possíveis de uma transação: `pending`, `awaiting_confirmation`, `confirmed`, `refused`,
`cancelled` e `refunded`. Cada mudança grava uma linha em `transaction_audit_logs` com autor,
origem e motivo.

O webhook é **idempotente** (um evento que chega num status já aplicado é reconhecido e não
reaplicado), compara o valor pago com o registrado em centavos, trata estorno parcial como caso de
reconciliação e sempre responde 200, porque qualquer outro status faz o gateway reenviar o mesmo
evento por dias.

### Recibo com corrente de hash

Cada recibo guarda o hash SHA-256 do recibo anterior, formando uma corrente semelhante à de um
livro-razão. Alterar um registro antigo muda o hash dele e quebra o elo de todos os que vieram
depois, o que torna adulterações detectáveis por qualquer pessoa.

- A emissão é serializada por uma linha única de sequência travada pela chave primária, o que evita
  deadlock entre confirmações simultâneas.
- A string canônica e a data truncada ao segundo (`utils/receipt-hash.ts`) são as mesmas na emissão,
  na verificação pública e no seed.
- Campos que mudam depois da emissão (cancelamento, versão do certificado) ficam **fora** do hash.

### Estúdio de certificados

O certificado é uma página livre, como um slide: textos, formas, imagens da biblioteca, a logo e um
QR code, cada um com posição, tamanho, rotação e opacidade. Os dados do recibo entram como campos
(`{{nome}}`, `{{valor}}`, `{{titulo}}`, `{{acao}}`, `{{destino}}`, `{{numero}}`, `{{data}}`,
`{{registro}}`, `{{codigo}}`, `{{associacao}}`, `{{cnpj}}`).

- **Versões imutáveis por pasta.** Salvar sempre cria a próxima versão da pasta (`default`,
  `campaign:<id>` ou `event:<id>`), protegida por índice único.
- **O recibo lembra a sua versão.** Na emissão, a API grava a versão mais específica vigente
  (evento, depois campanha, depois padrão). O certificado do Natal passado continua igual ao que o
  doador recebeu.
- **Mesma conta nos dois lados.** A medição de texto e a quebra de linha (`utils/certificate-layout.ts`)
  têm uma cópia idêntica no frontend, e a tabela de larguras das fontes é gerada por script para os
  dois pacotes. O editor quebra a linha exatamente onde o PDF quebra.
- **Oito famílias de letra.** As três padrão do PDF (Helvetica, Times e Courier) e cinco livres
  embutidas no documento: Nunito, Cormorant Garamond, Cinzel, Caveat e Great Vibes, todas sob
  licença OFL, com as licenças na mesma pasta.

### Mural do Bem

Uma vitrine pública de agradecimento com garantias de privacidade por construção:

- Só aparece quem marcou a opção no checkout (padrão `false`) em uma contribuição confirmada e não
  estornada, e cujo cadastro não foi anonimizado.
- A API devolve apenas nomes, nunca valor, data ou quantidade por pessoa.
- A ordem é `SHA2(CONCAT(seed, donor_id))`: aleatória a cada visita e estável dentro da mesma
  semente, então a paginação nunca repete um nome e ninguém aparece na frente por ter doado mais.

## Segurança

- **Autenticação stateless** por JWT HS256 com validade de 2 horas; o middleware recarrega o usuário
  do banco a cada requisição, então um papel alterado vale na hora.
- **Autorização por papel** (`admin`, `finance`, `communication`, `volunteer`): dinheiro responde a
  `finance`, divulgação a `communication` e ações destrutivas apenas a `admin`. O papel nunca é
  aceito no corpo da requisição.
- **Sem enumeração de usuários:** e-mail inexistente e senha errada recebem a mesma mensagem.
- **Senhas** com bcrypt, e `hashed_password` é removido de toda resposta.
- **Webhook autenticado** por HMAC sobre o corpo cru (`express.raw` montado antes do `express.json`).
- **Cabeçalhos de segurança** com `helmet` e **limite de taxa** de 200 requisições por minuto.
- **LGPD:** anonimização de doador e documento mascarado em toda superfície pública.

## Como executar

### Pré-requisitos

- Node.js 24 ou superior
- Docker com Docker Compose
- [Stripe CLI](https://docs.stripe.com/stripe-cli), para pagar um checkout de teste no navegador

### Passo a passo

```bash
# 1. Dependências
npm install

# 2. Ambiente: copie o exemplo e preencha os segredos
cp .env.example .env

# 3. Banco de dados MySQL 8.4 em container
docker compose up -d

# 4. Schema
npx sequelize-cli db:migrate

# 5. Carga de demonstração (apaga e recria todos os dados)
npx tsx src/scripts/seed.ts

# 6. API em modo de desenvolvimento
npm run dev                       # http://localhost:3333/api/v1
```

Para conferir se a API está no ar: `curl http://localhost:3333/api/v1/ping`.

### Pagamentos de teste com o Stripe

Em outro terminal, encaminhe os eventos do Stripe para a API:

```bash
stripe listen --forward-to http://localhost:3333/api/v1/transaction/webhook
```

O comando imprime um segredo `whsec_...`. Ele precisa ser o valor de `STRIPE_WEBHOOK_SECRET` no
`.env`, e a API precisa ser reiniciada depois da troca. Sem o `--forward-to`, a CLI envia para um
endereço onde nada escuta, o pagamento é aprovado no Stripe e a transação fica `pending` para
sempre, porque confirmar é papel exclusivo do webhook.

Use o cartão de teste `4242 4242 4242 4242`, com qualquer data futura e qualquer CVC.

### Acessos de demonstração

O seed cria um usuário por papel, todos com a senha `Somos@2026`:

| E-mail | Papel |
|---|---|
| `admin@somosdobem.org.br` | `admin` |
| `financeiro@somosdobem.org.br` | `finance` |
| `comunicacao@somosdobem.org.br` | `communication` |
| `voluntario@somosdobem.org.br` | `volunteer` |

No fim da execução, o script imprime um hash de recibo válido e um cancelado para testar a
verificação pública. Eles mudam a cada carga.

> O seed executa `TRUNCATE` em todas as tabelas. Nunca o rode contra um banco com dados reais.

## Variáveis de ambiente

As variáveis são validadas por Zod em `src/config/env.ts` no momento da importação: um valor
ausente ou inválido impede a API de subir, em vez de falhar no meio de uma requisição.

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `PORT` | não | `3000` | Porta HTTP. O frontend espera `3333`. |
| `HOST` | não | `0.0.0.0` | Interface de escuta |
| `NODE_ENV` | não | `development` | `development`, `production` ou `test` |
| `DATABASE_URL` | sim | | URL de conexão do MySQL usada pelo Sequelize e pela CLI |
| `JWT_SECRET` | sim | | Segredo de assinatura do JWT (lido direto de `process.env`) |
| `STRIPE_SECRET_KEY` | sim | | Chave secreta do Stripe (`sk_test_...` em desenvolvimento) |
| `STRIPE_WEBHOOK_SECRET` | sim | | Segredo de assinatura do webhook (`whsec_...`) |
| `APP_URL` | não | `http://localhost:3000` | Origem da própria API, impressa no QR do recibo |
| `WEB_URL` | não | `http://localhost:5173` | Origem do site: retorno do Stripe e QR do certificado |
| `MYSQL_*` | sim, para o Docker | | Lidas apenas pelo `docker-compose.yml` para criar o banco |

`APP_URL` e `WEB_URL` não são intercambiáveis. Apontar o retorno do Stripe para `APP_URL` leva o
navegador a uma rota REST que não existe.

### `.env.example`

```dotenv
# Servidor HTTP da API
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

# Conexão do Sequelize com o MySQL. Os dados precisam bater com o bloco MYSQL_* abaixo,
# que é o que o docker-compose usa para criar o banco e o usuário.
DATABASE_URL=mysql://somosdobem:troque-esta-senha@localhost:3306/somosdobem

# Segredo de assinatura do JWT (HS256, validade de 2 horas). Use um valor longo e aleatório,
# por exemplo a saída de: openssl rand -hex 32
JWT_SECRET=troque-por-um-segredo-longo-e-aleatorio

# Container do MySQL 8.4 (lidos apenas pelo docker-compose.yml)
MYSQL_ROOT_PASSWORD=troque-esta-senha-de-root
MYSQL_DATABASE=somosdobem
MYSQL_USER=somosdobem
MYSQL_PASSWORD=troque-esta-senha
MYSQL_PORT=3306

# Stripe em modo de teste: https://dashboard.stripe.com/test/apikeys
# O STRIPE_WEBHOOK_SECRET (whsec_...) é o que o comando `stripe listen` imprime ao iniciar.
STRIPE_SECRET_KEY=sk_test_substitua-pela-sua-chave
STRIPE_WEBHOOK_SECRET=whsec_substitua-pelo-segredo-do-listener

# Origem da própria API: é o endereço impresso no QR do recibo institucional.
APP_URL=http://localhost:3333

# Origem do site (Vite). O Stripe devolve o navegador para cá depois do pagamento,
# e o QR do certificado aponta para a página de segunda via deste endereço.
WEB_URL=http://localhost:5173
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API com recarga automática (`tsx --watch`) |
| `npm test` | Executa a suíte do Jest |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `docker compose up -d` | Sobe o MySQL 8.4 (mais comandos em `docker-commands.md`) |
| `npx sequelize-cli db:migrate` | Aplica as migrations (também `:status`, `:undo`, `:undo:all`) |
| `npx sequelize-cli migration:generate --name <nome>` | Cria uma migration nova |
| `npx tsx src/scripts/seed.ts` | Recria a carga de demonstração |
| `npx tsx src/scripts/generate-certificate-font-metrics.ts` | Regenera a tabela de larguras das fontes nos dois pacotes |
| `stripe events resend <evt_id>` | Reenvia um evento do Stripe sem novo pagamento |

## Testes

Os testes ficam em `src/tests/*.test.ts` e são **unitários escritos como jornadas** (por exemplo,
cadastrar, entrar e acessar uma rota protegida), sempre com ao menos um caminho negativo. Não sobem
servidor HTTP nem banco: os serviços são substituídos com `jest.mock()`, o Sequelize com
`jest.spyOn()`, e os controllers são chamados diretamente com os helpers de `tests/utils/mock-http.ts`.

O Jest roda via Babel e **não checa tipos**, então a validação completa é:

```bash
npm run typecheck && npm test
```

## Convenções de código

- ESM com extensão `.js` obrigatória em todo import relativo; Zod sempre importado de `zod/v4`.
- Arquivos em `kebab-case` com sufixo de papel (`create-user-controller.ts`, `user-model.ts`),
  classes em `PascalCase` e colunas em `snake_case`.
- Um método público por classe: `Controller.handle(req, res)` e `Service.execute(params)`.
- Sem ponto e vírgula, aspas duplas, indentação de 2 espaços e `async/await`.
- Nova funcionalidade replica a vertical existente: model, migration, interface, service,
  controller, route, doc registrado no Swagger e teste.
- Commits em inglês, minúsculos, no imperativo e em uma linha, sem Conventional Commits.

Os comandos de operação do container do MySQL (logs, acesso ao cliente, backup e restauração)
estão reunidos em `docker-commands.md`.
