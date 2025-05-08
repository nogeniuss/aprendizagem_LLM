// Configuração da API
const API_URL = "http://localhost:3000"; // Porta correta do servidor

// Configurar data atual
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', dateOptions);

// Auto-resize para o textarea
const textarea = document.getElementById('questionInput');
textarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight < 120) ? this.scrollHeight + 'px' : '120px';
});

// Gerenciar abas dos indicadores
document.querySelectorAll('.card-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remover classe active de todas as abas
    document.querySelectorAll('.card-tab').forEach(t => t.classList.remove('active'));
    // Adicionar classe active à aba clicada
    tab.classList.add('active');
    // Esconder todos os conteúdos de abas
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    // Mostrar o conteúdo da aba selecionada
    const tabName = tab.getAttribute('data-tab');
    document.getElementById(`${tabName}-content`).style.display = 'block';
  });
});

// Função para adicionar mensagens no chat
function addMessage(text, isUser = false) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
  messageDiv.innerHTML = text;
  chatMessages.appendChild(messageDiv);
  // Scroll para a mensagem mais recente
  messageDiv.scrollIntoView({ behavior: 'smooth' });
  return messageDiv;
}

// Função para mostrar indicador de digitação
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('message', 'bot-message', 'typing-message');
  typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(typingDiv);
  typingDiv.scrollIntoView({ behavior: 'smooth' });
  return typingDiv;
}

