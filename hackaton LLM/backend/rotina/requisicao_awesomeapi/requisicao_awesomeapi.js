const axios = require('axios');

async function awesomeapi(req, res) {
  try {
    const response = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
    return res.json(response.data);
  } catch (error) {
    console.error('Erro na requisição AwesomeAPI:', error.message);
    return res.status(500).json({ error: "Erro ao buscar cotações." });
  }
}

module.exports = { awesomeapi };
