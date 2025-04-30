const Cotacao = require('../models/cotacao');
const Indicador = require('../models/indicador');
const Banco = require('../models/banco');
const Noticia = require('../models/noticias');
const crypto = require('crypto');

// Função para gerar um ID único baseado nos dados
function generateUniqueId(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Serviço para salvar cotações
async function saveCotacoes(cotacoesData) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Processar cada cotação
    for (const [code, data] of Object.entries(cotacoesData)) {
      // Criar ID único para verificar duplicidade
      const uniqueId = generateUniqueId({
        code: data.code,
        timestamp: data.timestamp,
        bid: data.bid,
        ask: data.ask
      });

      // Verificar se já existe
      const existing = await Cotacao.findOne({ uniqueId });
      
      if (existing) {
        results.skipped++;
        continue;
      }

      // Criar novo documento
      const cotacao = new Cotacao({
        ...data,
        uniqueId,
        create_date: new Date(parseInt(data.timestamp) * 1000)
      });

      await cotacao.save();
      results.added++;
    }

    return results;
  } catch (error) {
    console.error('Erro ao salvar cotações:', error);
    results.errors++;
    return results;
  }
}

// Serviço para salvar indicadores
async function saveIndicadores(indicadoresData) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Processar SELIC, CDI, IPCA
    for (const tipo of ['SELIC', 'CDI', 'IPCA']) {
      if (!indicadoresData[tipo]) continue;

      const data = indicadoresData[tipo];
      
      // Criar ID único para verificar duplicidade
      const uniqueId = generateUniqueId({
        tipo,
        valor: data.valor,
        data: data.data
      });

      // Verificar se já existe
      const existing = await Indicador.findOne({ uniqueId });
      
      if (existing) {
        results.skipped++;
        continue;
      }

      // Criar novo documento
      const indicador = new Indicador({
        tipo,
        valor: parseFloat(data.valor),
        data: new Date(data.data),
        uniqueId
      });

      await indicador.save();
      results.added++;
    }

    return results;
  } catch (error) {
    console.error('Erro ao salvar indicadores:', error);
    results.errors++;
    return results;
  }
}

// Serviço para salvar bancos
async function saveBancos(bancosData) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Verificar se bancosData é um array
    if (!Array.isArray(bancosData)) {
      throw new Error('Dados de bancos devem ser um array');
    }

    // Processar cada banco
    for (const banco of bancosData) {
      // Verificar se já existe
      const existing = await Banco.findOne({ ispb: banco.ispb });
      
      if (existing) {
        results.skipped++;
        continue;
      }

      // Criar novo documento
      const novoBanco = new Banco({
        ispb: banco.ispb,
        name: banco.name,
        code: banco.code || null,
        fullName: banco.fullName
      });

      await novoBanco.save();
      results.added++;
    }

    return results;
  } catch (error) {
    console.error('Erro ao salvar bancos:', error);
    results.errors++;
    return results;
  }
}

// Serviço para salvar notícias
async function saveNoticias(noticiasData) {
  const results = {
    added: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Processar cada termo de busca
    for (const [key, data] of Object.entries(noticiasData)) {
      if (!data.articles || !Array.isArray(data.articles)) continue;

      // Extrair query e language da chave (formato: "termo_idioma")
      const [query, language] = key.split('_');

      // Processar cada artigo
      for (const article of data.articles) {
        // Criar ID único para verificar duplicidade
        const uniqueId = generateUniqueId({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt
        });

        // Verificar se já existe
        const existing = await Noticia.findOne({ uniqueId });
        
        if (existing) {
          results.skipped++;
          continue;
        }

        // Criar novo documento
        const noticia = new Noticia({
          source: {
            id: article.source.id || null,
            name: article.source.name
          },
          author: article.author || null,
          title: article.title,
          description: article.description || null,
          url: article.url,
          urlToImage: article.urlToImage || null,
          publishedAt: new Date(article.publishedAt),
          content: article.content || null,
          query,
          language,
          uniqueId
        });

        await noticia.save();
        results.added++;
      }
    }

    return results;
  } catch (error) {
    console.error('Erro ao salvar notícias:', error);
    results.errors++;
    return results;
  }
}

module.exports = {
  saveCotacoes,
  saveIndicadores,
  saveBancos,
  saveNoticias
};
