const fetch = require('node-fetch');

async function requisitar_brasilApi() {
    // Lista de URLs para requisição
    const urls = [
        `https://brasilapi.com.br/api/taxas/v1/selic`,
        `https://brasilapi.com.br/api/taxas/v1/cdi`,
        `https://brasilapi.com.br/api/taxas/v1/ipca`,
        `https://brasilapi.com.br/api/banks/v1`
    ];
    
    // Nomes para identificar cada endpoint
    const nomes = ['SELIC', 'CDI', 'IPCA', 'Lista de Bancos'];
    
    // Objeto para armazenar os resultados
    const resultados = {};
    
    // Loop para fazer cada requisição
    for (let i = 0; i < urls.length; i++) {
        try {
            console.log(`Fazendo requisição para ${nomes[i]}...`);
            
            // Fazendo a requisição
            const resposta = await fetch(urls[i]);
            
            // Verificando se a requisição foi bem-sucedida
            if (!resposta.ok) {
                throw new Error(`Erro na requisição para ${nomes[i]}: ${resposta.status} ${resposta.statusText}`);
            }
            
            // Convertendo a resposta para JSON
            const dados = await resposta.json();
            
            // Armazenando o resultado
            resultados[nomes[i]] = dados;
            
            console.log(`Requisição para ${nomes[i]} concluída com sucesso!`);
        } catch (erro) {
            console.error(`Falha na requisição para ${nomes[i]}:`, erro);
            resultados[nomes[i]] = { erro: erro.message };
        }
    }
    
    // Retornando todos os resultados
    return resultados;
}

module.exports = { requisitar_brasilApi };
