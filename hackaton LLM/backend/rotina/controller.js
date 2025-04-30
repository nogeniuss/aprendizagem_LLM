const { awesomeapi } = require('./requisicao_awesomeapi/requisicao_awesomeapi');
const { requisitar_brasilApi } = require('./requisicao_brasilAPI/requisicaoService');
const { fetchNewsData } = require('./requisicao_newsapi/requisicaoService');

// Controller para gerenciar as requisições
const apiController = {
  // Obter cotações da AwesomeAPI
  getCotacoes: async (req, res) => {
    return await awesomeapi(req, res);
  },
  
  // Obter dados da BrasilAPI
  getIndicadoresBrasil: async (req, res) => {
    try {
      const resultados = await requisitar_brasilApi();
      return res.json(resultados);
    } catch (error) {
      console.error('Erro ao buscar indicadores do Brasil:', error);
      return res.status(500).json({ error: "Erro ao buscar indicadores do Brasil." });
    }
  },
  
  // Obter notícias da NewsAPI
  getNoticias: async (req, res) => {
    try {
      const apiKey = process.env.NEWS_API_KEY || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(400).json({ error: "API key não fornecida." });
      }
      
      const resultado = await fetchNewsData(apiKey);
      
      if (resultado.success) {
        return res.json(resultado);
      } else {
        return res.status(500).json({ error: resultado.error });
      }
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return res.status(500).json({ error: "Erro ao buscar notícias." });
    }
  }
};

module.exports = apiController;
