/**
 * Serviço de integração com a API da OpenAI
 * @module services/openai-service
 */
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente
dotenv.config();


class OpenAIService {
  /**
   * Cria uma nova instância do serviço OpenAI
   */
  constructor() {
    this.validateApiKey();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.defaultConfig = {
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7
    };
    this.templates = {
      systemPrompt: 'Você é um assistente financeiro especializado em economia, investimentos e mercado financeiro brasileiro.',
      financialAnalysis: `
        Analise os seguintes dados financeiros e forneça insights relevantes:
        
        Cotações:
        {{COTACOES}}
        
        Indicadores Econômicos:
        {{INDICADORES}}
        
        Notícias Recentes:
        {{NOTICIAS}}
        
        Por favor, forneça:
        1. Um resumo da situação econômica atual
        2. Tendências observadas nas cotações
        3. Impacto dos indicadores econômicos
        4. Análise das notícias mais relevantes
        5. Recomendações gerais para investidores
      `
    };
  }

  /**
   * Valida se a chave API está configurada
   * @private
   * @throws {Error} Se a chave API não estiver definida
   */
  validateApiKey() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não está definida nas variáveis de ambiente');
    }
  }
  async consultar(prompt, model = this.defaultConfig.model, maxTokens = this.defaultConfig.maxTokens, temperature = this.defaultConfig.temperature) {
    try {
      this.logConsulta(prompt);
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: this.templates.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
      });
      
      return this.formatarSucesso(response, model);
    } catch (error) {
      return this.formatarErro(error);
    }
  }

  async gerarAnaliseFinanceira(dados) {
    try {
      this.validarDados(dados);
      
      const prompt = this.templates.financialAnalysis
        .replace('{{COTACOES}}', JSON.stringify(dados.cotacoes))
        .replace('{{INDICADORES}}', JSON.stringify(dados.indicadores))
        .replace('{{NOTICIAS}}', JSON.stringify(dados.noticias || []));
      
      return await this.consultar(prompt, 'gpt-4', 1000);
    } catch (error) {
      this.logError('Erro ao gerar análise financeira', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerar análise financeira'
      };
    }
  }

  validarDados(dados) {
    if (!dados) {
      throw new Error('Dados não fornecidos para análise');
    }
    
    if (!dados.cotacoes || !Array.isArray(dados.cotacoes)) {
      throw new Error('Cotações não fornecidas ou em formato inválido');
    }
    
    if (!dados.indicadores || !Array.isArray(dados.indicadores)) {
      throw new Error('Indicadores não fornecidos ou em formato inválido');
    }
  }

  logConsulta(prompt) {
    const promptPreview = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
    console.log(`Enviando consulta para OpenAI: "${promptPreview}"`);
  }

  logError(mensagem, error) {
    console.error(`${mensagem}:`, error);
  }
  formatarSucesso(response, model) {
    return {
      success: true,
      response: response.choices[0].message.content,
      usage: response.usage,
      model
    };
  }

  formatarErro(error) {
    this.logError('Erro ao consultar OpenAI', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar OpenAI',
      details: error.response?.data || {}
    };
  }
}

// Criar instância única
const openAIService = new OpenAIService();

// Exportar funções mantendo compatibilidade com código anterior
module.exports = {
  consultarOpenAI: (prompt, model, maxTokens) => 
    openAIService.consultar(prompt, model, maxTokens),
    
  gerarAnaliseFinanceira: (dados) => 
    openAIService.gerarAnaliseFinanceira(dados)
};