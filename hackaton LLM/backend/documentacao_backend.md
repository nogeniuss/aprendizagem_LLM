# Documentação do Backend - Projeto de Aprendizagem LLM

## Visão Geral

Este documento fornece uma descrição detalhada da estrutura e funcionalidades do backend do projeto de aprendizagem LLM. O backend é responsável por coletar, processar e armazenar dados de diversas APIs externas, incluindo cotações de moedas, indicadores econômicos, informações bancárias e notícias financeiras.

---

## Estrutura de Diretórios

```plaintext
backend/
├── connection/
│   └── database.js         # Configuração de conexão com MongoDB
├── models/
│   ├── Banco.js            # Modelo para dados bancários
│   ├── Cotacao.js          # Modelo para cotações de moedas
│   ├── Indicador.js        # Modelo para indicadores econômicos
│   └── Noticia.js          # Modelo para notícias
├── rotina/
│   ├── dataCollector.js    # Lógica de coleta de dados
│   ├── requisicao_awesomeapi/
│   │   └── requisicao_awesomeapi.js # Integração com AwesomeAPI (cotações)
│   ├── requisicao_brasilAPI/
│   │   └── requisicaoService.js     # Integração com BrasilAPI
│   ├── requisicao_newsapi/
│   │   └── requisicaoService.js     # Integração com NewsAPI
│   └── scheduler.js        # Agendador de tarefas
├── services/
│   └── dataService.js      # Serviços para manipulação de dados
└── controller.js           # Controladores para rotas da API
```

---

## Componentes Principais

### 1. Conexão com Banco de Dados (`connection/database.js`)

Responsável por estabelecer e gerenciar a conexão com o MongoDB Atlas.

```javascript
const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('Conectado ao MongoDB com sucesso');
    return mongoose.connection;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };
```

---

### 2. Modelos de Dados (`models/`)

#### Banco.js

Define o esquema para armazenar informações de instituições bancárias.

```javascript
const mongoose = require('mongoose');

const bancoSchema = new mongoose.Schema({
  ispb: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  code: { type: String },
  compe: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Banco', bancoSchema);
```

#### Cotacao.js

Define o esquema para armazenar cotações de moedas.

```javascript
const mongoose = require('mongoose');

const cotacaoSchema = new mongoose.Schema({
  code: { type: String, required: true },
  codein: { type: String, required: true },
  name: { type: String, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  bid: { type: Number, required: true },
  ask: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  create_date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Cotacao', cotacaoSchema);
```

#### Indicador.js

Define o esquema para armazenar indicadores econômicos.

```javascript
const mongoose = require('mongoose');

const indicadorSchema = new mongoose.Schema({
  tipo: { type: String, required: true },
  valor: { type: Number, required: true },
  data: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Indicador', indicadorSchema);
```

#### Noticia.js

Define o esquema para armazenar notícias.

```javascript
const mongoose = require('mongoose');

const noticiaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String },
  url: { type: String, required: true },
  urlToImage: { type: String },
  publishedAt: { type: Date, required: true },
  source: {
    name: { type: String, required: true },
    id: { type: String }
  },
  author: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Noticia', noticiaSchema);
```

---

### 3. Controladores (`controller.js`)

Gerencia as requisições HTTP e define os endpoints da API.

```javascript
const { awesomeapi } = require('./rotina/requisicao_awesomeapi/requisicao_awesomeapi');
const { requisitar_brasilApi } = require('./rotina/requisicao_brasilAPI/requisicaoService');
const { fetchNewsData } = require('./rotina/requisicao_newsapi/requisicaoService');

const apiController = {
  getCotacoes: async (req, res) => {
    return await awesomeapi(req, res);
  },
  getIndicadoresBrasil: async (req, res) => {
    const resultados = await requisitar_brasilApi();
    return res.json(resultados);
  },
  getNoticias: async (req, res) => {
    const apiKey = process.env.NEWS_API_KEY || req.query.apiKey;
    const resultado = await fetchNewsData(apiKey);
    return res.json(resultado);
  }
};

module.exports = apiController;
```

---

## Configuração e Variáveis de Ambiente

O sistema utiliza as seguintes variáveis de ambiente:

* `MONGODB_URI`: URI de conexão com o MongoDB Atlas
* `NEWS_API_KEY`: Chave de API para a NewsAPI
* `PORT`: Porta para o servidor (opcional, padrão: 3000)

---

## Inicialização

O backend pode ser iniciado de duas formas:

* Servidor completo: `node server.js`
* Apenas o agendador: `node startScheduler.js`

---

## Considerações de Segurança

* Credenciais e chaves de API são armazenadas em variáveis de ambiente.
* Acesso ao MongoDB Atlas é restrito por IP.
* Requisições externas são autenticadas e validadas.

---

## Manutenção e Troubleshooting

* Logs detalhados são gerados e armazenados em `backend/logs/`.
* O status do agendador pode ser verificado pelo arquivo `scheduler.lock`.

---

FIM.
