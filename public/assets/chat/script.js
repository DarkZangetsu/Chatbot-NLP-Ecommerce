const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");

let userMessage;
const API_URL = "http://localhost:3000/api/send-msg";

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" 
        ? `<p>${message}</p>` 
        : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    
    chatLi.innerHTML = chatContent;

    if (className === "incoming") {
        chatLi.querySelector("p").innerHTML = message;
    } else {
        chatLi.querySelector("p").textContent = message;
    }

    return chatLi;
}

const generateResponse = (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json" // Changé en application/json
        },
        body: JSON.stringify({ MSG: userMessage }) // Changé en JSON
    };

    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            // Vérifier la structure de la réponse
            if (data.reply) { // Changé de 'Reply' à 'reply' pour correspondre au backend
                messageElement.textContent = data.reply;
            } else {
                messageElement.textContent = "Désolé, je n'ai pas compris votre demande.";
            }
            
            // Si vous avez des produits dans la réponse, vous pouvez les afficher
            if (data.products) {
                const productsList = data.products.map(p => 
                    `- ${p.name} (${p.price}€)`
                ).join('\n');
                messageElement.textContent += '\n' + productsList;
            }
        })
        .catch(error => {
            messageElement.classList.add("error");
            messageElement.textContent = "Oops! Une erreur s'est produite. Veuillez réessayer.";
            console.error('Erreur lors de la requête:', error);
        })
        .finally(() => {
            chatInput.disabled = false;
            chatbox.scrollTo(0, chatbox.scrollHeight);
        });
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage || chatInput.disabled) return;

    chatInput.value = "";
    chatInput.disabled = true;

    const outgoingChatLi = createChatLi(userMessage, "outgoing");
    chatbox.appendChild(outgoingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    const thinkingIcon = `<div class="chatLoader">
                        <div class="span"></div>
                        <div class="span"></div>
                        <div class="span"></div>
                      </div>`;

    const incomingChatLi = createChatLi(thinkingIcon, "incoming");
    chatbox.appendChild(incomingChatLi);

    setTimeout(() => {
        generateResponse(incomingChatLi);
    }, 600);
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
chatbotCloseBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));