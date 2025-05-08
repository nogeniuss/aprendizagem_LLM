
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Inicializar o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Envia uma consulta para a API da OpenAI e retorna a resposta
 * @param {string} prompt - O texto da consulta
 * @param {string} model - O modelo a ser usado (padrão: gpt-3.5-turbo)
 * @param {number} maxTokens - Número máximo de tokens na resposta (padrão: 500)
 * @returns {Promise<Object>} - Objeto contendo a resposta da OpenAI
 */
async function consultarOpenAI(prompt, model = 'gpt-3.5-turbo', maxTokens = 500) {
  try {
    console.log(`Enviando consulta para OpenAI: "${prompt.substring(0, 50)}..."`);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'Você é um assistente financeiro especializado em economia, investimentos e mercado financeiro brasileiro.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    
    return {
      success: true,
      response: response.choices[0].message.content,
      usage: response.usage,
      model: model
    };
  } catch (error) {
    console.error('Erro ao consultar OpenAI:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar OpenAI',
      details: error.response?.data || {}
    };
  }
}

/**
 * Gera uma análise de dados financeiros usando a OpenAI
 * @param {Object} dados - Dados financeiros para análise
 * @returns {Promise<Object>} - Objeto contendo a análise gerada
 */
async function gerarAnaliseFinanceira(dados) {
  try {
    const prompt = `
      Analise os seguintes dados financeiros e forneça insights relevantes:
      
      Cotações:
      ${JSON.stringify(dados.cotacoes)}
      
      Indicadores Econômicos:
      ${JSON.stringify(dados.indicadores)}
      
      Notícias Recentes:
      ${JSON.stringify(dados.noticias)}
      
      Por favor, forneça:
      1. Um resumo da situação econômica atual
      2. Tendências observadas nas cotações
      3. Impacto dos indicadores econômicos
      4. Análise das notícias mais relevantes
      5. Recomendações gerais para investidores
    `;
    
    return await consultarOpenAI(prompt, 'gpt-4', 1000);
  } catch (error) {
    console.error('Erro ao gerar análise financeira:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar análise financeira'
    };
  }
}

module.exports = {
  consultarOpenAI,
  gerarAnaliseFinanceira
};
