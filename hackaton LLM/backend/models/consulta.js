const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  resposta: { type: String, required: true },
  modelo: { type: String, required: true },
  tokens: {
    prompt: { type: Number },
    completion: { type: Number },
    total: { type: Number }
  },
  usuario: { type: String },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Consulta', consultaSchema);
