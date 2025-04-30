const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./backend/connection/database');
const apiController = require('./backend/rotina/controller');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar o app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Conectar ao banco de dados
connectToDatabase()
  .then(connected => {
    if (connected) {
      console.log('Banco de dados conectado com sucesso!');
    } else {
      console.error('Falha ao conectar ao banco de dados!');
    }
  });

// Rotas da API
app.get('/api/cotacoes', apiController.getCotacoes);
app.get('/api/indicadores-brasil', apiController.getIndicadoresBrasil);
app.get('/api/noticias', apiController.getNoticias);

// Rota para executar coleta manual
app.post('/api/coleta', async (req, res) => {
  try {
    // Verificar autenticação (você pode implementar um sistema de autenticação mais robusto)
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Importar dinamicamente para não carregar sempre
    const { executarColeta } = require('./backend/rotina/dataCollector');
    
    // Executar coleta
    const resultado = await executarColeta();
    
    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao executar coleta manual:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Rota para estatísticas do banco de dados
app.get('/api/estatisticas', async (req, res) => {
  try {
    const Cotacao = require('./backend/models/Cotacao');
    const Indicador = require('./backend/models/Indicador');
    const Banco = require('./backend/models/Banco');
    const Noticia = require('./backend/models/Noticia');
    
    const [cotacoes, indicadores, bancos, noticias] = await Promise.all([
      Cotacao.countDocuments(),
      Indicador.countDocuments(),
      Banco.countDocuments(),
      Noticia.countDocuments()
    ]);
    
    return res.json({
      cotacoes,
      indicadores,
      bancos,
      noticias,
      total: cotacoes + indicadores + bancos + noticias,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Verificar se deve iniciar o agendador
  if (process.env.START_SCHEDULER === 'true') {
    console.log('Verificando se o agendador já está rodando...');
    
    const logDir = path.join(__dirname, 'backend/logs');
    const lockFile = path.join(logDir, 'scheduler.lock');
    
    if (fs.existsSync(lockFile)) {
      try {
        const pid = fs.readFileSync(lockFile, 'utf8');
        console.log(`Já existe um agendador rodando com PID ${pid}. Não iniciando outro.`);
      } catch (error) {
        console.error('Erro ao verificar arquivo de lock:', error);
        console.log('Iniciando agendador...');
        require('./backend/rotina/scheduler');
      }
    } else {
      console.log('Iniciando agendador...');
      require('./backend/rotina/scheduler');
    }
  }
});
