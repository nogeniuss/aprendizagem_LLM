const mongoose = require('mongoose');

const bancoSchema = new mongoose.Schema({
  ispb: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String },
  fullName: { type: String, required: true }
}, { timestamps: true });

// Índice para melhorar a performance de busca
bancoSchema.index({ ispb: 1 });
bancoSchema.index({ code: 1 });

module.exports = mongoose.model('Banco', bancoSchema);