// Processar envio de perguntas - Integração com OpenAI
document.getElementById('questionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const questionInput = document.getElementById('questionInput');
  const pergunta = questionInput.value.trim();
  if (!pergunta) return;

  // Adicionar mensagem do usuário
  addMessage(pergunta, true);

  // Mostrar indicador de digitação
  const typingIndicator = showTypingIndicator();

  // Limpar e resetar campo de entrada
  questionInput.value = "";
  questionInput.style.height = 'auto';

  try {
    // Usar a rota de OpenAI
    const res = await fetch(`${API_URL}/api/openai/consulta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        prompt: pergunta,
        model: 'gpt-3.5-turbo',
        maxTokens: 800
      })
    });

    // Remover indicador de digitação
    typingIndicator.remove();

    if (!res.ok) {
      throw new Error('Erro na resposta do servidor');
    }

    const data = await res.json();

    // Adicionar resposta do bot
    if (data.success) {
      addMessage(data.response);
    } else {
      throw new Error(data.error || 'Erro ao processar consulta');
    }
  } catch (error) {
    // Remover indicador de digitação
    typingIndicator.remove();
    console.error(error);
    addMessage('Desculpe, tive um problema ao processar sua pergunta. Tente novamente mais tarde.');
  }
});

// Processamento dos chips de sugestão
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('questionInput').value = chip.textContent;
    document.getElementById('questionForm').dispatchEvent(new Event('submit'));
  });
});

// Carregar últimas notícias do banco de dados
async function loadNews() {
  try {
    // Adicionar placeholders de carregamento
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = `<div class="loading-news"><div class="loading-placeholder medium"></div><div class="loading-placeholder short"></div><div class="loading-placeholder long"></div><div class="loading-placeholder medium"></div><div class="loading-placeholder short"></div></div>`;

    // Buscar notícias do banco de dados através do backend
    const res = await fetch(`${API_URL}/api/db/noticias`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar notícias do banco de dados');
    }

    const data = await res.json();
    newsList.innerHTML = "";

    // Verificar a estrutura de dados retornada
    const noticias = data.noticias || data;
    
    if (!noticias || noticias.length === 0) {
      newsList.innerHTML = "Não há notícias disponíveis no momento.";
      return;
    }

    noticias.forEach(noticia => {
      const newsItem = document.createElement('div');
      newsItem.classList.add('news-item');
      
      // Adaptar para a estrutura de dados do banco
      const titulo = noticia.titulo || noticia.title;
      const data = noticia.data ? new Date(noticia.data).toLocaleDateString('pt-BR') : 
                 (noticia.publishedAt ? new Date(noticia.publishedAt).toLocaleDateString('pt-BR') : 'Data não disponível');
      
      newsItem.innerHTML = `
        <div class="news-title">${titulo}</div>
        <div class="news-date">${data}</div>
      `;
      
      newsItem.addEventListener('click', () => {
        document.getElementById('questionInput').value = `Conte-me mais sobre: ${titulo}`;
        document.getElementById('questionForm').dispatchEvent(new Event('submit'));
      });
      
      newsList.appendChild(newsItem);
    });
  } catch (error) {
    console.error("Erro ao carregar notícias", error);
    document.getElementById('newsList').innerHTML = "Não foi possível carregar as notícias.";
  }
}

// Carregar dados econômicos do banco de dados
async function loadEconomyData() {
  try {
    // Adicionar placeholders de carregamento para todas as abas
    ['moedas'].forEach(tab => {
      document.getElementById(`${tab}-content`).innerHTML = `<div class="loading-economy"><div class="loading-placeholder medium"></div><div class="loading-placeholder long"></div><div class="loading-placeholder short"></div></div>`;
    });

    // Buscar indicadores do banco de dados através do backend
    const res = await fetch(`${API_URL}/api/db/indicadores`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar indicadores do banco de dados');
    }

    const data = await res.json();
    const indicadores = data.indicadores || data;

    if (!indicadores || indicadores.length === 0) {
      ['moedas'].forEach(tab => {
        document.getElementById(`${tab}-content`).innerHTML = "Não há indicadores disponíveis no momento.";
      });
      return;
    }

    // Processar indicadores por categoria
    const categorias = {
      moedas: indicadores.filter(i => i.categoria === 'moeda' || i.nome.includes('Dólar') || i.nome.includes('Euro')),
    };



    // Atualizar cada aba
    Object.keys(categorias).forEach(categoria => {
      const tabContent = document.getElementById(`${categoria}-content`);
      tabContent.innerHTML = "";
      
      if (categorias[categoria].length === 0) {
        tabContent.innerHTML = "Sem dados disponíveis para esta categoria.";
        return;
      }
      
      categorias[categoria].forEach(indicador => {
        const item = document.createElement('div');
        item.classList.add('economy-item');
        
        // Determinar tendência
        const tendencia = indicador.variacao > 0 ? 'trending-up' : (indicador.variacao < 0 ? 'trending-down' : '');
        const tendenciaIcone = tendencia === 'trending-up' ? '↑' : (tendencia === 'trending-down' ? '↓' : '');
        
        item.innerHTML = `
          <div class="economy-name">${indicador.nome}
            ${tendencia ? `<span class="${tendencia}">${tendenciaIcone} ${Math.abs(indicador.variacao).toFixed(2)}%</span>` : ''}
          </div>
          <div class="economy-value">${indicador.valor}</div>
          <div class="economy-date">${indicador.data}</div>
        `;
        
        item.addEventListener('click', () => {
          document.getElementById('questionInput').value = `Como está o ${indicador.nome} hoje?`;
          document.getElementById('questionForm').dispatchEvent(new Event('submit'));
        });
        
        tabContent.appendChild(item);
      });
    });

    // Criar gráfico de mercado
    if (indicadores.length > 0) {
      criarGraficoMercado(indicadores);
    }
  } catch (error) {
    console.error("Erro ao carregar indicadores econômicos", error);
    ['moedas', 'indices', 'juros'].forEach(tab => {
      document.getElementById(`${tab}-content`).innerHTML = "Não foi possível carregar os indicadores.";
    });
  }
}

// Criar gráfico de exemplo dos últimos dias
function criarGraficoMercado(indicadores) {
  // Verificar se Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não está disponível');
    return;
  }

  // Encontrar indicador principal (ex: Ibovespa ou um índice importante)
  let indicadorPrincipal = indicadores.find(i =>
    i.nome.toLowerCase().includes('ibovespa') ||
    i.nome.toLowerCase().includes('bovespa')
  );

  // Se não encontrar, usar o primeiro disponível
  if (!indicadorPrincipal) {
    indicadorPrincipal = indicadores[0];
  }

  // Gerar dados simulados para os últimos 7 dias
  const hoje = new Date();
  const labels = [];
  const dados = [];

  // Gerar datas e valores simulados dos últimos 7 dias
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    labels.push(data.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}));
    
    // Gerar valor baseado no valor atual do indicador + variação aleatória
    let valorBase = parseFloat(indicadorPrincipal.valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(valorBase)) valorBase = 100; // Valor padrão se não conseguir extrair
    
    // Simular variação de até 2%
    const variacao = (Math.random() * 4 - 2) / 100;
    dados.push(valorBase * (1 + variacao * i));
  }

  // Criar o gráfico
  const ctx = document.getElementById('marketChart');
  if (!ctx) {
    console.error('Elemento canvas para o gráfico não encontrado');
    return;
  }
  
  const ctxContext = ctx.getContext('2d');

  // Destruir gráfico existente se houver
  if (window.marketChart && typeof window.marketChart.destroy === 'function') {
    window.marketChart.destroy();
  }

  window.marketChart = new Chart(ctxContext, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: indicadorPrincipal.nome,
        data: dados,
        backgroundColor: 'rgba(0, 82, 204, 0.1)',
        borderColor: '#0052cc',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#0052cc',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#666',
            font: {
              size: 10
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#666',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(0);
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6
        }
      }
    }
  });
}

// Carregar análise financeira do banco de dados
async function loadFinancialAnalysis() {
  try {
    const analysisContainer = document.getElementById('financial-analysis');
    if (!analysisContainer) return;
    
    analysisContainer.innerHTML = '<div class="loading-analysis"><div class="loading-placeholder long"></div><div class="loading-placeholder medium"></div><div class="loading-placeholder long"></div><div class="loading-placeholder short"></div></div>';
    
    // Buscar análise do banco de dados através do backend
    const res = await fetch(`${API_URL}/api/db/analise`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar análise do banco de dados');
    }
    
    const data = await res.json();
    const analise = data.analise || data;
    
    if (!analise || !analise.conteudo) {
      analysisContainer.innerHTML = "Não há análise financeira disponível no momento.";
      return;
    }
    
    // Formatar data
    const dataAnalise = analise.data ? new Date(analise.data).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    
    analysisContainer.innerHTML = `
      <div class="analysis-header">
        <h3>Análise de Mercado</h3>
        <span class="analysis-date">Atualizado em: ${dataAnalise}</span>
      </div>
      <div class="analysis-content">${analise.conteudo}</div>
    `;
  } catch (error) {
    console.error("Erro ao carregar análise financeira", error);
    const analysisContainer = document.getElementById('financial-analysis');
    if (analysisContainer) {
      analysisContainer.innerHTML = "Não foi possível carregar a análise financeira.";
    }
  }
}

// Função para carregar histórico de consultas
async function loadConsultaHistory() {
  try {
    const historyContainer = document.getElementById('consulta-history');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '<div class="loading-history">Carregando histórico...</div>';
    
    const res = await fetch(`${API_URL}/api/openai/historico?limit=5`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar histórico de consultas');
    }
    
    const consultas = await res.json();
    
    if (consultas.length === 0) {
      historyContainer.innerHTML = '<p>Nenhuma consulta realizada ainda.</p>';
      return;
    }
    
    historyContainer.innerHTML = '<h3>Consultas Recentes</h3>';
    const historyList = document.createElement('ul');
    historyList.className = 'history-list';
    
    consultas.forEach(consulta => {
      const item = document.createElement('li');
      item.className = 'history-item';
      
      // Formatar data
      const data = new Date(consulta.createdAt);
      const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                           data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      
      item.innerHTML = `
        <div class="history-prompt">${consulta.prompt}</div>
        <div class="history-date">${dataFormatada}</div>
      `;
      
      item.addEventListener('click', () => {
        // Adicionar a pergunta e resposta ao chat quando clicado
        addMessage(consulta.prompt, true);
        addMessage(consulta.resposta);
      });
      
      historyList.appendChild(item);
    });
    
    historyContainer.appendChild(historyList);
  } catch (error) {
    console.error("Erro ao carregar histórico de consultas", error);
    const historyContainer = document.getElementById('consulta-history');
    if (historyContainer) {
      historyContainer.innerHTML = "Não foi possível carregar o histórico de consultas.";
    }
  }
}

// Função para verificar status do backend
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_URL}/api/status`);
    return res.ok;
  } catch (error) {
    console.error("Erro ao verificar status do backend:", error);
    return false;
  }
}

