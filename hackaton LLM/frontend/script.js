const API_URL = "http://localhost:8000"; // Altere se o backend estiver hospedado em outro local

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

// Processar envio de perguntas
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
    const res = await fetch(`${API_URL}/perguntar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pergunta })
    });
    
    // Remover indicador de digitação
    typingIndicator.remove();
    
    if (!res.ok) {
      throw new Error('Erro na resposta do servidor');
    }
    
    const data = await res.json();
    
    // Adicionar resposta do bot
    addMessage(data.resposta);
    
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

// Carregar últimas notícias
async function loadNews() {
  try {
    // Adicionar placeholders de carregamento
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = `
      <div class="loading-news">
        <div class="loading-placeholder medium"></div>
        <div class="loading-placeholder short"></div>
        <div class="loading-placeholder long"></div>
        <div class="loading-placeholder medium"></div>
        <div class="loading-placeholder short"></div>
      </div>
    `;
    
    const res = await fetch(`${API_URL}/noticias`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar notícias');
    }
    
    const data = await res.json();
    newsList.innerHTML = "";
    
    data.noticias.forEach(noticia => {
      const newsItem = document.createElement('div');
      newsItem.classList.add('news-item');
      newsItem.innerHTML = `
        <div class="news-title">${noticia.titulo}</div>
        <div class="news-date">${noticia.data}</div>
      `;
      newsItem.addEventListener('click', () => {
        document.getElementById('questionInput').value = `Conte-me mais sobre: ${noticia.titulo}`;
        document.getElementById('questionForm').dispatchEvent(new Event('submit'));
      });
      newsList.appendChild(newsItem);
    });
  } catch (error) {
    console.error("Erro ao carregar notícias", error);
    document.getElementById('newsList').innerHTML = "Não foi possível carregar as notícias.";
  }
}

// Carregar dados econômicos para diferentes abas
async function loadEconomyData() {
  try {
    // Adicionar placeholders de carregamento para todas as abas
    ['moedas', 'indices', 'juros'].forEach(tab => {
      document.getElementById(`${tab}-content`).innerHTML = `
        <div class="loading-economy">
          <div class="loading-placeholder medium"></div>
          <div class="loading-placeholder long"></div>
          <div class="loading-placeholder short"></div>
        </div>
      `;
    });
    
    const res = await fetch(`${API_URL}/economia`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar dados econômicos');
    }
    
    const data = await res.json();
    
    // Processar indicadores por categoria
    const categorias = {
      moedas: data.indicadores.filter(i => i.categoria === 'moeda' || i.nome.includes('Dólar') || i.nome.includes('Euro')),
      indices: data.indicadores.filter(i => i.categoria === 'indice' || i.nome.includes('IBOV') || i.nome.includes('S&P')),
      juros: data.indicadores.filter(i => i.categoria === 'juros' || i.nome.includes('SELIC') || i.nome.includes('Taxa'))
    };
    
    // Se o backend não categoriza, processar pela lógica alternativa
    if (categorias.moedas.length === 0 && categorias.indices.length === 0 && categorias.juros.length === 0) {
      data.indicadores.forEach(indicador => {
        const nome = indicador.nome.toLowerCase();
        if (nome.includes('dólar') || nome.includes('euro') || nome.includes('libra')) {
          categorias.moedas.push(indicador);
        } else if (nome.includes('ibovespa') || nome.includes('s&p') || nome.includes('nasdaq')) {
          categorias.indices.push(indicador);
        } else if (nome.includes('selic') || nome.includes('juros') || nome.includes('cdi')) {
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
        
        // Determinar tendência 
        const tendencia = indicador.variacao > 0 ? 'trending-up' : (indicador.variacao < 0 ? 'trending-down' : '');
        const tendenciaIcone = tendencia === 'trending-up' ? '↑' : (tendencia === 'trending-down' ? '↓' : '');
        
        item.innerHTML = `
          <div class="economy-name">
            ${indicador.nome}
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
    
    // Exemplo de gráfico de mercado
    if (data.indicadores && data.indicadores.length > 0) {
      criarGraficoMercado(data.indicadores);
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
    let valorBase = parseFloat(indicadorPrincipal.valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(valorBase)) valorBase = 100; // Valor padrão se não conseguir extrair
    
    // Simular variação de até 2%
    const variacao = (Math.random() * 4 - 2) / 100;
    dados.push(valorBase * (1 + variacao * i));
  }
  
  // Criar o gráfico
  const ctx = document.getElementById('marketChart').getContext('2d');
  
  // Destruir gráfico existente se houver
  if (window.marketChart) {
    window.marketChart.destroy();
  }
  
  window.marketChart = new Chart(ctx, {
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

// Inicializar dados ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  loadEconomyData();
  
  // Ativar a primeira aba por padrão
  document.querySelector('.card-tab').click();
});
