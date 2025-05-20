/**
 * Serviço de integração com a API da OpenAI
 * @module openai/connection-openai
 */
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente
dotenv.config();

/**
 * Configurações para o serviço OpenAI
 */
class OpenAIConfig {
  static get API_KEY() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não está definida nas variáveis de ambiente');
    }
    return apiKey;
  }
  
  static get DEFAULT_MODEL() {
    return 'gpt-3.5-turbo';
  }
  
  static get DEFAULT_MAX_TOKENS() {
    return 500;
  }
  
  static get SYSTEM_PROMPTS() {
    return {
      FINANCIAL_ASSISTANT: `Você é um assistente financeiro especializado em economia, investimentos e mercado financeiro brasileiro. Seu objetivo é fornecer respostas claras, precisas e contextualizadas com base nas informações mais recentes dos últimos 30 dias, incluindo notícias, índices financeiros e dados do banco de dados.

Ao responder a qualquer solicitação, siga rigorosamente os critérios abaixo:

Contextualização da Resposta:

Analise os dados financeiros fornecidos e insira contexto relevante, destacando eventos econômicos, variações nos índices e impactos observados no mercado.

Utilize apenas informações dos últimos 30 dias para garantir que as respostas sejam atuais e baseadas em dados recentes.

Foco Exclusivo em Finanças:

Responda exclusivamente a questões relacionadas a finanças, economia, investimentos, mercado financeiro, planejamento financeiro ou tópicos diretamente correlatos.

Caso a solicitação não seja financeiramente relevante ou não possua base de dados suficiente para análise, responda apenas com:
"Eu não sei, perdão!"

Coerência e Precisão:

Mantenha um tom profissional, objetivo e humano, garantindo clareza e precisão técnica.

Evite respostas vagas ou genéricas. Sempre que possível, insira exemplos, dados numéricos ou comparações para fortalecer a argumentação.

Linguagem Acessível e Engajante:

Traduza conceitos financeiros complexos em termos acessíveis, sem perder a profundidade técnica.

Priorize a clareza, a coerência e a fluidez da informação, mantendo um tom que inspire confiança e credibilidade.`
    };
  }
  
  static get FINANCIAL_ANALYSIS_TEMPLATE() {
    return `
      Você é um assistente financeiro especializado em economia, investimentos e mercado financeiro brasileiro. Utilize os dados dos últimos 30 dias para fornecer uma análise detalhada.  
      
      Dados Financeiros:
      - Cotações: {{COTACOES}}
      - Indicadores Econômicos: {{INDICADORES}}
      - Notícias Recentes: {{NOTICIAS}}
      
      Diretrizes da análise:
      1. Contextualize a situação econômica atual com base nos dados apresentados.
      2. Identifique tendências claras nas cotações e seus possíveis impactos.
      3. Explique o impacto dos indicadores econômicos no cenário financeiro.
      4. Realize uma análise crítica das notícias mais relevantes e suas implicações.
      5. Apresente recomendações estratégicas para investidores com base nas observações anteriores.
      
      Importante: Se os dados fornecidos não forem financeiramente relevantes ou estiverem incompletos, responda apenas com:
      "Batatinha frita 1, 2, 3".
    `;
  }
}

/**
 * Serviço principal para integração com a OpenAI
 */
class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: OpenAIConfig.API_KEY,
    });
  }
  
  async consultarOpenAI(prompt, model = OpenAIConfig.DEFAULT_MODEL, maxTokens = OpenAIConfig.DEFAULT_MAX_TOKENS, temperature = 0.9) {
    try {
      this._logConsulta(prompt, model, maxTokens);
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { 
            role: 'system', 
            content: OpenAIConfig.SYSTEM_PROMPTS.FINANCIAL_ASSISTANT 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        max_tokens: maxTokens,
        temperature,
      });
      
      return this._formatarSucessoResposta(response, model);
    } catch (error) {
      return this._formatarErroResposta(error);
    }
  }
  
  async gerarAnaliseFinanceira(dados) {
    try {
      // Validação dos dados
      this._validarDadosAnalise(dados);
      
      // Construção do prompt dinâmico
      const prompt = this._construirPromptAnalise(dados);
      
      // Consulta à API com parâmetros específicos para análise
      const response = await this.consultarOpenAI(prompt, 'gpt-4', 1200);
      
      return response.success ? response : this._formatarErroAnalise('Falha na consulta à API');
    } catch (error) {
      return this._formatarErroAnalise(error.message || 'Erro ao gerar análise financeira');
    }
  }
  
  _validarDadosAnalise(dados) {
    if (!dados || !dados.cotacoes || !dados.indicadores) {
      throw new Error('Dados insuficientes para análise financeira');
    }
    
    if (!Array.isArray(dados.cotacoes) || !Array.isArray(dados.indicadores)) {
      throw new Error('Formato inválido para dados de análise financeira');
    }
  }
  
  _construirPromptAnalise(dados) {
    return OpenAIConfig.FINANCIAL_ANALYSIS_TEMPLATE
      .replace('{{COTACOES}}', JSON.stringify(dados.cotacoes))
      .replace('{{INDICADORES}}', JSON.stringify(dados.indicadores))
      .replace('{{NOTICIAS}}', JSON.stringify(dados.noticias || []));
  }
  
  _logConsulta(prompt, model, maxTokens) {
    const promptPreview = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
    console.log(`Enviando consulta para OpenAI (${model}, ${maxTokens} tokens): "${promptPreview}"`);
  }
  
  _formatarSucessoResposta(response, model) {
    return {
      success: true,
      response: response.choices[0].message.content,
      usage: response.usage,
      model
    };
  }
  
  _formatarErroResposta(error) {
    console.error('Erro ao consultar OpenAI:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar OpenAI',
      details: error.response?.data || {}
    };
  }

  _formatarErroAnalise(mensagem) {
    console.error('Erro na análise financeira:', mensagem);
    return {
      success: false,
      error: mensagem,
    };
  }
}

// Instância única do serviço
const openAIService = new OpenAIService();

// Exportação das funções mantendo compatibilidade com o código anterior
module.exports = {
  consultarOpenAI: (prompt, model, maxTokens) => 
    openAIService.consultarOpenAI(prompt, model, maxTokens),
  
  gerarAnaliseFinanceira: (dados) => 
    openAIService.gerarAnaliseFinanceira(dados)
};