// Função para inicializar a aplicação
async function initApp() {
  // Verificar se o backend está disponível
  const backendAvailable = await checkBackendStatus();
  
  if (!backendAvailable) {
    // Mostrar mensagem de erro se o backend não estiver disponível
    document.body.innerHTML = `
      <div class="error-container">
        <h2>Erro de Conexão</h2>
        <p>Não foi possível conectar ao servidor. Verifique se o backend está em execução na porta correta (3000).</p>
        <button onclick="window.location.reload()">Tentar Novamente</button>
      </div>
    `;
    return;
  }
  
  // Carregar todos os dados
  loadNews();
  loadEconomyData();
  loadFinancialAnalysis();
  loadConsultaHistory();
  
  // Ativar a primeira aba por padrão
  document.querySelector('.card-tab').click();
  
  // Adicionar mensagem de boas-vindas
  addMessage('Olá! Sou seu assistente financeiro. Como posso ajudar você hoje?');
}

// Inicializar dados ao carregar a página
document.addEventListener('DOMContentLoaded', initApp);

// Adicionar botão para gerar análise sob demanda
const analysisButton = document.getElementById('generate-analysis');
if (analysisButton) {
  analysisButton.addEventListener('click', async () => {
    try {
      analysisButton.disabled = true;
      analysisButton.textContent = 'Gerando análise...';
      
      // Solicitar ao backend para gerar uma nova análise
      const res = await fetch(`${API_URL}/api/db/gerar-analise`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        throw new Error('Erro ao gerar análise');
      }
      
      // Recarregar a análise
      await loadFinancialAnalysis();
      
      analysisButton.textContent = 'Análise Gerada!';
      setTimeout(() => {
        analysisButton.disabled = false;
        analysisButton.textContent = 'Gerar Nova Análise';
      }, 3000);
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      analysisButton.textContent = 'Erro ao gerar análise';
      setTimeout(() => {
        analysisButton.disabled = false;
        analysisButton.textContent = 'Tentar Novamente';
      }, 3000);
    }
  });

  // Função para criar o dropdown de seleção de moedas
function criarDropdownMoedas(indicadores) {
  // Filtrar apenas as moedas
  const moedas = indicadores.filter(i => i.categoria === 'moeda');
  
  if (moedas.length === 0) return;
  
  // Encontrar ou criar o container para o dropdown
  let dropdownContainer = document.getElementById('moeda-dropdown-container');
  
  if (!dropdownContainer) {
    // Se não existir, criar o container
    const chartContainer = document.querySelector('.market-chart-container');
    if (!chartContainer) return;
    
    dropdownContainer = document.createElement('div');
    dropdownContainer.id = 'moeda-dropdown-container';
    dropdownContainer.className = 'moeda-dropdown-container';
    chartContainer.insertBefore(dropdownContainer, chartContainer.firstChild);
  }
  
  // Criar o dropdown
  dropdownContainer.innerHTML = `
    <label for="moeda-select">Selecionar moeda: </label>
    <select id="moeda-select" class="moeda-select">
      ${moedas.map(moeda => `<option value="${moeda.nome}">${moeda.nome}</option>`).join('')}
    </select>
  `;
  
  // Adicionar estilo ao dropdown
  const style = document.createElement('style');
  style.textContent = `
    .moeda-dropdown-container {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .moeda-select {
      margin-left: 10px;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      background-color: white;
      font-size: 14px;
      color: #333;
    }
    .moeda-select:focus {
      outline: none;
      border-color: #0052cc;
      box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.2);
    }
  `;
  document.head.appendChild(style);
  
  // Adicionar evento de mudança
  const select = document.getElementById('moeda-select');
  select.addEventListener('change', function() {
    const moedaSelecionada = this.value;
    const indicadorSelecionado = indicadores.find(i => i.nome === moedaSelecionada);
    if (indicadorSelecionado) {
      criarGraficoMercado(indicadores, indicadorSelecionado);
    }
  });
  
  return select;
}

// Modificar a função loadEconomyData para criar o dropdown
async function loadEconomyData() {
  try {
    // Adicionar placeholders de carregamento para todas as abas
    ['moedas', 'indices', 'juros'].forEach(tab => {
      document.getElementById(`${tab}-content`).innerHTML = `<div class="loading-economy"><div class="loading-placeholder medium"></div><div class="loading-placeholder long"></div><div class="loading-placeholder short"></div></div>`;
    });

    // Buscar indicadores do banco de dados através do backend
    const res = await fetch(`${API_URL}/api/db/indicadores`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar indicadores do banco de dados');
    }

    const data = await res.json();
    const indicadores = data.indicadores || data;

    if (!indicadores || indicadores.length === 0) {
      ['moedas', 'indices', 'juros'].forEach(tab => {
        document.getElementById(`${tab}-content`).innerHTML = "Não há indicadores disponíveis no momento.";
      });
      return;
    }

    // Função segura para verificar se uma string inclui um valor
    function safeIncludes(str, searchValue) {
      if (!str || typeof str !== 'string') return false;
      return str.includes(searchValue);
    }

    // Processar indicadores por categoria
    const categorias = {
      moedas: indicadores.filter(i => 
        i.categoria === 'moeda' || 
        safeIncludes(i.nome, 'Dólar') || 
        safeIncludes(i.nome, 'Euro')
      ),
      indices: indicadores.filter(i => 
        i.categoria === 'indice' || 
        safeIncludes(i.nome, 'IBOV') || 
        safeIncludes(i.nome, 'S&P')
      ),
      juros: indicadores.filter(i => 
        i.categoria === 'juros' || 
        safeIncludes(i.nome, 'SELIC') || 
        safeIncludes(i.nome, 'Taxa')
      )
    };

    // Se o backend não categoriza, processar pela lógica alternativa
    if (categorias.moedas.length === 0 && categorias.indices.length === 0 && categorias.juros.length === 0) {
      indicadores.forEach(indicador => {
        if (!indicador.nome) {
          console.warn('Indicador sem nome encontrado:', indicador);
          return; // Pular este indicador
        }
        
        const nome = indicador.nome.toLowerCase();
        if (nome.includes('dólar') || nome.includes('euro') || nome.includes('libra') || nome.includes('bitcoin')) {
          categorias.moedas.push(indicador);
        } else if (nome.includes('ibovespa') || nome.includes('s&p') || nome.includes('nasdaq')) {
          categorias.indices.push(indicador);
        } else if (nome.includes('selic') || nome.includes('juros') || nome.includes('cdi') || nome.includes('ipca')) {
          categorias.juros.push(indicador);
        } else {
          // Cria um backup caso não identifique
          categorias.indices.push(indicador);
        }
      });
    }

    // Atualizar cada aba
    Object.keys(categorias).forEach(categoria => {
      const tabContent = document.getElementById(`${categoria}-content`);
      tabContent.innerHTML = "";
      
      if (categorias[categoria].length === 0) {
        tabContent.innerHTML = "Sem dados disponíveis para esta categoria.";
        return;
      }
      
      categorias[categoria].forEach(indicador => {
        const item = document.createElement('div');
        item.classList.add('economy-item');
        
        // Determinar tendência com verificação segura
        const variacao = parseFloat(indicador.variacao || 0);
        const tendencia = variacao > 0 ? 'trending-up' : (variacao < 0 ? 'trending-down' : '');
        const tendenciaIcone = tendencia === 'trending-up' ? '↑' : (tendencia === 'trending-down' ? '↓' : '');
        
        item.innerHTML = `
          <div class="economy-name">${indicador.nome || 'Indicador sem nome'}
            ${tendencia ? `<span class="${tendencia}">${tendenciaIcone} ${Math.abs(variacao).toFixed(2)}%</span>` : ''}
          </div>
          <div class="economy-value">${indicador.valor || 'N/A'}</div>
          <div class="economy-date">${indicador.data ? indicador.data : 'Data não disponível'}</div>
        `;
        
        item.addEventListener('click', () => {
          document.getElementById('questionInput').value = `Como está o ${indicador.nome || 'mercado'} hoje?`;
          document.getElementById('questionForm').dispatchEvent(new Event('submit'));
        });
        
        tabContent.appendChild(item);
      });
    });

    // Criar dropdown de moedas e gráfico de mercado
    if (indicadores.length > 0) {
      try {
        // Criar dropdown para seleção de moedas
        const dropdown = criarDropdownMoedas(indicadores);
        
        // Usar a moeda selecionada no dropdown ou a primeira moeda disponível
        let moedaSelecionada;
        if (dropdown && dropdown.value) {
          moedaSelecionada = indicadores.find(i => i.nome === dropdown.value);
        }
        
        // Criar gráfico com a moeda selecionada
        criarGraficoMercado(indicadores, moedaSelecionada);
      } catch (error) {
        console.error("Erro ao criar gráfico:", error);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar indicadores econômicos", error);
    ['moedas', 'indices', 'juros'].forEach(tab => {
      document.getElementById(`${tab}-content`).innerHTML = "Não foi possível carregar os indicadores.";
    });
  }
}

// Modificar a função criarGraficoMercado para aceitar um indicador específico
function criarGraficoMercado(indicadores, indicadorEspecifico = null) {
  // Verificar se Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não está disponível');
    return;
  }

  // Usar o indicador específico se fornecido, caso contrário, encontrar um adequado
  let indicadorPrincipal = indicadorEspecifico;

  if (!indicadorPrincipal) {
    // Encontrar indicador principal (preferencialmente Ibovespa, mas pode ser Dólar ou Bitcoin)
    indicadorPrincipal = indicadores.find(i =>
      i.nome && (
        i.nome.toLowerCase().includes('ibovespa') ||
        i.nome.toLowerCase().includes('bovespa')
      )
    );

    // Se não encontrar Ibovespa, tentar encontrar Dólar
    if (!indicadorPrincipal) {
      indicadorPrincipal = indicadores.find(i =>
        i.nome && (
          i.nome.toLowerCase().includes('dólar') ||
          i.nome.toLowerCase().includes('dolar') ||
          i.nome.toLowerCase().includes('usd')
        )
      );
    }

    // Se não encontrar Dólar, tentar encontrar Bitcoin
    if (!indicadorPrincipal) {
      indicadorPrincipal = indicadores.find(i =>
        i.nome && (
          i.nome.toLowerCase().includes('bitcoin') ||
          i.nome.toLowerCase().includes('btc')
        )
      );
    }

    // Se ainda não encontrar, usar o primeiro disponível com nome
    if (!indicadorPrincipal) {
      indicadorPrincipal = indicadores.find(i => i.nome && i.nome !== 'Moeda sem nome') || {
        nome: 'Indicador',
        valor: '100'
      };
    }
  }

  console.log("Indicador selecionado para o gráfico:", indicadorPrincipal);

  // Gerar dados simulados para os últimos 7 dias
  const hoje = new Date();
  const labels = [];
  const dados = [];

  // Gerar datas e valores simulados dos últimos 7 dias
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    labels.push(data.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}));
    
    // Gerar valor baseado no valor atual do indicador + variação aleatória
    let valorBase = 100; // Valor padrão
    
    try {
      if (indicadorPrincipal.valor) {
        // Tentar extrair um número do valor
        const valorString = indicadorPrincipal.valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
        const valorNumerico = parseFloat(valorString);
        if (!isNaN(valorNumerico)) {
          valorBase = valorNumerico;
        }
      }
    } catch (error) {
      console.warn('Erro ao processar valor do indicador para o gráfico:', error);
    }
    
    // Simular variação de até 2%
    const variacao = (Math.random() * 4 - 2) / 100;
    dados.push(valorBase * (1 + variacao * i));
  }

  // Criar o gráfico
  const ctx = document.getElementById('marketChart');
  if (!ctx) {
    console.error('Elemento canvas para o gráfico não encontrado');
    return;
  }
  
  // Destruir gráfico existente se houver
  if (window.marketChart && typeof window.marketChart.destroy === 'function') {
    window.marketChart.destroy();
  }

  window.marketChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: indicadorPrincipal.nome || 'Indicador',
        data: dados,
        backgroundColor: 'rgba(0, 82, 204, 0.1)',
        borderColor: '#0052cc',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#0052cc',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#666',
            font: {
              size: 10
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#666',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(0);
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6
        }
      }
    }
  });
}

}

