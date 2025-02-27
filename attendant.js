const socket = io();
socket.emit("attendant join");

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const endServiceButton = document.getElementById("end-service");
const toggleSoundButton = document.getElementById("toggle-sound");

let soundEnabled = true;

function appendMessage(content, type = "message") {
  const li = document.createElement("li");
  li.textContent = content;
  li.classList.add(type);
  messagesList.appendChild(li);
  updateScroll();
}

function updateScroll() {
  const container = document.querySelector(".chat-main");
  // Aguarda o layout atualizar e então rola para o final
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("m");
  const message = input.value.trim();
  if (!message) return;

  // Criando o elemento da mensagem
  const messages = document.getElementById("messages");
  const messageElement = document.createElement("li");
  messageElement.classList.add("message", "attendant");

  // Criar avatar do atendente
  const avatar = document.createElement("img");
  avatar.src = "attendant-avatar.png";  // Certifique-se de que este arquivo existe na pasta do projeto
  avatar.classList.add("avatar");

  // Criar o texto da mensagem
  const textElement = document.createElement("span");
  textElement.textContent = message;
  textElement.classList.add("text");

  // Estruturando a mensagem no HTML
  messageElement.appendChild(avatar);
  messageElement.appendChild(textElement);

  // Adicionando ao chat
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;

  // Enviar a mensagem para o socket
  socket.emit("chat message", message);
  input.value = "";
});

const inputField = document.getElementById("m");
inputField.addEventListener("input", () => {
  socket.emit("typing", "Usuário");
});

socket.on("chat message", (data) => {
  const messages = document.getElementById("messages");
  const messageElement = document.createElement("li");

  // Criar avatar
  const avatar = document.createElement("img");
  avatar.src = data.sender === "user" ? "attendant-avatar.png" : "user-avatar.png";
  avatar.classList.add("avatar");

  // Criar balão de mensagem
  const textElement = document.createElement("span");
  textElement.textContent = data.message;
  textElement.classList.add("text");

  // Definir classes CSS
  messageElement.classList.add("message", data.sender);

  // Estruturar corretamente com avatar e texto
  if (data.sender === "user") {
    messageElement.appendChild(textElement);
    messageElement.appendChild(avatar);
  } else {
    messageElement.appendChild(avatar);
    messageElement.appendChild(textElement);
  }

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});





socket.on("system message", (msg) => {
  appendMessage("Sistema: " + msg, "system");
});

socket.on("typing", (data) => {
  typingIndicator.style.display = "block";
  typingIndicator.textContent = data + " está digitando...";
  setTimeout(() => {
    typingIndicator.style.display = "none";
  }, 2000);
});

endServiceButton.addEventListener("click", () => {
  socket.emit("end service");
});
