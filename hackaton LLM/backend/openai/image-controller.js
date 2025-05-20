const { gerarImagem } = require('./image-service');

const imageController = {
  gerarImagem: async (req, res) => {
    try {
      const { prompt, size = '1024x1024' } = req.body;
      
      // Validação do prompt
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: "Descrição da imagem não fornecida ou inválida." 
        });
      }
      
      console.log(`Processando geração de imagem: "${prompt.substring(0, 50)}..."`);
      
      // Geração da imagem via OpenAI
      const resultado = await gerarImagem(prompt, size);
      
      // Resposta ao cliente
      if (resultado.success) {
        return res.json({
          success: true,
          imageUrl: resultado.imageUrl,
          prompt: resultado.prompt
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: resultado.error || "Erro ao gerar imagem." 
        });
      }
    } catch (error) {
      console.error('Erro no controlador de imagem:', error);
      return res.status(500).json({
        success: false,
        error: "Erro interno ao processar a solicitação de imagem."
      });
    }
  }
};

module.exports = imageController;
