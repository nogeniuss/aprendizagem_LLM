/**
 * Controller para integração com OpenAI e processamento de consultas
 */
const { consultarOpenAI, gerarAnaliseFinanceira } = require('../openai/connection-openai');
const Cotacao = require('../models/cotacao');
const Indicador = require('../models/indicador');
const Noticia = require('../models/noticias');
const Consulta = require('../models/consulta');

/**
 * Serviço para construção de contexto com base em dados do sistema
 */
class ContextoService {
  static async construir(prompt) {
    const promptLower = prompt.toLowerCase();
    let contexto = '';
    let dadosAdicionados = false;
    const tiposDados = [];
    
    try {
      // Verifica e adiciona cotações relevantes
      if (this._deveBuscarCotacoes(promptLower)) {
        const resultado = await this._adicionarCotacoes();
        if (resultado.adicionado) {
          contexto += resultado.texto;
          dadosAdicionados = true;
          tiposDados.push('cotacoes');
        }
      }
      
      // Verifica e adiciona indicadores econômicos
      if (this._deveBuscarIndicadores(promptLower)) {
        const resultado = await this._adicionarIndicadores();
        if (resultado.adicionado) {
          contexto += resultado.texto;
          dadosAdicionados = true;
          tiposDados.push('indicadores');
        }
      }
      
      // Verifica e adiciona notícias relevantes
      if (this._deveBuscarNoticias(promptLower)) {
        const resultado = await this._adicionarNoticias();
        if (resultado.adicionado) {
          contexto += resultado.texto;
          dadosAdicionados = true;
          tiposDados.push('noticias');
        }
      }
      
      return {
        contextoFormatado: contexto,
        dadosAdicionados,
        tiposDados
      };
    } catch (error) {
      console.error('Erro ao construir contexto:', error);
      return {
        contextoFormatado: '',
        dadosAdicionados: false,
        tiposDados: []
      };
    }
  }

  static _deveBuscarCotacoes(promptLower) {
    const termosRelevantes = [
      'bitcoin', 'btc', 'dólar', 'euro', 'cotação', 
      'valor', 'preço', 'ação', 'ações', 'moeda'
    ];
    return termosRelevantes.some(termo => promptLower.includes(termo));
  }

  static _deveBuscarIndicadores(promptLower) {
    const termosRelevantes = [
      'selic', 'ipca', 'inflação', 'pib', 'taxa', 
      'juros', 'indicador', 'economia', 'econômico'
    ];
    return termosRelevantes.some(termo => promptLower.includes(termo));
  }

  static _deveBuscarNoticias(promptLower) {
    const termosRelevantes = [
      'notícia', 'acontecimento', 'mercado', 'economia', 
      'recente', 'atual', 'novidade', 'última', 'últimas'
    ];
    return termosRelevantes.some(termo => promptLower.includes(termo));
  }

  static async _adicionarCotacoes() {
    const cotacoes = await Cotacao.find().sort({ createdAt: -1 }).limit(10);
    
    if (!cotacoes || cotacoes.length === 0) {
      return { adicionado: false, texto: '' };
    }
    
    let texto = '\n--- DADOS ATUAIS DE COTAÇÕES ---\n';
    cotacoes.forEach(cotacao => {
      texto += `${cotacao.nome || cotacao.simbolo}: ${cotacao.valor} ${cotacao.moeda || 'BRL'} `;
      texto += `(Atualizado em: ${new Date(cotacao.data || cotacao.createdAt).toLocaleString('pt-BR')})\n`;
    });
    
    return { adicionado: true, texto };
  }

  static async _adicionarIndicadores() {
    const indicadores = await Indicador.find().sort({ createdAt: -1 }).limit(10);
    
    if (!indicadores || indicadores.length === 0) {
      return { adicionado: false, texto: '' };
    }
    
    let texto = '\n--- INDICADORES ECONÔMICOS ATUAIS ---\n';
    indicadores.forEach(indicador => {
      texto += `${indicador.tipo}: ${indicador.valor}% `;
      texto += `(Atualizado em: ${new Date(indicador.data || indicador.createdAt).toLocaleString('pt-BR')})\n`;
    });
    
    return { adicionado: true, texto };
  }

  static async _adicionarNoticias() {
    const noticias = await Noticia.find().sort({ createdAt: -1 }).limit(5);
    
    if (!noticias || noticias.length === 0) {
      return { adicionado: false, texto: '' };
    }
    
    let texto = '\n--- NOTÍCIAS RECENTES DO MERCADO FINANCEIRO ---\n';
    noticias.forEach(noticia => {
      texto += `Título: ${noticia.titulo || 'Sem título'}\n`;
      texto += `Data: ${new Date(noticia.data || noticia.createdAt).toLocaleString('pt-BR')}\n`;
      texto += `Resumo: ${noticia.conteudo ? noticia.conteudo.substring(0, 150) + '...' : 'Conteúdo não disponível'}\n\n`;
    });
    
    return { adicionado: true, texto };
  }
}

/**
 * Serviço para registro de consultas no banco de dados
 */
class ConsultaLogger {
  static async registrar(dados) {
    try {
      if (!Consulta) return;
      
      await Consulta.create({
        prompt: dados.prompt,
        promptEnriquecido: dados.promptEnriquecido,
        resposta: dados.resultado.response,
        modelo: dados.resultado.model,
        contextoUtilizado: dados.contextoUtilizado,
        tokens: {
          prompt: dados.resultado.usage?.prompt_tokens || 0,
          completion: dados.resultado.usage?.completion_tokens || 0,
          total: dados.resultado.usage?.total_tokens || 0
        },
        usuario: dados.usuario,
        metadata: {
          timestamp: new Date(),
          ip: dados.req.ip,
          userAgent: dados.req.headers['user-agent']
        }
      });
    } catch (error) {
      console.error('Erro ao registrar consulta:', error);
      // Continua a execução mesmo se falhar o registro
    }
  }
}

