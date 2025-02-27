// Exibe a mensagem inicial do FAQ com as opções
document.addEventListener("DOMContentLoaded", () => {
    appendMessage(
      "Bom dia, aqui estão nossos serviços para você tirar dúvidas:",
      "system"
    );
    appendMessage("1 - Como faço para redefinir minha senha?", "faq");
    appendMessage("2 - Meu computador está muito lento.", "faq");
    appendMessage("3 - Falar com Atendente", "faq");
    appendMessage("4 - Como posso atualizar meu endereço?", "faq");
    appendMessage("5 - O que fazer se minha conta foi bloqueada?", "faq");
    appendMessage("6 - Como posso entrar em contato com o suporte?", "faq");
    appendMessage("7 - Como posso alterar minha senha?", "faq");
    appendMessage("8 - Como faço para recuperar minha conta?", "faq");
    appendMessage("9 - Como alterar meu e-mail cadastrado?", "faq");
    appendMessage("10 - Como posso cancelar minha conta?", "faq");
  });
  
  // Processamento do envio do formulário
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("m");
    const message = input.value.trim();
    if (!message) return;
  
    // Se o usuário estiver no modo FAQ ou coleta de dados
    if (state !== "normal") {
      appendMessage("Você: " + message, "user");
  
      if (state === "faq") {
        if (message === "1") {
          appendMessage("Bot: " + faqOptions["1"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "2") {
          appendMessage("Bot: " + faqOptions["2"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "3" || message.toLowerCase() === "atendimento") {
          state = "waitingName";
          appendMessage(
            "Bot: Para falar com um atendente, por favor, informe seu nome completo.",
            "system"
          );
        } else if (message === "4") {
          appendMessage("Bot: " + faqOptions["4"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "5") {
          appendMessage("Bot: " + faqOptions["5"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "6") {
          appendMessage("Bot: " + faqOptions["6"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "7") {
          appendMessage("Bot: " + faqOptions["7"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "8") {
          appendMessage("Bot: " + faqOptions["8"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "9") {
          appendMessage("Bot: " + faqOptions["9"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message === "10") {
          appendMessage("Bot: " + faqOptions["10"].answer, "system");
          playSound();
          appendMessage(
            'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
            "system"
          );
        } else if (message.toLowerCase() === "inicio") {
          state = "faq";
          appendMessage(
            "Bot: Aqui estão nossos serviços para você tirar dúvidas:",
            "system"
          );
          appendMessage("1 - Como faço para redefinir minha senha?", "faq");
          appendMessage("2 - Meu computador está muito lento.", "faq");
          appendMessage("3 - Falar com Atendente", "faq");
          appendMessage("4 - Como posso atualizar meu endereço?", "faq");
          appendMessage("5 - O que fazer se minha conta foi bloqueada?", "faq");
          appendMessage("6 - Como posso entrar em contato com o suporte?", "faq");
          appendMessage("7 - Como posso alterar minha senha?", "faq");
          appendMessage("8 - Como faço para recuperar minha conta?", "faq");
          appendMessage("9 - Como alterar meu e-mail cadastrado?", "faq");
          appendMessage("10 - Como posso cancelar minha conta?", "faq");
        } else {
          appendMessage(
            'Bot: Por favor, escolha uma opção válida: 1, 2, 3, 4, 5, 6, 7, 8, 9 ou 10. Ou digite "atendimento" para falar com um atendente, ou "Inicio" para ver as opções novamente.',
            "system"
          );
        }
      } else if (state === "waitingName") {
        // Validação: não aceitar apenas números para nome
        if (/^\d+$/.test(message)) {
          appendMessage("Bot: Por favor, insira um nome válido.", "system");
          playSound();
          return;
        }
        attendantDetails.fullName = message;
        state = "waitingSector";
        appendMessage("Bot: Qual é o seu setor?", "system");
      } else if (state === "waitingSector") {
        attendantDetails.sector = message;
        state = "waitingMatricula";
        appendMessage("Bot: Qual é a sua matrícula?", "system");
      } else if (state === "waitingMatricula") {
        attendantDetails.matricula = message;
        state = "normal";
        socket.emit("request attendant", attendantDetails);
        appendMessage(
          "Bot: Aguarde, estamos conectando você a um atendente...",
          "system"
        );
      }
  
    } else {
      // Criando o elemento da mensagem
      const messages = document.getElementById("messages");
      const messageElement = document.createElement("li");
      messageElement.classList.add("message", "user");
  
      // Criar avatar do usuário
      const avatar = document.createElement("img");
      avatar.src = "user-avatar.png";  // Certifique-se de que este arquivo existe na pasta do projeto
      avatar.classList.add("avatar");
  
      // Criar o texto da mensagem
      const textElement = document.createElement("span");
      textElement.textContent = message;
      textElement.classList.add("text");
  
      // Estruturando a mensagem no HTML
      messageElement.appendChild(textElement);
      messageElement.appendChild(avatar);
  
      // Adicionando ao chat
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight;
  
      // Enviar a mensagem para o socket
      socket.emit("chat message", message);
      input.value = "";
    }
  });
  