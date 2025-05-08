const { consultarOpenAI, gerarAnaliseFinanceira } = require('../services/openai-service');
const Consulta = require('../models/consulta');

// Controller para gerenciar as requisições à OpenAI
const openaiController = {
  // Realizar uma consulta à OpenAI
  realizarConsulta: async (req, res) => {
    try {
      const { prompt, model, maxTokens } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt não fornecido." });
      }
      
      const resultado = await consultarOpenAI(prompt, model || 'gpt-3.5-turbo', maxTokens || 500);
      
      if (resultado.success) {
        // Salvar consulta no banco de dados se tiver o modelo Consulta
        try {
          if (Consulta) {
            await Consulta.create({
              prompt: prompt,
              resposta: resultado.response,
              modelo: resultado.model,
              tokens: {
                prompt: resultado.usage?.prompt_tokens || 0,
                completion: resultado.usage?.completion_tokens || 0,
                total: resultado.usage?.total_tokens || 0
              },
              usuario: req.body.usuario || 'anônimo',
              metadata: {
                timestamp: new Date(),
                ip: req.ip,
                userAgent: req.headers['user-agent']
              }
            });
          }
        } catch (dbError) {
          console.error('Erro ao salvar consulta no banco:', dbError);
          // Continua mesmo se falhar ao salvar no banco
        }
        
        return res.json(resultado);
      } else {
        return res.status(500).json({ error: resultado.error });
      }
    } catch (error) {
      console.error('Erro ao processar consulta:', error);
      return res.status(500).json({ error: "Erro ao processar consulta." });
    }
  },
  
  // Gerar análise financeira atual
  gerarAnalise: async (req, res) => {
    try {
      // Importar modelos
      const Cotacao = require('../models/cotacao');
      const Indicador = require('../models/indicador');
      const Noticia = require('../models/noticias');
      
      // Buscar dados mais recentes
      const cotacoes = await Cotacao.find().sort({ createdAt: -1 }).limit(10);
      const indicadores = await Indicador.find().sort({ createdAt: -1 }).limit(10);
      const noticias = await Noticia.find().sort({ publishedAt: -1 }).limit(5);
      
      // Gerar análise
      const analise = await gerarAnaliseFinanceira({
        cotacoes,
        indicadores,
        noticias
      });
      
      // Salvar consulta
      if (analise.success && Consulta) {
        try {
          await Consulta.create({
            prompt: 'Análise financeira automática',
            resposta: analise.response,
            modelo: analise.model,
            tokens: {
              prompt: analise.usage?.prompt_tokens || 0,
              completion: analise.usage?.completion_tokens || 0,
              total: analise.usage?.total_tokens || 0
            },
            usuario: 'sistema',
            metadata: {
              tipo: 'analise_automatica',
              timestamp: new Date()
            }
          });
        } catch (dbError) {
          console.error('Erro ao salvar análise no banco:', dbError);
          // Continua mesmo se falhar ao salvar no banco
        }
      }
      
      if (analise.success) {
        return res.json(analise);
      } else {
        return res.status(500).json({ error: analise.error });
      }
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      return res.status(500).json({ error: "Erro ao gerar análise." });
    }
  },
  
  // Obter histórico de consultas
  getHistoricoConsultas: async (req, res) => {
    try {
      const { limit = 10, usuario } = req.query;
      
      let query = {};
      if (usuario) {
        query.usuario = usuario;
      }
      
      const consultas = await Consulta.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-__v');
      
      return res.json(consultas);
    } catch (error) {
      console.error('Erro ao buscar histórico de consultas:', error);
      return res.status(500).json({ error: "Erro ao buscar histórico de consultas." });
    }
  }
};

module.exports = openaiController;
