const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos e configurar CORS
app.use(express.static(__dirname));
app.use(cors());

// Configurar body-parser para processar formulários
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessões (utilize uma chave segura em produção)
app.use(session({
  secret: 'minha_chave_super_secreta', // Substitua por uma chave segura e não vazia
  resave: false,
  saveUninitialized: true
}));


// Middleware para verificar autenticação do atendente
function checkAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Rota principal (interface do usuário)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Página de login para atendentes
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/attendant-login.html");
});

// Processa o login do atendente (credenciais hardcoded para exemplo)
const db = require('./db'); // Certifique-se de que o db.js exporta a conexão

// Processa o login do atendente consultando o banco de dados
app.post("/login", (req, res) => {
  const { username, senha } = req.body;
  
  // Consulta o banco para verificar as credenciais
  db.query(
    'SELECT * FROM usuario WHERE username = ? AND senha = ?',
    [username, senha],
    (err, results) => {
      if (err) {
        console.error("Erro no banco de dados:", err);
        return res.send("Erro no banco de dados.");
      }
      
      if (results.length > 0) {
        req.session.authenticated = true;
        res.redirect("/attendant");
      } else {
        res.send("Usuário ou senha inválidos.");
      }
    }
  );
});


// Rota protegida para a interface do atendente
app.get("/attendant", checkAuth, (req, res) => {
  res.sendFile(__dirname + "/attendant.html");
});

// Rota para logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// **Armazena fila de espera e atendimentos ativos**
let waitingQueue = [];
let activeSessions = {}; // Salva atendentes conectados e seus usuários
let userInfoMap = {};   // Armazena informações dos usuários em atendimento

io.on("connection", (socket) => {
  console.log("Novo socket conectado: " + socket.id);

  // Quando um atendente entra
  socket.on("attendant join", () => {
    console.log(`Atendente conectado: ${socket.id}`);

    // Se o atendente já estava em atendimento, retoma a conversa automaticamente
    if (activeSessions[socket.id]) {
      const userId = activeSessions[socket.id];
      socket.emit("resume chat", userId);
      io.to(userId).emit("system message", "O atendente retornou à conversa.");
      console.log(`Atendente ${socket.id} retomou o atendimento com ${userId}`);
    } else {
      socket.emit("updateQueue", waitingQueue); // Atualiza a fila para o atendente
    }
  });

  // Usuário solicita atendimento
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

  // Atendente aceita um usuário
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

    // Remove o usuário da fila e registra o atendimento ativo
    const userInfo = waitingQueue.splice(userIndex, 1)[0];
    activeSessions[socket.id] = userId;
    activeSessions[userId] = socket.id;

    io.emit("updateQueue", waitingQueue); // Atualiza fila globalmente

    // Notifica ambos sobre a conexão
    socket.emit("system message", `Você está atendendo ${userInfo.fullName || "Usuário"}.`);
    userSocket.emit("system message", "Você está conectado a um atendente.");
  });

  // Encaminhar mensagens
  socket.on("chat message", (message) => {
    const targetSocketId = activeSessions[socket.id];
    if (targetSocketId) {
      io.to(targetSocketId).emit("chat message", { message });
    }
  });

  // Finalizar atendimento
  socket.on("end service", () => {
    const userId = activeSessions[socket.id];

    if (userId) {
      io.to(userId).emit("system message", "O atendente finalizou o atendimento.");
      delete activeSessions[socket.id];
      delete activeSessions[userId];
      delete userInfoMap[userId];

      io.emit("updateQueue", waitingQueue); // Atualiza fila globalmente
      socket.emit("clear chat"); // Notifica para limpar o chat do atendente
      console.log(`Atendimento entre ${socket.id} e ${userId} finalizado.`);
    }
  });

  // Desconectar usuário ou atendente
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
