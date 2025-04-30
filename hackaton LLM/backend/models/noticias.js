const mongoose = require('mongoose');

const noticiaSchema = new mongoose.Schema({
  source: {
    id: { type: String },
    name: { type: String, required: true }
  },
  author: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  urlToImage: { type: String },
  publishedAt: { type: Date, required: true },
  content: { type: String },
  query: { type: String, required: true }, // Termo de busca usado
  language: { type: String, required: true }, // Idioma da notícia
  // Campo para identificação única para evitar duplicatas
  uniqueId: { type: String, required: true, unique: true }
}, { timestamps: true });

// Índice para melhorar a performance de busca
noticiaSchema.index({ uniqueId: 1 });
noticiaSchema.index({ publishedAt: -1 });
noticiaSchema.index({ query: 1, language: 1 });

module.exports = mongoose.model('Noticia', noticiaSchema);
