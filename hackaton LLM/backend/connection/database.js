const mongoose = require('mongoose');

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conectado ao MongoDB com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    return false;
  }
}

module.exports = { connectToDatabase };
