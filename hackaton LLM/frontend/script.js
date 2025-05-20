// Configuração da API
const API_URL = "http://localhost:3000";

// Utilitários
const getElement = (id) => document.getElementById(id);
const setInnerHTML = (element, html) => { if(element) element.innerHTML = html; };
const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');

// Função para exibir mensagens de erro
const showError = (message) => `<p class="erro">${message}</p>`;

// Função para fetch com tratamento de erro
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Data atual no header
function setCurrentDate() {
  const now = new Date();
  const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const date = now.toLocaleDateString('pt-BR');
  getElement('currentDate').textContent = `${day}, ${date}`;
}

// Mensagem "digitando" animada
function typingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat__message chat__message--bot typing-indicator';
  typingDiv.innerHTML = `<span></span><span></span><span></span>`;
  return typingDiv;
}

// Append message no chat
function appendMessage(message, isUser = false) {
  const chatMessages = getElement('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat__message ' + (isUser ? 'chat__message--user' : 'chat__message--bot');
  msgDiv.textContent = message;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Função para envio da pergunta ao backend
async function enviarPergunta(pergunta) {
  // Referência ao container de mensagens
  const chatMessages = getElement('chat-messages');
  
  // Adicionar mensagem do usuário
  appendMessage(pergunta, true);
  
  // Adicionar indicador de digitação
  const typingDiv = typingIndicator();
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  try {
    // Log para debug
    console.log("Enviando para API:", JSON.stringify({
      prompt: pergunta,
      model: "gpt-3.5-turbo",
      maxTokens: 500
    }));
    
    // Fazer requisição diretamente, sem usar a função fetchData
    const response = await fetch(`${API_URL}/api/consulta`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: pergunta,
        model: "gpt-3.5-turbo",
        maxTokens: 500
      })
    });
    
    // Log para debug
    console.log("Status da resposta:", response.status);
    
    // Remover indicador de digitação
    if (typingDiv.parentNode) {
      chatMessages.removeChild(typingDiv);
    }
    
    // Verificar status da resposta
    if (!response.ok) {
      console.error("Erro na API:", response.status);
      appendMessage(`Erro ao processar sua pergunta. Status: ${response.status}`);
      return;
    }
    
    // Converter resposta para JSON
    const data = await response.json();
    console.log("Dados recebidos:", data);
    
    // Verificar se a resposta contém os dados esperados
    if (data && data.success && data.response) {
      appendMessage(data.response);
    } else {
      appendMessage("Resposta recebida, mas em formato inesperado.");
      console.error("Formato inesperado:", data);
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    
    // Remover indicador de digitação se ainda existir
    if (typingDiv.parentNode) {
      chatMessages.removeChild(typingDiv);
    }
    
    appendMessage("Erro técnico ao processar sua pergunta. Verifique o console para detalhes.");
  }
}

// Função para gerar imagem IA
async function gerarImagemIA(prompt) {
  const resultadoDiv = getElement("resultado-imagem");
  resultadoDiv.innerHTML = `<p>Gerando imagem...</p>`;
  
  try {
    const response = await fetchData(`${API_URL}/api/gerar-imagem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    
    console.log("Resposta da API:", response);
    
    if (!response || !response.success) {
      resultadoDiv.innerHTML = `<p class="erro">Não foi possível gerar a imagem. Tente novamente.</p>`;
      return;
    }
    
    resultadoDiv.innerHTML = `
      <div class="imagem-gerada">
        <img src="${response.imageUrl}" alt="Imagem gerada para: ${prompt}" />
        <p class="descricao-imagem">Prompt: ${prompt}</p>
      </div>`;
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    resultadoDiv.innerHTML = `<p class="erro">Erro ao gerar imagem: ${error.message}</p>`;
  }
}


// Setup eventos DOM
function setupEventListeners() {
  // Enviar pergunta via form
  const form = getElement("questionForm");
  const inputPergunta = getElement("questionInput");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pergunta = inputPergunta.value.trim();
    if (!pergunta) return;
    inputPergunta.value = "";
    await enviarPergunta(pergunta);
  });

  // Gerar imagem ao clicar botão
  const btnGerarImagem = getElement("gerarImagemBtn");
  const inputImagem = getElement("prompt-imagem");

  btnGerarImagem.addEventListener("click", async () => {
    const prompt = inputImagem.value.trim();
    if (!prompt) {
      alert("Por favor, descreva a imagem que deseja gerar.");
      return;
    }
    await gerarImagemIA(prompt);
  });
}

// Inicialização
function init() {
  setCurrentDate();
  setupEventListeners();
}

window.onload = init;
