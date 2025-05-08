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

/**
 * Coleta dados da BrasilAPI (bancos e indicadores)
 * @returns {Object} Resultados da coleta de bancos e indicadores
 */
async function coletarDadosBrasil() {
  try {
    console.log('Iniciando coleta de dados da BrasilAPI...');
    
    // Obter dados dos bancos
    console.log('Coletando dados de bancos...');
    let bancos = [];
    try {
      bancos = await requisitar_brasilApi('/banks/v1');
      console.log(`Recebidos ${bancos.length} bancos da API`);
      
      // Log para debug - mostrar estrutura dos primeiros dados
      if (bancos.length > 0) {
        console.log('Exemplo de banco recebido:', JSON.stringify(bancos[0]));
      }
      
      // Mapear os dados para garantir a estrutura correta
      bancos = bancos.map(banco => ({
        ispb: banco.ispb || banco.code || 'N/A',
        name: banco.name || banco.nome || 'N/A',
        fullName: banco.fullName || banco.nome_completo || banco.name || 'N/A',
        code: banco.code || banco.codigo || '',
        compe: banco.compe || '',
        // Outros campos que possam existir
        ...banco
      }));
    } catch (error) {
      console.error('Erro ao coletar dados de bancos:', error);
    }
    
    // Salvar bancos
    const bancosResults = await saveBancos(bancos);
    console.log(`Bancos: ${bancosResults.adicionados} adicionados, ${bancosResults.ignorados} ignorados, ${bancosResults.erros} erros`);
    
    // Obter indicadores econômicos
    console.log('Coletando indicadores econômicos...');
    let indicadores = [];
    try {
      // Coletar diferentes indicadores
      const indicadoresCDI = await requisitar_brasilApi('/cdi/v1');
      const indicadoresSELIC = await requisitar_brasilApi('/taxa-selic/v1');
      const indicadoresIPCA = await requisitar_brasilApi('/ipca/v1');
      
      // Combinar todos os indicadores
      indicadores = [
        ...(Array.isArray(indicadoresCDI) ? indicadoresCDI.map(i => ({...i, tipo: 'CDI'})) : []),
        ...(Array.isArray(indicadoresSELIC) ? indicadoresSELIC.map(i => ({...i, tipo: 'SELIC'})) : []),
        ...(Array.isArray(indicadoresIPCA) ? indicadoresIPCA.map(i => ({...i, tipo: 'IPCA'})) : [])
      ];
      
      console.log(`Recebidos ${indicadores.length} indicadores da API`);
    } catch (error) {
      console.error('Erro ao coletar indicadores econômicos:', error);
    }
    
    // Salvar indicadores
    const indicadoresResults = await saveIndicadores(indicadores);
    console.log(`Indicadores: ${indicadoresResults.adicionados} adicionados, ${indicadoresResults.ignorados} ignorados, ${indicadoresResults.erros} erros`);
    
    console.log('Coleta de dados da BrasilAPI concluída');
    
    // Retornar os resultados
    return {
      bancosResults,
      indicadoresResults
    };
  } catch (error) {
    console.error('Erro ao coletar dados da BrasilAPI:', error);
    // Retornar resultados vazios em caso de erro
    return {
      bancosResults: { adicionados: 0, ignorados: 0, erros: 1 },
      indicadoresResults: { adicionados: 0, ignorados: 0, erros: 1 }
    };
  }
}



/**
 * Coleta notícias da NewsAPI
 * @returns {Object} Resultados da coleta de notícias
 */
async function coletarNoticias() {
  try {
    console.log('Iniciando coleta de notícias...');
    
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.error('API key para NewsAPI não encontrada');
      return { adicionados: 0, ignorados: 0, erros: 1 };
    }
    
    // Obter notícias
    const resultado = await fetchNewsData(apiKey);
    
    if (!resultado.success) {
      console.error('Erro ao buscar notícias:', resultado.error);
      return { adicionados: 0, ignorados: 0, erros: 1 };
    }
    
    let noticias = resultado.articles || [];
    console.log(`Recebidas ${noticias.length} notícias da API`);
    
    // Log para debug - mostrar estrutura dos primeiros dados
    if (noticias.length > 0) {
      console.log('Exemplo de notícia recebida:', JSON.stringify(noticias[0]));
    }
    
    // Mapear os dados para garantir a estrutura correta
    noticias = noticias.map(noticia => ({
      title: noticia.title || 'Sem título',
      description: noticia.description || 'Sem descrição',
      content: noticia.content || noticia.description || '',
      url: noticia.url || '#',
      urlToImage: noticia.urlToImage || '',
      publishedAt: noticia.publishedAt || new Date(),
      source: {
        name: (noticia.source && noticia.source.name) || 'Fonte desconhecida',
        id: (noticia.source && noticia.source.id) || null
      },
      author: noticia.author || 'Desconhecido',
      // Outros campos que possam existir
      ...noticia
    }));
    
    // Salvar notícias
    const resultadoNoticias = await saveNoticias(noticias);
    console.log(`Notícias: ${resultadoNoticias.adicionados} adicionadas, ${resultadoNoticias.ignorados} ignoradas, ${resultadoNoticias.erros} erros`);
    
    console.log('Coleta de notícias concluída');
    
    return resultadoNoticias;
  } catch (error) {
    console.error('Erro ao coletar notícias:', error);
    return { adicionados: 0, ignorados: 0, erros: 1 };
  }
}



/**
 * Executa a coleta completa de dados
 * @returns {Object} Resultados da coleta
 */
async function executarColeta() {
  try {
    console.log('=== INICIANDO COLETA DE DADOS ===');
    
    // Coletar cotações
    let cotacoesResults = { adicionadas: 0, ignoradas: 0, erros: 0 };
    try {
      cotacoesResults = await coletarCotacoes();
    } catch (error) {
      console.error('Erro ao coletar cotações:', error);
    }
    
    // Coletar dados do Brasil (bancos e indicadores)
    let bancosResults = { adicionados: 0, ignorados: 0, erros: 0 };
    let indicadoresResults = { adicionados: 0, ignorados: 0, erros: 0 };
    try {
      const brasilResults = await coletarDadosBrasil();
      // Verificar se os resultados existem antes de atribuir
      bancosResults = brasilResults?.bancosResults || bancosResults;
      indicadoresResults = brasilResults?.indicadoresResults || indicadoresResults;
    } catch (error) {
      console.error('Erro ao coletar dados do Brasil:', error);
    }
    
    // Coletar notícias
    let noticiasResults = { adicionados: 0, ignorados: 0, erros: 0 };
    try {
      noticiasResults = await coletarNoticias();
    } catch (error) {
      console.error('Erro ao coletar notícias:', error);
    }
    
    // Resumo da coleta
    console.log('=== RESUMO DA COLETA ===');
    console.log(`Cotações: ${cotacoesResults.adicionadas} novas`);
    console.log(`Bancos: ${bancosResults.adicionados} adicionados, ${bancosResults.ignorados} ignorados, ${bancosResults.erros} erros`);
    console.log(`Indicadores: ${indicadoresResults.adicionados} adicionados, ${indicadoresResults.ignorados} ignorados, ${indicadoresResults.erros} erros`);
    console.log(`Notícias: ${noticiasResults.adicionados} adicionadas, ${noticiasResults.ignorados} ignoradas, ${noticiasResults.erros} erros`);
    
    return {
      cotacoesResults,
      bancosResults,
      indicadoresResults,
      noticiasResults
    };
  } catch (error) {
    console.error('Erro durante a execução da coleta:', error);
    throw error;
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
    
 
