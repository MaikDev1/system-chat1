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

// Comunicação via WebSocket (Socket.io)
let availableAttendants = [];
let waitingUsers = [];
let pairings = {};
let userInfoMap = {}; // Armazena as informações coletadas dos usuários

io.on("connection", (socket) => {
  console.log("Novo socket conectado: " + socket.id);

  socket.on("attendant join", () => {
    console.log("Atendente conectado: " + socket.id);
    availableAttendants.push(socket);
    
    if (waitingUsers.length > 0) {
      const userSocket = waitingUsers.shift();
      pairSockets(userSocket, socket);
    }
  });

  socket.on("request attendant", (userInfo) => {
    console.log(`Usuário ${socket.id} solicitou atendimento.`);
    
    userInfoMap[socket.id] = userInfo; // Armazena as informações coletadas
    
    if (availableAttendants.length > 0) {
      const attendantSocket = availableAttendants.shift();
      pairSockets(socket, attendantSocket);
    } else {
      waitingUsers.push(socket);
      socket.emit("system message", "Aguarde, um atendente estará disponível em breve.");
    }
  });

  function pairSockets(userSocket, attendantSocket) {
    if (!userSocket || !attendantSocket) return;
    
    pairings[userSocket.id] = attendantSocket.id;
    pairings[attendantSocket.id] = userSocket.id;

    // Recupera as informações do usuário e envia ao atendente
    const userInfo = userInfoMap[userSocket.id] || {};
    attendantSocket.emit("system message", `Usuário conectado.\nNome: ${userInfo.fullName || "N/A"}\nSetor: ${userInfo.sector || "N/A"}\nMatrícula: ${userInfo.matricula || "N/A"}`);

    userSocket.emit("system message", "Você está conectado a um atendente.");
    attendantSocket.emit("system message", "Você está conectado a um usuário.");
  }

  socket.on("chat message", (message) => {
    const targetSocketId = pairings[socket.id];
    if (targetSocketId) {
      io.to(targetSocketId).emit("chat message", { message });
    }
  });

  socket.on("disconnect", () => {
    availableAttendants = availableAttendants.filter((s) => s.id !== socket.id);
    waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);
    delete pairings[socket.id];
    delete userInfoMap[socket.id]; // Remove as informações do usuário ao desconectar
    console.log("Socket desconectado: " + socket.id);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
