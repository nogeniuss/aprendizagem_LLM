const mongoose = require('mongoose');

const cotacaoSchema = new mongoose.Schema({
  code: { type: String, required: true }, // Ex: USDBRL, EURBRL
  codein: { type: String, required: true },
  name: { type: String, required: true },
  high: { type: String, required: true },
  low: { type: String, required: true },
  varBid: { type: String, required: true },
  pctChange: { type: String, required: true },
  bid: { type: String, required: true },
  ask: { type: String, required: true },
  timestamp: { type: String, required: true },
  create_date: { type: Date, required: true },
  // Campo para identificação única para evitar duplicatas
  uniqueId: { type: String, required: true, unique: true }
}, { timestamps: true });

// Índice para melhorar a performance de busca
cotacaoSchema.index({ uniqueId: 1 });

module.exports = mongoose.model('Cotacao', cotacaoSchema);
