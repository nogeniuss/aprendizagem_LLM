require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const openaiController = require('./backend/controller/openai-controller');
const imageController = require('./backend/openai/image-controller');
require('./startScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Configuração permissiva
app.use(express.json());
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});


// Conectar ao MongoDB com async/await
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB');

    // Após conexão, verificar coleções e documentos
    await checkCollections();
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1); // Encerra se não conectar
  }
}

// Função para checar coleções e logs
async function checkCollections() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Coleções disponíveis:', collections.map(c => c.name));

    if (collections.some(c => c.name === 'cotacoes')) {
      const count = await mongoose.connection.db.collection('cotacoes').countDocuments();
      console.log('Número de documentos em cotacoes:', count);
    }
    if (collections.some(c => c.name === 'noticias')) {
      const count = await mongoose.connection.db.collection('noticias').countDocuments();
      console.log('Número de documentos em noticias:', count);
    }
  } catch (error) {
    console.error('Erro ao verificar coleções:', error);
  }
}

// Rotas API
app.post('/api/consulta', openaiController.realizarConsulta);
app.get('/api/analise-financeira', openaiController.gerarAnaliseFinanceira);
app.get('/api/ativo/:ativo', openaiController.consultarAtivo);
app.post('/api/gerar-imagem', imageController.gerarImagem);

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'frontend')));

// Rotas para frontend SPA (fallback)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor após conectar DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

app.get('/api/test', (req, res) => {
  // Se a requisição chegou aqui, o servidor está rodando
  res.json({ serverRunning: true });
});