/**
 * Controller principal para endpoints da API relacionados à OpenAI
 */
const openaiController = {
  /**
   * Realiza uma consulta à OpenAI com contexto enriquecido
   */
  realizarConsulta: async (req, res) => {
    try {
      const { prompt, model = 'gpt-3.5-turbo', maxTokens = 500 } = req.body;
      
      // Validação do prompt
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: "Prompt não fornecido ou inválido." 
        });
      }
      
      console.log(`Processando consulta: "${prompt.substring(0, 50)}..."`);
      
      // Enriquecimento de contexto baseado no conteúdo da pergunta
      const contexto = await ContextoService.construir(prompt);
      
      // Construção do prompt enriquecido
      const promptEnriquecido = contexto.dadosAdicionados 
        ? `${contexto.contextoFormatado}\n\nConsiderando os dados acima, responda à seguinte pergunta: ${prompt}`
        : prompt;
      
      // Consulta à OpenAI
      const resultado = await consultarOpenAI(promptEnriquecido, model, maxTokens);
      
      // Registro da consulta no banco de dados
      await ConsultaLogger.registrar({
        prompt,
        promptEnriquecido,
        resultado,
        contextoUtilizado: contexto.tiposDados,
        usuario: req.body.usuario || 'anônimo',
        req
      });
      
      // Resposta ao cliente
      if (resultado.success) {
        return res.json({
          success: true,
          response: resultado.response,
          model: resultado.model,
          contextData: contexto.tiposDados,
          usage: resultado.usage
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: resultado.error || "Erro ao processar consulta." 
        });
      }
    } catch (error) {
      console.error('Erro no controller de OpenAI:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Erro interno ao processar consulta." 
      });
    }
  },
  
  /**
   * Gera uma análise financeira com base em dados recentes
   */
  gerarAnaliseFinanceira: async (req, res) => {
    try {
      // Coleta de todos os dados relevantes para análise
      const [cotacoes, indicadores, noticias] = await Promise.all([
        Cotacao.find().sort({ createdAt: -1 }).limit(10),
        Indicador.find().sort({ createdAt: -1 }).limit(10),
        Noticia.find().sort({ createdAt: -1 }).limit(5)
      ]);
      
      // Verificação de dados suficientes
      if (!cotacoes.length || !indicadores.length) {
        return res.status(404).json({
          success: false,
          error: "Dados insuficientes para gerar análise financeira."
        });
      }
      
      // Preparação dos dados para análise
      const dadosAnalise = { cotacoes, indicadores, noticias };
      
      // Geração da análise financeira
      const resultado = await gerarAnaliseFinanceira(dadosAnalise);
      
      // Resposta ao cliente
      if (resultado.success) {
        return res.json({
          success: true,
          analise: resultado.response,
          model: resultado.model,
          dataSnapshot: {
            cotacoes: cotacoes.length,
            indicadores: indicadores.length,
            noticias: noticias.length
          }
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: resultado.error || "Erro ao gerar análise financeira." 
        });
      }
    } catch (error) {
      console.error('Erro ao gerar análise financeira:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Erro interno ao gerar análise financeira." 
      });
    }
  },
  
  /**
   * Consulta informações específicas sobre um ativo financeiro
   */
  consultarAtivo: async (req, res) => {
    try {
      const { ativo } = req.params;
      
      if (!ativo) {
        return res.status(400).json({ 
          success: false, 
          error: "Nome do ativo não fornecido." 
        });
      }
      
      // Busca de cotações do ativo específico
      const cotacoes = await Cotacao.find({
        $or: [
          { simbolo: { $regex: new RegExp(ativo, 'i') } },
          { nome: { $regex: new RegExp(ativo, 'i') } }
        ]
      }).sort({ createdAt: -1 }).limit(5);
      
      // Busca de notícias relacionadas ao ativo
      const noticias = await Noticia.find({
        $or: [
          { titulo: { $regex: new RegExp(ativo, 'i') } },
          { conteudo: { $regex: new RegExp(ativo, 'i') } }
        ]
      }).sort({ createdAt: -1 }).limit(3);
      
      // Verificação de dados encontrados
      if (!cotacoes.length) {
        return res.status(404).json({
          success: false,
          error: `Não foram encontrados dados para o ativo "${ativo}".`
        });
      }
      
      // Construção do prompt específico para o ativo
      const prompt = `
        Forneça uma análise detalhada sobre o ativo ${ativo} com base nos seguintes dados:
        
        Cotações recentes:
        ${JSON.stringify(cotacoes, null, 2)}
        
        ${noticias.length ? `Notícias relacionadas:\n${JSON.stringify(noticias, null, 2)}` : ''}
        
        Inclua na sua análise:
        1. Valor atual e variação recente
        2. Tendência de curto prazo
        3. Fatores que podem estar influenciando o preço
        4. Perspectivas futuras com base nos dados disponíveis
      `;
      
      // Consulta à OpenAI
      const resultado = await consultarOpenAI(prompt, 'gpt-4', 800);
      
      // Resposta ao cliente
      if (resultado.success) {
        return res.json({
          success: true,
          ativo,
          analise: resultado.response,
          dadosUtilizados: {
            cotacoes: cotacoes.length,
            noticias: noticias.length
          }
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: resultado.error || `Erro ao analisar o ativo "${ativo}".` 
        });
      }
    } catch (error) {
      console.error('Erro ao consultar ativo:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Erro interno ao consultar ativo." 
      });
    }
  }
};

module.exports = openaiController;