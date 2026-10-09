# Somos do Bem: plataforma digital

Plataforma web da **Associação Somos do Bem**, organização da sociedade civil de Indaiatuba (SP)
dedicada à inclusão de pessoas com deficiência. O projeto foi desenvolvido para o **FIC 2026** e
reúne, num único sistema, o site institucional, a captação de recursos e as ferramentas de
trabalho da equipe.

## Sumário

1. [O problema](#o-problema)
2. [A solução](#a-solução)
3. [Diferenciais](#diferenciais)
4. [Visão técnica](#visão-técnica)
5. [Arquitetura](#arquitetura)
6. [Estrutura do repositório](#estrutura-do-repositório)
7. [Como executar](#como-executar)
8. [Variáveis de ambiente](#variáveis-de-ambiente)
9. [Qualidade e testes](#qualidade-e-testes)
10. [Documentação de cada pacote](#documentação-de-cada-pacote)

## O problema

Como muitas associações, a Somos do Bem cresceu com as ferramentas que estavam à mão. Doações,
patrocínios, venda de convites e venda de produtos eram controlados em sistemas diferentes e em
planilhas. A divulgação dependia quase só de redes sociais e de mensagens, e a confirmação de um
pagamento exigia conferir comprovantes manualmente. Faltava ainda um portal de transparência e um
programa estruturado de voluntariado.

## A solução

A plataforma organiza esse trabalho em duas frentes que conversam entre si.

**Para o público**, um site acessível onde qualquer pessoa pode conhecer a associação, acompanhar
notícias, apoiar uma campanha, comprar um convite ou um produto e pagar por PIX, cartão ou boleto.
Depois do pagamento, a pessoa recebe um recibo que pode ser conferido pela internet e um
certificado de agradecimento que pode ser recuperado a qualquer momento. Quem quiser pode ter o
nome no Mural do Bem, sem que nenhum valor seja exibido.

**Para a equipe**, um painel em que cada pessoa vê apenas o que é do seu papel. O financeiro
acompanha transações, reconciliação, recibos e doadores. A comunicação cuida de campanhas,
eventos, produtos, notícias e certificados. A administração enxerga tudo.

A ideia central que torna o sistema simples de manter é esta: **toda entrada de dinheiro é uma
transação**. Doação, patrocínio, convite e produto passam pelo mesmo caminho, pelo mesmo checkout e
pelo mesmo painel. Um único domínio resolve quatro fluxos, em vez de quatro sistemas paralelos.

## Diferenciais

- **Recibos à prova de adulteração.** Cada recibo carrega o hash SHA-256 do anterior, formando uma
  corrente verificável publicamente. Alterar um registro antigo quebra todos os elos seguintes.
- **Confirmação automática e confiável.** O pagamento só é confirmado pelo webhook assinado do
  gateway, com conferência de valor em centavos e processamento idempotente.
- **Estúdio de certificados.** Um editor visual no estilo de slides, com versões imutáveis por
  campanha e por evento. Cada recibo lembra a versão com que foi emitido.
- **Mural do Bem com privacidade por construção.** Só aparece quem autorizou, a ordem é sorteada e
  nenhum valor sai da API.
- **Acessibilidade como requisito.** Navegação completa por teclado, contraste WCAG AA, HTML
  semântico e o **Modo Leitura Fácil**, que reescreve o conteúdo com uma ideia por frase.
- **Desempenho em aparelhos modestos.** Animações e cenas 3D são melhorias progressivas, ativadas
  apenas quando o dispositivo comporta, sem nunca alterar o layout.
- **Componentes próprios.** Toda a interface foi escrita do zero, sem bibliotecas de componentes
  prontas, de acordo com as necessidades da associação.

## Visão técnica

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, React Router 7, TanStack Query 5, Axios, TailwindCSS 4, GSAP, Three.js |
| Backend | Node.js 24, TypeScript 7, Express 5, Sequelize 6, Zod 4 com OpenAPI, JWT, bcrypt |
| Banco de dados | MySQL 8.4 em Docker, com migrations versionadas |
| Pagamentos | Stripe (Checkout Session e webhooks assinados) |
| Documentos | PDFKit e QR code, com fontes livres embutidas |
| Qualidade | Jest no backend, Vitest e Testing Library no frontend, `oxlint`, checagem de tipos estrita |

## Arquitetura

O repositório é um monorepo com dois pacotes independentes que se comunicam por HTTP.

```mermaid
flowchart LR
  subgraph Navegador
    W[SPA React<br/>frontend/]
  end
  subgraph Servidor
    A[API REST Express<br/>backend/]
    D[(MySQL 8.4)]
  end
  S[Stripe]
  W -- "JSON /api/v1 (JWT Bearer)" --> A
  A --> D
  A -- Checkout Session --> S
  S -- webhook assinado --> A
  S -- retorno do pagador --> W
```

- **Frontend:** uma SPA que separa página, hook de dados, serviço e cliente HTTP. A sessão é
  reconstruída a partir da API a cada carregamento, e cada rota privada é protegida pelo papel do
  usuário.
- **Backend:** uma API em camadas (rota, middleware, controller, serviço e model), com validação
  por Zod, documentação OpenAPI gerada a partir do próprio código e regras de dinheiro executadas
  de forma atômica no banco.
- **Integração de pagamento:** a transação é gravada antes do redirecionamento ao Stripe, e só o
  webhook muda o seu estado para confirmado. O site acompanha o status por consulta, sem jamais
  presumir sucesso.

O detalhamento de cada camada, das rotas e dos fluxos está nos READMEs de cada pacote.

## Estrutura do repositório

```
.
├── backend/          API REST, migrations, seed de demonstração e testes
├── frontend/         site público, área da equipe e testes de jornada
└── docs/             prototipação e capturas de tela entregues à competição
```

## Como executar

### Pré-requisitos

- Node.js 24 ou superior
- Docker com Docker Compose
- [Stripe CLI](https://docs.stripe.com/stripe-cli), para pagamentos de teste no navegador

### Passo a passo

São três terminais: a API, o encaminhamento de eventos do Stripe e o site.

```bash
# Terminal 1: banco de dados e API
cd backend
npm install
cp .env.example .env              # preencha os segredos (veja abaixo)
docker compose up -d              # MySQL 8.4
npx sequelize-cli db:migrate      # schema
npx tsx src/scripts/seed.ts       # carga de demonstração (apaga e recria os dados)
npm run dev                       # http://localhost:3333/api/v1

# Terminal 2: eventos do Stripe para a API
stripe listen --forward-to http://localhost:3333/api/v1/transaction/webhook
# copie o segredo whsec_... impresso para STRIPE_WEBHOOK_SECRET no backend/.env
# e reinicie a API

# Terminal 3: site
cd frontend
npm install
cp .env.example .env
npm run dev                       # http://localhost:5173
```

| Endereço | O que é |
|---|---|
| `http://localhost:5173` | Site público |
| `http://localhost:5173/entrar` | Login da equipe |
| `http://localhost:3333/api/v1/ping` | Verificação de que a API está no ar |
| `http://localhost:3333/api-docs` | Documentação interativa da API (Swagger UI) |

### Acessos de demonstração

Todos com a senha `Somos@2026`:

| E-mail | Papel |
|---|---|
| `admin@somosdobem.org.br` | Administração |
| `financeiro@somosdobem.org.br` | Financeiro |
| `comunicacao@somosdobem.org.br` | Comunicação |
| `voluntario@somosdobem.org.br` | Voluntariado |

Para pagar um checkout de teste, use o cartão `4242 4242 4242 4242`, com qualquer data futura e
qualquer CVC.

## Variáveis de ambiente

Cada pacote valida as próprias variáveis na inicialização e se recusa a subir com um valor
inválido. Os arquivos de exemplo ficam versionados ao lado de cada pacote.

### `backend/.env.example`

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

### `frontend/.env.example`

```dotenv
# Endereço da API do backend. Precisa incluir o prefixo /api/v1.
# Padrão usado quando a variável não existe: http://localhost:3333/api/v1
VITE_API_URL=http://localhost:3333/api/v1
```

A descrição de cada variável, com obrigatoriedade e valor padrão, está nos READMEs dos pacotes.

## Qualidade e testes

```bash
# Backend: checagem de tipos e testes unitários em formato de jornada
cd backend && npm run typecheck && npm test

# Frontend: lint, checagem de tipos com build de produção e testes de jornada
cd frontend && npm run lint && npm run build && npm test
```

Os testes do backend isolam banco e gateway com dublês e chamam os controllers diretamente. Os do
frontend percorrem jornadas reais de usuário e localizam elementos pelo papel e pelo nome
acessível, de modo que cada teste também comprova um requisito de acessibilidade.

## Documentação de cada pacote

| Documento | Conteúdo |
|---|---|
| [`backend/README.md`](backend/README.md) | Arquitetura da API, todas as rotas, fluxos de pagamento, recibo, certificado e mural, segurança e execução |
| [`frontend/README.md`](frontend/README.md) | Arquitetura da SPA, telas e rotas, sessão, checkout, estúdio de certificados, acessibilidade e execução |
| [`backend/docker-commands.md`](backend/docker-commands.md) | Comandos de operação do container do MySQL |
