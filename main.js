const socket = io();

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const toggleSoundButton = document.getElementById("toggle-sound");
const input = document.getElementById("m");

// Estado da conversa: "faq", "waitingName", "waitingSector", "waitingMatricula" ou "normal"
let state = "faq";
// Dados para solicitar atendimento
let attendantDetails = { fullName: "", sector: "", matricula: "" };

let soundEnabled = true; // Som ativado por padrão

// Função para atualizar o scroll do contêiner (".chat-main")
// Essa função usa requestAnimationFrame para garantir que o DOM esteja atualizado antes de rolar.
function updateScroll() {
  const chatMain = document.querySelector(".chat-main");
  if (chatMain) {
    requestAnimationFrame(() => {
      chatMain.scrollTop = chatMain.scrollHeight;
    });
  }
}

// Função para adicionar mensagem simples (para sistema, FAQ ou envio próprio)
function appendMessage(content, type = "message") {
  const li = document.createElement("li");
  li.textContent = content;
  li.classList.add(type);
  messagesList.appendChild(li);
  
  // Limpa o campo de entrada
  input.value = "";
  
  updateScroll();
}

// Função para adicionar mensagem de chat com avatar (para usuário ou atendente)
function appendChatMessage(message, sender) {
  const li = document.createElement("li");
  li.classList.add("message", sender);
  
  const avatar = document.createElement("img");
  avatar.src = sender === "attendant" ? "attendant-avatar.png" : "user-avatar.png";
  avatar.classList.add("avatar");
  
  const textElement = document.createElement("span");
  textElement.textContent = message;
  textElement.classList.add("text");
  
  // Se for atendente, o avatar vem antes do texto; se for usuário, o texto vem primeiro.
  if (sender === "attendant") {
    li.append(avatar, textElement);
  } else {
    li.append(textElement, avatar);
  }
  
  messagesList.appendChild(li);
  updateScroll();
}

// Controle do som de notificação
toggleSoundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundButton.textContent = soundEnabled ? "Som: Ligado" : "Som: Mutado";
});

// Envia indicador de "digitando" se o estado for "normal"
input.addEventListener("input", () => {
  if (state === "normal") {
    socket.emit("typing", "Atendente");
  }
});

// Evento de envio de mensagem pelo formulário (para todas as situações)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  
  // Aqui, independentemente do estado, a mensagem é tratada como do usuário
  appendChatMessage(message, "user");
  socket.emit("chat message", { message, sender: "user" });
  
  // O campo é limpo dentro da função appendMessage/appendChatMessage
});

// Ao receber mensagem de chat (via socket), exibe a mensagem e atualiza o scroll
socket.on("chat message", (data) => {
  // Cria a mensagem com avatar de acordo com o remetente
  const li = document.createElement("li");
  li.classList.add("message", data.sender);
  
  const avatar = document.createElement("img");
  avatar.src = data.sender === "user" ? "user-avatar.png" : "attendant-avatar.png";
  avatar.classList.add("avatar");
  
  const textElement = document.createElement("span");
  textElement.textContent = data.message;
  textElement.classList.add("text");
  
  if (data.sender === "user") {
    li.append(textElement, avatar);
  } else {
    li.append(avatar, textElement);
  }
  
  messagesList.appendChild(li);
  updateScroll();
});

// Ao receber mensagem do sistema, exibe a mensagem e atualiza o scroll
socket.on("system message", (msg) => {
  appendMessage("Sistema: " + msg, "system");
});

// (Opcional) Indicador de "digitando"
socket.on("typing", (data) => {
  // Implemente um indicador visual se necessário.
});
