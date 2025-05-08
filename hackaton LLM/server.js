const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('./backend/connection/database');
const apiController = require('./backend/rotina/controller');
const openaiController = require('./backend/controller/openai-controller');

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Conectar ao banco de dados
connectToDatabase();

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rota para verificar status do backend
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

// Rotas para OpenAI
app.post('/api/openai/consulta', openaiController.realizarConsulta);
app.get('/api/openai/historico', openaiController.getHistoricoConsultas);

// Rotas para dados do banco de dados
app.get('/api/db/noticias', async (req, res) => {
  try {
    const Noticia = require('./backend/models/noticias');
    // Buscar as notícias mais recentes
    const noticias = await Noticia.find()
      .sort({ data: -1 })
      .limit(10)
      .lean();
    
    return res.json(noticias);
  } catch (error) {
    console.error('Erro ao buscar notícias do banco:', error);
    return res.status(500).json({ error: 'Erro ao buscar notícias do banco de dados' });
  }
});


app.get('/api/db/indicadores', async (req, res) => {
  try {
    const Cotacao = require('./backend/models/cotacao');
    
    // Buscar apenas as cotações de moedas
    const cotacoes = await Cotacao.find().sort({ createdAt: -1 }).limit(10).lean();
    
    // Log para debug
    console.log('Cotações encontradas:', cotacoes.length);
    
    // Formatar os dados para o frontend
    const dadosFormatados = cotacoes.map(c => {
      // Extrair nome da moeda dos dados disponíveis
      let nome = c.name;
      
      // Extrair valor da moeda (bid é o valor de compra)
      let valor = c.bid || c.ask || 'N/A';
      
      // Extrair variação percentual
      let variacao = parseFloat(c.pctChange) || 0;
      
      // Extrair data
      let data = c.create_date ? 
        new Date(c.create_date).toLocaleDateString('pt-BR') : 
        new Date().toLocaleDateString('pt-BR');
      
      return {
        nome,
        valor,
        variacao,
        data,
        categoria: 'moeda'
      };
    });
    
    // Verificar se os dados formatados estão completos
    if (dadosFormatados.some(d => !d.nome)) {
      console.warn('Algumas moedas não têm nome:', 
        dadosFormatados.filter(d => !d.nome).length);
    }
    
    return res.json(dadosFormatados);
  } catch (error) {
    console.error('Erro ao buscar cotações do banco:', error);
    return res.status(500).json({ error: 'Erro ao buscar cotações do banco de dados' });
  }
});



app.get('/api/db/analise', async (req, res) => {
  try {
    const Analise = require('./backend/models/analise');
    // Buscar a análise mais recente
    const analise = await Analise.findOne()
      .sort({ data: -1 })
      .lean();
    
    if (!analise) {
      return res.status(404).json({ error: 'Nenhuma análise encontrada' });
    }
    
    return res.json(analise);
  } catch (error) {
    console.error('Erro ao buscar análise do banco:', error);
    return res.status(500).json({ error: 'Erro ao buscar análise do banco de dados' });
  }
});

app.post('/api/db/gerar-analise', async (req, res) => {
  try {
    
    // Gerar nova análise usando OpenAI
    await openaiController.gerarAnalise(req, res);
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    return res.status(500).json({ error: 'Erro ao gerar análise financeira' });
  }
});

// Manter a rota de coleta manual para administração
app.post('/api/coleta', async (req, res) => {
  try {
    // Verificar autenticação
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

// Rota para estatísticas do banco de dados (mantida para fins administrativos)
app.get('/api/estatisticas', async (req, res) => {
  try {
    const Cotacao = require('./backend/models/cotacao');
    const Indicador = require('./backend/models/indicador');
    const Banco = require('./backend/models/banco');
    const Noticia = require('./backend/models/noticias');
    
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Criar diretório de logs se não existir
  const logDir = path.join(__dirname, 'backend/logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`Diretório de logs criado: ${logDir}`);
  }
});
