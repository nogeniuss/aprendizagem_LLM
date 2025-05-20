// Carregar variáveis de ambiente
require('dotenv').config();

// Importar módulos necessários
const fs = require('fs');
const path = require('path');

class Scheduler {
  constructor() {
    this.logDir = path.join(__dirname, 'backend/logs');
    this.lockFile = path.join(this.logDir, 'scheduler.lock');
  }

  // Método para iniciar o agendador
  start() {
    console.log('Iniciando agendador de coleta de dados...');

    // Criar diretório de logs se não existir
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Verificar se já existe um agendador rodando
    if (fs.existsSync(this.lockFile)) {
      try {
        const pid = fs.readFileSync(this.lockFile, 'utf8');
        console.log(`Já existe um agendador rodando com PID ${pid}.`);
        
        // Verificar se o processo ainda está rodando
        try {
          process.kill(parseInt(pid), 0); // Apenas verifica se o processo existe
          console.log('O processo ainda está ativo. Saindo...');
          return false;
        } catch (e) {
          console.log('O processo não está mais ativo. Removendo arquivo de lock...');
          fs.unlinkSync(this.lockFile);
        }
      } catch (error) {
        console.error('Erro ao verificar arquivo de lock:', error);
      }
    }

    // Criar arquivo de lock com o PID atual
    fs.writeFileSync(this.lockFile, process.pid.toString());

    // Iniciar o agendador
    require('./backend/rotina/scheduler');
    console.log('Agendador iniciado e rodando em segundo plano.');
    return true;
  }
}

// Criar e iniciar o agendador automaticamente
const scheduler = new Scheduler();
scheduler.start();

// Exportar a classe para uso em outros módulos se necessário
module.exports = Scheduler;
