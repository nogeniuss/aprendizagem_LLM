# Documentação Completa - Projeto Economia Hoje

## 1. Visão Geral do Projeto
O **Economia Hoje** é uma aplicação web que agrega e apresenta informações financeiras e econômicas, incluindo indicadores econômicos, cotações de moedas e notícias do mercado financeiro. O sistema coleta dados de diversas APIs externas, armazena-os em um banco de dados MongoDB e disponibiliza essas informações através de uma interface web interativa e analítica. Além disso, a aplicação utiliza a API da OpenAI para fornecer respostas e análises inteligentes com base nos dados coletados.

## 2. Arquitetura do Sistema

### 2.1 Arquitetura Geral
O projeto segue uma arquitetura MVC (Model-View-Controller) modificada, com as seguintes camadas:

- **Frontend**: Interface de usuário desenvolvida em HTML, CSS e JavaScript
- **Backend**: API RESTful desenvolvida em Node.js com Express
- **Banco de Dados**: MongoDB para armazenamento persistente de dados
- **Serviços Externos**: Integração com APIs terceiras (BrasilAPI, NewsAPI, AwesomeAPI)
- **Integração com IA**: Conexão com OpenAI para análises e respostas inteligentes
- **Scheduler (Cron)**: Coleta periódica de dados financeiros e econômicos

### 2.2 Diagrama de Componentes

```
┌─────────────┐     ┌───────────────────────────────────────┐     ┌─────────────┐
│             │     │               Backend                 │     │             │
│   Frontend  │◄───►│  (Node.js + Express + MongoDB)        │◄───►│  APIs       │
│             │     │                                       │     │  Externas   │
└─────────────┘     └───────────────────────────────────────┘     └─────────────┘
                                      ▲
                                      │
                                      ▼
                               ┌─────────────┐
                               │             │
                               │   OpenAI    │
                               │             │
                               └─────────────┘
```

## 3. Estrutura de Diretórios

```
projeto/
├── backend/
│   ├── connection/
│   │   └── database.js
│   ├── controller/
│   │   ├── openai-controller.js
│   │   ├── cotacoes-controller.js
│   │   ├── indicadores-controller.js
│   │   └── noticias-controller.js
│   ├── models/
│   │   ├── banco.js
│   │   ├── cotacao.js
│   │   ├── indicador.js
│   │   ├── noticias.js
│   │   └── consulta.js
│   ├── rotina/
│   │   ├── dataCollector.js
│   │   ├── requisicao_awesomeapi/
│   │   │   └── requisicao_awesomeapi.js
│   │   ├── requisicao_brasilAPI/
│   │   │   └── requisicaoService.js
│   │   ├── requisicao_newsapi/
│   │   │   └── requisicaoService.js
│   │   └── scheduler.js
│   ├── services/
│   │   ├── openaiService.js
│   │   ├── cotacaoService.js
│   │   ├── indicadorService.js
│   │   └── noticiaService.js
│   ├── openai/
│   │   └── connection-openai.js
│   ├── logs/
│   │   └── app.log
│   └── controller.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── startScheduler.js
└── .env
```

## 4. Componentes do Backend

### 4.1 Modelos de Dados (Models)

**Indicador.js:** Armazena indicadores econômicos, como SELIC, CDI, IPCA.
**Noticias.js:** Armazena notícias financeiras, com fonte, título, descrição e data.
**Consulta.js:** Armazena consultas feitas à OpenAI, com prompt e resposta.

### 4.2 Controladores (Controllers)

- **openai-controller.js:** Gera respostas analíticas baseadas em prompts enviados ao OpenAI.
- **cotacoes-controller.js:** Gerencia as rotas de cotações financeiras, integrando com a AwesomeAPI.
- **indicadores-controller.js:** Responsável por requisitar indicadores econômicos da BrasilAPI.
- **noticias-controller.js:** Requisita e processa notícias financeiras da NewsAPI.

### 4.3 Serviços (Services)

- **openaiService.js:** Conecta-se à OpenAI e retorna respostas baseadas no prompt.
- **cotacaoService.js:** Processa e armazena cotações de moedas.
- **indicadorService.js:** Processa indicadores econômicos e normaliza os dados.
- **noticiaService.js:** Armazena e organiza notícias financeiras para posterior consulta.

### 4.4 Rotinas (Scheduler)

- **scheduler.js:** Executa tarefas agendadas para coleta de dados de APIs externas a cada hora.
- **dataCollector.js:** Unifica a coleta de cotações, indicadores e notícias e armazena os dados no MongoDB.

### 4.5 Integração com APIs Externas

- **AwesomeAPI:** Cotações de moedas estrangeiras (USD, EUR, GBP, etc.).
- **BrasilAPI:** Indicadores econômicos (SELIC, CDI, IPCA).
- **NewsAPI:** Notícias financeiras e econômicas, filtradas por categoria e data.
- **OpenAI:** Respostas baseadas em inteligência artificial para análise e previsões.

### 5. Frontend

#### 5.1 Interface do Usuário

- Página inicial com dashboard financeiro.
- Sistema de abas para navegar entre cotações, indicadores e notícias.
- Campo de consultas ao OpenAI, permitindo perguntas analíticas.

#### 5.2 Comunicação com Backend

- Requisições HTTP via `fetch` para endpoints da API.
- Exibição dinâmica dos dados através de gráficos e tabelas.

### 6. Fluxo de Dados

1. Coleta periódica de dados através do Scheduler.
2. Processamento e normalização dos dados pelos Services.
3. Armazenamento no MongoDB através dos Models.
4. Disponibilização dos dados através dos Controllers.
5. Apresentação no Frontend, incluindo consultas ao OpenAI.

### 7. Variáveis de Ambiente

- `OPENAI_API_KEY`: Chave para integração com OpenAI.
- `NEWS_API_KEY`: Chave para integração com NewsAPI.
- `MONGODB_URI`: URL de conexão com o MongoDB.

### 8. Considerações Finais

O **Economia Hoje** oferece uma estrutura modular e escalável, permitindo fácil manutenção e expansão. A combinação de coleta periódica de dados financeiros, integração com OpenAI e interface analítica fornece uma experiência completa para os usuários. As próximas etapas incluem otimização de performance, implementação de cache e adição de testes automatizados.
