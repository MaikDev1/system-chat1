const socket = io();

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const toggleSoundButton = document.getElementById("toggle-sound");
const input = document.getElementById("m");

// Estado da conversa: "faq", "waitingName", "waitingSector", "waitingMatricula", ou "normal"
let state = "faq";
// Dados para solicitar atendimento
let attendantDetails = { fullName: "", sector: "", matricula: "" };

let soundEnabled = true; // Som ativado por padrão


// Função para adicionar mensagem e garantir auto-scroll
function appendMessage(content, type = "message") {
  const li = document.createElement("li");
  li.textContent = content;
  li.classList.add(type);
  messagesList.appendChild(li);

  // Cria ou reposiciona o elemento dummy para forçar o scroll até o final
  let dummy = document.getElementById("dummy");
  if (!dummy) {
    dummy = document.createElement("li");
    dummy.id = "dummy";
    messagesList.appendChild(dummy);
  }

  // Agora LIMPA o campo de entrada
  input.value = "";

  // Atualiza o scroll após a mudança
  updateScroll();
}

// Função para atualizar o scroll do contêiner (elemento .chat-main)
// Garantindo que o scroll sempre vá para o final após adicionar uma nova mensagem
function updateScroll() {
  const chatMain = document.querySelector(".chat-main");

  // Isso garante que o chat role até o fundo
  chatMain.scrollTop = chatMain.scrollHeight;
}


function playSound() {
  if (!soundEnabled) return;
  const audio = new Audio("notification.mp3");
  audio.play().catch((err) => console.error("Erro ao reproduzir som:", err));
}

toggleSoundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundButton.textContent = soundEnabled ? "Som: Ligado" : "Som: Mutado";
});

// Envia indicador de "digitando" no modo normal
const inputField = document.getElementById("m");
inputField.addEventListener("input", () => {
  if (state === "normal") {
    socket.emit("typing", "Atendente");
  }
});

socket.on("chat message", (data) => {
  const messages = document.getElementById("messages");
  const messageElement = document.createElement("li");

  // Criar avatar
  const avatar = document.createElement("img");
  avatar.src = data.sender === "user" ? "user-avatar.png" : "attendant-avatar.png";
  avatar.classList.add("avatar");

  // Criar balão de mensagem
  const textElement = document.createElement("span");
  textElement.textContent = data.message;
  textElement.classList.add("text");

  // Definir classes CSS
  messageElement.classList.add("message", data.sender);

  // Estruturar corretamente com avatar e texto
  if (data.sender === "user") {
    messageElement.appendChild(textElement); // Texto antes
    messageElement.appendChild(avatar); // Avatar depois
  } else {
    messageElement.appendChild(avatar); // Avatar antes
    messageElement.appendChild(textElement); // Texto depois
  }

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
  
});

socket.on("system message", (msg) => {
  appendMessage("Sistema: " + msg, "system");
});

// (Opcional) Indicador de "digitando"
socket.on("typing", (data) => {
  // Aqui você pode implementar um indicador visual, se necessário.
});  