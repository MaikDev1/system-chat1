const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname)); // Servir arquivos estáticos
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/attendant", (req, res) => {
  res.sendFile(__dirname + "/attendant.html");
});

// **Armazena fila de espera e atendimentos ativos**
let waitingQueue = [];
let activeSessions = {}; // 🔹 Salva atendentes conectados e seus usuários
let userInfoMap = {}; // 🔹 Armazena informações dos usuários em atendimento

io.on("connection", (socket) => {
  console.log("Novo socket conectado: " + socket.id);

  // **Quando um atendente entra**
  socket.on("attendant join", () => {
    console.log(`Atendente conectado: ${socket.id}`);

    // 🔹 Se o atendente já estava em atendimento, ele retoma automaticamente
    if (activeSessions[socket.id]) {
      const userId = activeSessions[socket.id];
      socket.emit("resume chat", userId);
      io.to(userId).emit("system message", "O atendente retornou à conversa.");
      console.log(`Atendente ${socket.id} retomou o atendimento com ${userId}`);
    } else {
      socket.emit("updateQueue", waitingQueue); // Atualiza fila para o atendente
    }
  });

  // **Usuário solicita atendimento**
  socket.on("request attendant", (userInfo) => {
    console.log(`Usuário ${socket.id} solicitou atendimento.`);

    if (activeSessions[socket.id]) {
      socket.emit("system message", "Você já está em atendimento.");
      return;
    }

    userInfo.id = socket.id;
    userInfoMap[socket.id] = userInfo;
    waitingQueue.push(userInfo);
    
    io.emit("updateQueue", waitingQueue); // Atualiza fila para os atendentes
    socket.emit("system message", "Aguarde, um atendente estará disponível em breve.");
  });

  // **Atendente aceita um usuário**
  socket.on("acceptUser", (userId) => {
    const userIndex = waitingQueue.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      socket.emit("userAlreadyAttended"); // Usuário já foi atendido
      return;
    }

    const userSocket = io.sockets.sockets.get(userId);
    if (!userSocket) {
      socket.emit("userAlreadyAttended"); // Usuário desconectado
      return;
    }

    // 🔹 Remove usuário da fila e registra o atendimento ativo
    const userInfo = waitingQueue.splice(userIndex, 1)[0];
    activeSessions[socket.id] = userId;
    activeSessions[userId] = socket.id;

    io.emit("updateQueue", waitingQueue); // Atualiza fila globalmente

    // 🔹 Notifica ambos sobre a conexão
    socket.emit("system message", `Você está atendendo ${userInfo.fullName || "Usuário"}.`);
    userSocket.emit("system message", "Você está conectado a um atendente.");
  });

  // **Encaminhar mensagens**
  socket.on("chat message", (message) => {
    const targetSocketId = activeSessions[socket.id];
    if (targetSocketId) {
      io.to(targetSocketId).emit("chat message", { message });
    }
  });

  // **Finalizar atendimento**
  socket.on("end service", () => {
    const userId = activeSessions[socket.id];

    if (userId) {
      io.to(userId).emit("system message", "O atendente finalizou o atendimento.");
      delete activeSessions[socket.id];
      delete activeSessions[userId];
      delete userInfoMap[userId];

      io.emit("updateQueue", waitingQueue); // Atualiza fila globalmente
      socket.emit("clear chat"); // 🔹 Notifica para limpar o chat do atendente
      console.log(`Atendimento entre ${socket.id} e ${userId} finalizado.`);
    }
  });

  // **Desconectar usuário ou atendente**
  socket.on("disconnect", () => {
    console.log(`Socket desconectado: ${socket.id}`);

    if (activeSessions[socket.id]) {
      const pairedUser = activeSessions[socket.id];
      io.to(pairedUser).emit("system message", "O atendente foi desconectado.");
      delete activeSessions[pairedUser];
      delete activeSessions[socket.id];
    }

    waitingQueue = waitingQueue.filter((user) => user.id !== socket.id);
    delete userInfoMap[socket.id];

    io.emit("updateQueue", waitingQueue);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
