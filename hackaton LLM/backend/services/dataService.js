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

/**
 * Salva os indicadores econômicos no banco de dados
 * @param {Array} indicadores - Lista de indicadores a serem salvos
 * @returns {Object} - Estatísticas de indicadores adicionados, ignorados e com erros
 */
async function saveIndicadores(indicadores) {
  try {
    let adicionados = 0;
    let ignorados = 0;
    let erros = 0;

    // Verificar se indicadores é um array
    if (!Array.isArray(indicadores)) {
      console.warn('Dados de indicadores não é um array:', indicadores);
      return { adicionados, ignorados, erros: 1 };
    }

    for (const indicadorData of indicadores) {
      try {
        // Verificar e corrigir campos obrigatórios
        const indicadorCorrigido = {
          ...indicadorData,
          tipo: indicadorData.tipo || 'Desconhecido',
          valor: indicadorData.valor || indicadorData.value || 0,
          data: indicadorData.data || indicadorData.date || new Date()
        };

        // Verificar se o indicador já existe
        const indicadorExistente = await Indicador.findOne({ 
          tipo: indicadorCorrigido.tipo,
          data: indicadorCorrigido.data
        });
        
        if (!indicadorExistente) {
          await Indicador.create(indicadorCorrigido);
          adicionados++;
        } else {
          // Atualizar indicador existente com novos dados
          await Indicador.findByIdAndUpdate(indicadorExistente._id, indicadorCorrigido);
          ignorados++;
        }
      } catch (error) {
        console.warn(`Erro ao salvar indicador: ${error}`);
        erros++;
      }
    }
    
    return { adicionados, ignorados, erros };
  } catch (error) {
    console.error('Erro ao salvar indicadores:', error);
    throw error;
  }
}


/**
 * Salva os dados dos bancos no banco de dados
 * @param {Array} bancos - Lista de bancos a serem salvos
 * @returns {Object} - Estatísticas de bancos adicionados, ignorados e com erros
 */
async function saveBancos(bancos) {
  try {
    let adicionados = 0;
    let ignorados = 0;
    let erros = 0;

    // Verificar se bancos é um array
    if (!Array.isArray(bancos)) {
      console.warn('Dados de bancos não é um array:', bancos);
      return { adicionados, ignorados, erros: 1 };
    }

    for (const bancoData of bancos) {
      try {
        // Verificar e corrigir campos obrigatórios
        const bancoCorrigido = {
          ...bancoData,
          ispb: bancoData.ispb || bancoData.code || bancoData.codigo || 'N/A',
          name: bancoData.name || bancoData.nome || bancoData.shortName || 'N/A',
          fullName: bancoData.fullName || bancoData.nomeCompleto || bancoData.nome_completo || bancoData.name || 'N/A'
        };

        // Verificar se o banco já existe
        const bancoExistente = await Banco.findOne({ 
          $or: [
            { ispb: bancoCorrigido.ispb },
            { code: bancoCorrigido.code }
          ]
        });
        
        if (!bancoExistente) {
          await Banco.create(bancoCorrigido);
          adicionados++;
        } else {
          // Atualizar banco existente com novos dados
          await Banco.findByIdAndUpdate(bancoExistente._id, bancoCorrigido);
          ignorados++;
        }
      } catch (error) {
        console.warn(`Erro ao salvar banco: ${error}`);
        erros++;
      }
    }
    
    return { adicionados, ignorados, erros };
  } catch (error) {
    console.error('Erro ao salvar bancos:', error);
    throw error;
  }
}



/**
 * Salva as notícias no banco de dados
 * @param {Array} noticias - Lista de notícias a serem salvas
 * @returns {Object} - Estatísticas de notícias adicionadas, ignoradas e com erros
 */
async function saveNoticias(noticias) {
  try {
    let adicionados = 0;
    let ignorados = 0;
    let erros = 0;

    // Verificar se noticias é um array
    if (!Array.isArray(noticias)) {
      console.warn('Dados de notícias não é um array:', noticias);
      return { adicionados, ignorados, erros: 1 };
    }

    for (const noticiaData of noticias) {
      try {
        // Verificar e corrigir campos obrigatórios
        const noticiaCorrigida = {
          ...noticiaData,
          title: noticiaData.title || noticiaData.titulo || 'Sem título',
          description: noticiaData.description || noticiaData.descricao || 'Sem descrição',
          url: noticiaData.url || noticiaData.link || '#',
          publishedAt: noticiaData.publishedAt || noticiaData.data || new Date(),
          source: {
            name: (noticiaData.source && noticiaData.source.name) || 
                  (noticiaData.fonte && noticiaData.fonte.nome) || 
                  'Fonte desconhecida'
          }
        };

        // Verificar se a notícia já existe
        const noticiaExistente = await Noticia.findOne({ 
          $or: [
            { title: noticiaCorrigida.title },
            { url: noticiaCorrigida.url }
          ]
        });
        
        if (!noticiaExistente) {
          await Noticia.create(noticiaCorrigida);
          adicionados++;
        } else {
          ignorados++;
        }
      } catch (error) {
        console.warn(`Erro ao salvar notícia: ${error}`);
        erros++;
      }
    }
    
    return { adicionados, ignorados, erros };
  } catch (error) {
    console.error('Erro ao salvar notícias:', error);
    throw error;
  }
}


module.exports = {
  saveCotacoes,
  saveIndicadores,
  saveBancos,
  saveNoticias
};
