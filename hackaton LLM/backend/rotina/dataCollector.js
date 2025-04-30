const { connectToDatabase } = require('../connection/database');
const { awesomeapi } = require('./requisicao_awesomeapi/requisicao_awesomeapi');
const { requisitar_brasilApi } = require('./requisicao_brasilAPI/requisicaoService');
const { fetchNewsData } = require('./requisicao_newsapi/requisicaoService');
const { 
  saveCotacoes, 
  saveIndicadores, 
  saveBancos, 
  saveNoticias 
} = require('../services/dataService');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Mock para req e res para compatibilidade com funções existentes
const mockReq = {};
const mockRes = {
  json: (data) => data,
  status: (code) => ({
    json: (data) => ({ status: code, ...data })
  })
};

// Função para coletar cotações
async function coletarCotacoes() {
  console.log('Coletando cotações...');
  try {
    const cotacoesData = await awesomeapi(mockReq, mockRes);
    const results = await saveCotacoes(cotacoesData);
    console.log(`Cotações: ${results.added} adicionadas, ${results.skipped} ignoradas, ${results.errors} erros`);
    return results;
  } catch (error) {
    console.error('Erro ao coletar cotações:', error);
    return { added: 0, skipped: 0, errors: 1 };
  }
}

// Função para coletar indicadores e bancos
async function coletarDadosBrasil() {
  console.log('Coletando indicadores e bancos...');
  try {
    const brasilData = await requisitar_brasilApi();
    
    // Salvar indicadores (SELIC, CDI, IPCA)
    const indicadoresResults = await saveIndicadores({
      SELIC: brasilData.SELIC,
      CDI: brasilData.CDI,
      IPCA: brasilData.IPCA
    });
    
    // Salvar bancos
    const bancosResults = await saveBancos(brasilData['Lista de Bancos']);
    
    console.log(`Indicadores: ${indicadoresResults.added} adicionados, ${indicadoresResults.skipped} ignorados, ${indicadoresResults.errors} erros`);
    console.log(`Bancos: ${bancosResults.added} adicionados, ${bancosResults.skipped} ignorados, ${bancosResults.errors} erros`);
    
    return { indicadoresResults, bancosResults };
  } catch (error) {
    console.error('Erro ao coletar dados do Brasil:', error);
    return { indicadoresResults: { added: 0, skipped: 0, errors: 1 }, bancosResults: { added: 0, skipped: 0, errors: 1 } };
  }
}

// Função para coletar notícias
async function coletarNoticias() {
  console.log('Coletando notícias...');
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      console.error('API key para NewsAPI não encontrada!');
      return { added: 0, skipped: 0, errors: 1 };
    }
    
    const noticiasData = await fetchNewsData(apiKey);
    
    if (!noticiasData.success) {
      console.error('Erro ao buscar notícias:', noticiasData.error);
      return { added: 0, skipped: 0, errors: 1 };
    }
    
    const results = await saveNoticias(noticiasData.data);
    console.log(`Notícias: ${results.added} adicionadas, ${results.skipped} ignoradas, ${results.errors} erros`);
    return results;
  } catch (error) {
    console.error('Erro ao coletar notícias:', error);
    return { added: 0, skipped: 0, errors: 1 };
  }
}

// Função principal para executar toda a coleta
async function executarColeta() {
  console.log('Iniciando coleta de dados - ' + new Date().toISOString());
  
  // Conectar ao banco de dados
  const dbConnected = await connectToDatabase();
  
  if (!dbConnected) {
    console.error('Não foi possível conectar ao banco de dados. Abortando coleta.');
    return false;
  }
  
  try {
    // Executar coletas em paralelo
    const [cotacoesResults, brasilResults, noticiasResults] = await Promise.all([
      coletarCotacoes(),
      coletarDadosBrasil(),
      coletarNoticias()
    ]);
        // Resumo da coleta
        console.log('\n=== RESUMO DA COLETA ===');
        console.log(`Cotações: ${cotacoesResults.added} novas`);
        console.log(`Indicadores: ${brasilResults.indicadoresResults.added} novos`);
        console.log(`Bancos: ${brasilResults.bancosResults.added} novos`);
        console.log(`Notícias: ${noticiasResults.added} novas`);
        console.log('========================\n');
        
        return {
          success: true,
          timestamp: new Date().toISOString(),
          results: {
            cotacoes: cotacoesResults,
            indicadores: brasilResults.indicadoresResults,
            bancos: brasilResults.bancosResults,
            noticias: noticiasResults
          }
        };
      } catch (error) {
        console.error('Erro durante a execução da coleta:', error);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    }
    
    // Exportar a função para uso externo
    module.exports = { executarColeta };
    
    // Se o arquivo for executado diretamente (não importado como módulo)
    if (require.main === module) {
      executarColeta()
        .then(result => {
          console.log('Coleta finalizada:', result.success ? 'Sucesso' : 'Falha');
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error('Erro fatal durante a coleta:', error);
          process.exit(1);
        });
    }
    
 
