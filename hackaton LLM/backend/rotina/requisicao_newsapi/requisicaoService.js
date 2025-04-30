
    const fetch = require('node-fetch');
    const fs = require('fs');
    const path = require('path');
    
    // Função para fazer requisições em loop para todas as URLs da News API
    async function fetchAllNewsData(apiKey) {
        // Array com todas as URLs para fazer requisições
        const urls = [
          `https://newsapi.org/v2/everything?q=economia&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=inflação&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=PIB&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Selic&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Copom&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=bolsa&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=ações&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=criptomoedas&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=bitcoin&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=ethereum&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=renda%20fixa&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=tesouro%20direto&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=dólar&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=câmbio&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=finance&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=economy&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=inflation&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=interest%20rate&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Federal%20Reserve&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=NASDAQ&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Dow%20Jones&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=S%26P500&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=stocks&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=bitcoin&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=ethereum&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=cryptocurrency&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Petrobras&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Vale&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Nubank&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Banco%20Central&language=pt&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Amazon&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Apple&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=JP%20Morgan&language=en&apiKey=${apiKey}`,
          `https://newsapi.org/v2/everything?q=Goldman%20Sachs&language=en&apiKey=${apiKey}`
        
        ];
      
        // Objeto para armazenar os resultados
        const results = {};
        
        // Função auxiliar para esperar um tempo específico
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        // Função para fazer uma única requisição com tratamento de erros e retentativas
        async function fetchWithRetry(url, retries = 3, backoff = 1000) {
          const searchTerm = new URL(url).searchParams.get('q');
          const language = new URL(url).searchParams.get('language');
          const key = `${searchTerm}_${language}`;
            
          try {
            console.log(`Fazendo requisição para: ${searchTerm} (${language})`);
                
            // Fazer a requisição
            const response = await fetch(url);
                
            // Verificar se a resposta foi bem-sucedida
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Erro na requisição para ${searchTerm}: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
                    
              // Se atingimos limite de requisições, aguardar tempo maior
              if (response.status === 429) {
                const waitTime = backoff * 2; // Tempo exponencial de espera
                console.log(`Limite de requisições atingido. Aguardando ${waitTime/1000} segundos...`);
                await delay(waitTime);
                        
                // Tentar novamente se ainda houver tentativas
                if (retries > 0) {
                  return fetchWithRetry(url, retries - 1, waitTime);
                }
              }
                    
              // Retornar objeto com erro
              return { error: true, status: response.status, message: errorData.message };
            }
                
            // Processar a resposta bem-sucedida
            const data = await response.json();
            results[key] = {
              totalResults: data.totalResults,
              articles: data.articles,
              query: searchTerm,
              language: language
            };
                
            console.log(`Sucesso: ${searchTerm} (${language}) - ${data.totalResults} resultados`);
            return data;
          } catch (error) {
            console.error(`Erro ao fazer requisição para ${searchTerm}:`, error.message);
                
            // Tentar novamente se ainda houver tentativas
            if (retries > 0) {
              console.log(`Tentando novamente em ${backoff/1000} segundos...`);
              await delay(backoff);
              return fetchWithRetry(url, retries - 1, backoff * 2);
            }
                
            // Retornar objeto com erro
            return { error: true, message: error.message };
          }
        }
        
        // Processar URLs em lotes para evitar muitas requisições simultâneas
        const batchSize = 5; // Processar 5 requisições por vez
        const intervalBetweenBatches = 1000; // 1 segundo entre lotes
        
        for (let i = 0; i < urls.length; i += batchSize) {
          // Pegar o próximo lote de URLs
          const batch = urls.slice(i, i + batchSize);
            
          // Criar array de promessas para o lote atual
          const batchPromises = batch.map(url => fetchWithRetry(url));
            
          // Executar todas as requisições do lote atual
          await Promise.all(batchPromises);
            
          // Se não for o último lote, aguardar antes do próximo
          if (i + batchSize < urls.length) {
            console.log(`Aguardando ${intervalBetweenBatches/1000} segundos antes do próximo lote...`);
            await delay(intervalBetweenBatches);
          }
        }
        
        return results;
    }
    
    // Função para salvar os resultados em arquivo JSON
    function saveResultsToFile(results) {
        try {
          // Criar pasta para os resultados se não existir
          const resultsDir = path.join(__dirname, 'news_results');
          if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
          }
                
          // Criar nome de arquivo com timestamp
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const fileName = path.join(resultsDir, `news_data_${timestamp}.json`);
                
          // Salvar arquivo
          fs.writeFileSync(fileName, JSON.stringify(results, null, 2));
          console.log(`Resultados salvos em: ${fileName}`);
          
          return true;
        } catch (error) {
          console.error('Erro ao salvar resultados:', error);
          return false;
        }
    }
    
    // Função principal para executar todo o processo
    async function fetchNewsData(apiKey) {
        try {
          console.log('Iniciando coleta de dados da News API...');
          const startTime = new Date();
            
          // Buscar todos os dados
          const newsData = await fetchAllNewsData(apiKey);
            
          // Calcular estatísticas
          const endTime = new Date();
          const totalTime = (endTime - startTime) / 1000;
            
          // Contar total de artigos
          let totalArticles = 0;
          Object.values(newsData).forEach(result => {
            if (result.articles) {
              totalArticles += result.articles.length;
            }
          });
            
          console.log(`
          ===============================================
          Sumário da coleta:
          - Total de consultas: ${Object.keys(newsData).length}
          - Total de artigos: ${totalArticles}
          - Tempo total: ${totalTime.toFixed(2)} segundos
          ===============================================
          `);
            
          // Salvar resultados
          saveResultsToFile(newsData);
            
          return {
            success: true,
            summary: {
              totalQueries: Object.keys(newsData).length,
              totalArticles,
              executionTimeSeconds: totalTime.toFixed(2)
            },
            data: newsData
          };
        } catch (error) {
          console.error('Erro ao executar processo:', error);
          return {
            success: false,
            error: error.message
          };
        }
    }
    
    module.exports = { fetchNewsData, fetchAllNewsData, saveResultsToFile };
    