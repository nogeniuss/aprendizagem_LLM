const mongoose = require('mongoose');

const indicadorSchema = new mongoose.Schema({
  tipo: { type: String, required: true }, // SELIC, CDI, IPCA
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  // Campo para identificação única para evitar duplicatas
  uniqueId: { type: String, required: true, unique: true }
}, { timestamps: true });

// Índice para melhorar a performance de busca
indicadorSchema.index({ uniqueId: 1 });
indicadorSchema.index({ tipo: 1, data: 1 });

module.exports = mongoose.model('Indicador', indicadorSchema);
