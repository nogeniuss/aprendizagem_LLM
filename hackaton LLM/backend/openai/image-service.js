const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Inicializar o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function gerarImagem(prompt, size = '1024x1024') {
  try {
    // Melhorar o prompt para ser mais assertivo e específico
    const promptEnriquecido = enriquecerPrompt(prompt);
    
    console.log(`Gerando imagem com prompt enriquecido: "${promptEnriquecido.substring(0, 50)}..."`);
    
    const response = await openai.images.generate({
      prompt: promptEnriquecido,
      n: 1,
      size: size,
    });
    
    console.log({
      success: true,
      imageUrl: response.data[0].url,
      prompt: promptEnriquecido
    });
    
    return {
      success: true,
      imageUrl: response.data[0].url,
      prompt: promptEnriquecido
    };
  } catch (error) {
    console.error('Erro ao gerar imagem com OpenAI:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar imagem',
      details: error.response?.data || {}
    };
  }
}

/**
 * Enriquece o prompt para torná-lo mais assertivo e específico
 * @param {string} promptOriginal - O prompt original fornecido pelo usuário
 * @returns {string} - O prompt enriquecido
 */
function enriquecerPrompt(promptOriginal) {
  // Verificar se o prompt contém palavras-chave relacionadas a gráficos
  if (promptOriginal.toLowerCase().includes('grafico') || 
      promptOriginal.toLowerCase().includes('gráfico')) {
    
    // Extrair valores e categorias do prompt original
    const categorias = extrairCategorias(promptOriginal);
    
    if (categorias.length > 0) {
      // Calcular o total para percentuais
      const total = categorias.reduce((sum, cat) => sum + cat.valor, 0);
      
      // Criar descrição detalhada para cada categoria com percentual
      const categoriasDetalhadas = categorias.map(cat => {
        const percentual = ((cat.valor / total) * 100).toFixed(1);
        return `${cat.nome}: ${cat.valor} (${percentual}%)`;
      }).join(', ');
      
      // Determinar o tipo de gráfico
      const tipoGrafico = promptOriginal.toLowerCase().includes('donut') ? 
        'gráfico de rosca (donut chart)' : 
        (promptOriginal.toLowerCase().includes('barra') ? 'gráfico de barras' : 'gráfico de pizza (pie chart)');
      
      return `Crie uma imagem fotorrealista de um ${tipoGrafico} profissional com as seguintes características:

1. DADOS EXATOS: ${categoriasDetalhadas}
2. VISUAL: Cada fatia/segmento deve ter uma cor distinta e vibrante
3. TEXTO: Os valores e percentuais (%) DEVEM ser claramente visíveis em cada segmento
4. LEGENDA: Inclua uma legenda clara à direita do gráfico com cores correspondentes
5. TÍTULO: "Distribuição de Valores" no topo do gráfico
6. ESTILO: Design limpo e minimalista, fundo branco, alta resolução
7. FORMATO: Imagem horizontal, proporção 16:9
8. IMPORTANTE: Os números devem ser grandes e perfeitamente legíveis

A imagem deve parecer uma captura de tela de um software profissional de visualização de dados como Excel, Tableau ou Power BI.`;
    }
  }
  
  // Para outros tipos de imagens, adicione instruções gerais para melhorar a qualidade
  return `Crie uma imagem detalhada, realista e de alta qualidade que represente exatamente o seguinte: ${promptOriginal}. 
A imagem deve ser clara, bem composta e com cores vibrantes. Certifique-se de incluir todos os elementos mencionados.`;
}

/**
 * Extrai categorias e valores de um prompt de gráfico
 * @param {string} prompt - O prompt original
 * @returns {Array} - Array de objetos com nome e valor das categorias
 */
function extrairCategorias(prompt) {
  const categorias = [];
  
  // Padrão para encontrar pares de categoria:valor
  const regex = /([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s*:\s*(\d+)/g;
  let match;
  
  while ((match = regex.exec(prompt)) !== null) {
    categorias.push({
      nome: match[1].trim(),
      valor: parseInt(match[2], 10)
    });
  }
  
  return categorias;
}

module.exports = {
  gerarImagem
};
