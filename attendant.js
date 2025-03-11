const socket = io();
socket.emit("attendant join");

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const endServiceButton = document.getElementById("end-service");
const toggleSoundButton = document.getElementById("toggle-sound");

const notificationIcon = document.querySelector(".notification-icon");
const notificationList = document.getElementById("notification-list");
const notificationCount = document.getElementById("notification-count");
const queueList = document.getElementById("queue-list");

let soundEnabled = true;
let isAttending = false; // 🔹 Controla se o atendente está em atendimento
let currentUser = null; // 🔹 Armazena o ID do usuário conectado

// 🔹 Recupera sessão se a página for recarregada
socket.on("resume chat", (userId) => {
  currentUser = userId;
  isAttending = true;
  appendChatMessage(`Bot: Você retomou o atendimento com o usuário ${userId}`, "system");
});

// 🔹 Alterna exibição da fila ao clicar no sino
function toggleQueue() {
  notificationList.style.display = notificationList.style.display === "block" ? "none" : "block";
}

// 🔊 Toca som quando um novo usuário entra na fila
function playNotificationSound() {
  if (soundEnabled) {
    const audio = new Audio("notification.mp3");
    audio.play().catch((err) => console.error("Erro ao reproduzir som:", err));
  }
}

// 🔹 Adiciona mensagens ao chat
function appendChatMessage(message, sender) {
  const messageElement = document.createElement("li");
  messageElement.classList.add("message", sender);

  const avatar = document.createElement("img");
  avatar.src = sender === "attendant" ? "attendant-avatar.png" : "user-avatar.png";
  avatar.classList.add("avatar");

  const textElement = document.createElement("span");
  textElement.textContent = message;
  textElement.classList.add("text");

  sender === "attendant"
    ? messageElement.append(avatar, textElement)
    : messageElement.append(textElement, avatar);

  messagesList.appendChild(messageElement);
  updateScroll();
}

// 🔹 Atualiza scroll do chat
function updateScroll() {
  requestAnimationFrame(() => {
    document.querySelector(".chat-main").scrollTop = messagesList.scrollHeight;
  });
}

// 🔹 Controle do som
toggleSoundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundButton.textContent = soundEnabled ? "Som: Ligado" : "Som: Mutado";
});

// 🔹 Enviar mensagem do atendente
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("m");
  const message = input.value.trim();
  if (!message) return;

  appendChatMessage(message, "attendant");
  socket.emit("chat message", message);
  input.value = "";
});

// 🔹 Recebendo mensagens do usuário
socket.on("chat message", (data) => {
  appendChatMessage(data.message, "user");
});

// 🔹 Exibir mensagens do sistema
socket.on("system message", (msg) => {
  appendChatMessage("Sistema: " + msg, "system");
});

// 🔹 Indicador de digitação
socket.on("typing", (data) => {
  typingIndicator.style.display = "block";
  typingIndicator.textContent = data + " está digitando...";
  setTimeout(() => {
    typingIndicator.style.display = "none";
  }, 2000);
});

// 🔹 Enviar indicador de digitação
document.getElementById("m").addEventListener("input", () => {
  socket.emit("typing", "Usuário");
});

// 🔹 Finalizar atendimento
endServiceButton.addEventListener("click", () => {
  if (!isAttending) {
    alert("Você não está atendendo nenhum usuário.");
    return;
  }

  socket.emit("end service");
  isAttending = false; // 🔹 Libera o atendente para pegar outro usuário
  currentUser = null;
  messagesList.innerHTML = ""; // 🔹 Apaga o chat ao finalizar o atendimento
  appendChatMessage("🔹 Atendimento finalizado. Aguardando próximo usuário...", "system");
  alert("Atendimento finalizado. Você pode aceitar outro usuário.");
});

// 🔹 Atualiza a fila de espera em tempo real
socket.on("updateQueue", (waitingQueue) => {
  queueList.innerHTML = ""; // Limpa a lista
  notificationCount.textContent = waitingQueue.length;
  notificationCount.style.display = waitingQueue.length > 0 ? "block" : "none";

  if (waitingQueue.length === 0) {
    queueList.innerHTML = "<li>Ninguém na fila</li>";
    return;
  }

  waitingQueue.forEach((user) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${user.fullName || "Usuário"}</strong> - ${user.sector || "Setor Desconhecido"}<br>
      Matrícula: ${user.matricula || "N/A"}
      <button class="btn-atender" onclick="acceptUser('${user.id}')">Atender</button>`;
    queueList.appendChild(li);
  });

  playNotificationSound();
});

// 🔹 Atendente aceita um usuário da fila
function acceptUser(userId) {
  if (isAttending) {
    alert("⚠️ Você já está conectado a um usuário. Finalize o atendimento antes de aceitar outro.");
    return;
  }

  socket.emit("acceptUser", userId);
  isAttending = true; // 🔹 Define que o atendente agora está ocupado
  currentUser = userId;

  messagesList.innerHTML = ""; // 🔹 Apaga o chat ao iniciar um novo atendimento
  appendChatMessage("🔹 Novo atendimento iniciado.", "system");
}

// 🔹 Resposta quando o usuário já foi atendido
socket.on("userAlreadyAttended", () => {
  alert("Usuário já foi atendido por outro atendente.");
  isAttending = false; // 🔹 Libera o atendente caso o usuário já tenha sido atendido
});

// 🔹 Se o usuário se desconectar, liberar o atendente
socket.on("userDisconnected", () => {
  appendChatMessage("⚠️ O usuário se desconectou. Atendimento encerrado.", "system");
  isAttending = false;
  currentUser = null;
  messagesList.innerHTML = ""; // 🔹 Apaga o chat após desconexão do usuário
});
