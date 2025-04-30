const cron = require('node-cron');
const { executarColeta } = require('./dataCollector');
const fs = require('fs');
const path = require('path');

// Diretório para logs
const logDir = path.join(__dirname, '../logs');

// Criar diretório de logs se não existir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Arquivo para controle de instância única
const lockFile = path.join(logDir, 'scheduler.lock');

// Verificar se já existe uma instância rodando
if (fs.existsSync(lockFile)) {
  try {
    const pid = fs.readFileSync(lockFile, 'utf8');
    console.log(`Já existe um agendador rodando com PID ${pid}. Saindo...`);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar arquivo de lock:', error);
  }
}

// Criar arquivo de lock com o PID atual
fs.writeFileSync(lockFile, process.pid.toString());

// Remover arquivo de lock ao encerrar
process.on('exit', () => {
  try {
    fs.unlinkSync(lockFile);
  } catch (error) {
    console.error('Erro ao remover arquivo de lock:', error);
  }
});

// Função para registrar logs
function logToFile(message, isError = false) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toISOString().split('T')[1].replace(/:/g, '-').split('.')[0];
  const logFile = path.join(logDir, `coleta_${dateStr}.log`);
  
  const logEntry = `[${now.toISOString()}] ${isError ? 'ERROR: ' : ''}${message}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  
  if (isError) {
    console.error(logEntry.trim());
  } else {
    console.log(logEntry.trim());
  }
}

// Função para executar a coleta e registrar logs
async function executarColetaComLog() {
  logToFile('Iniciando coleta agendada');
  
  try {
    const resultado = await executarColeta();
    
    if (resultado.success) {
      logToFile(`Coleta concluída com sucesso. Cotações: ${resultado.results.cotacoes.added}, Indicadores: ${resultado.results.indicadores.added}, Bancos: ${resultado.results.bancos.added}, Notícias: ${resultado.results.noticias.added}`);
    } else {
      logToFile(`Coleta falhou: ${resultado.error}`, true);
    }
    
    return resultado;
  } catch (error) {
    logToFile(`Erro fatal durante a coleta: ${error.message}`, true);
    return { success: false, error: error.message };
  }
}

// Agendar a coleta para executar todos os dias às 00:00, 08:00 e 16:00
// Formato cron: segundo(0-59) minuto(0-59) hora(0-23) dia(1-31) mês(1-12) dia da semana(0-6, 0=domingo)
const jobDiario = cron.schedule('0 0 0,8,16 * * *', () => {
  logToFile('Executando coleta agendada');
  executarColetaComLog();
});

// Também podemos agendar uma coleta semanal mais completa aos domingos
const jobSemanal = cron.schedule('0 0 2 * * 0', () => {
  logToFile('Executando coleta semanal completa');
  executarColetaComLog();
});

// Iniciar o agendador
logToFile('Agendador de coleta iniciado');
console.log('Agendador de coleta iniciado. Próximas execuções:');
console.log('- Diariamente às 00:00, 08:00 e 16:00');
console.log('- Coleta completa aos domingos às 02:00');

// Executar uma coleta inicial ao iniciar o agendador
logToFile('Executando coleta inicial');
executarColetaComLog();

// Lidar com encerramento do processo
process.on('SIGINT', () => {
  logToFile('Agendador de coleta encerrado pelo usuário');
  jobDiario.stop();
  jobSemanal.stop();
  
  // Remover arquivo de lock
  try {
    fs.unlinkSync(lockFile);
  } catch (error) {
    console.error('Erro ao remover arquivo de lock:', error);
  }
  
  process.exit(0);
});

// Lidar com outros sinais de encerramento
process.on('SIGTERM', () => {
  logToFile('Agendador de coleta encerrado pelo sistema');
  jobDiario.stop();
  jobSemanal.stop();
  
  // Remover arquivo de lock
  try {
    fs.unlinkSync(lockFile);
  } catch (error) {
    console.error('Erro ao remover arquivo de lock:', error);
  }
  
  process.exit(0);
});
