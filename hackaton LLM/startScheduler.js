// Script para iniciar apenas o agendador de coleta
console.log('Iniciando agendador de coleta de dados...');

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar se o agendador já está rodando
const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, 'backend/logs');

// Criar diretório de logs se não existir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const lockFile = path.join(logDir, 'scheduler.lock');

if (fs.existsSync(lockFile)) {
  try {
    const pid = fs.readFileSync(lockFile, 'utf8');
    console.log(`Já existe um agendador rodando com PID ${pid}.`);
    
    // Verificar se o processo ainda está rodando
    try {
      process.kill(parseInt(pid), 0); // Apenas verifica se o processo existe
      console.log('O processo ainda está ativo. Saindo...');
      process.exit(0);
    } catch (e) {
      console.log('O processo não está mais ativo. Removendo arquivo de lock...');
      fs.unlinkSync(lockFile);
    }
  } catch (error) {
    console.error('Erro ao verificar arquivo de lock:', error);
  }
}

// Iniciar o agendador
require('./backend/rotina/scheduler');

console.log('Agendador iniciado e rodando em segundo plano.');
