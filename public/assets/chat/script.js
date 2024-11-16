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
    
    // Créer le conteneur de message
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");
    
    // Ajouter l'icône pour les messages entrants
    if (className === "incoming") {
        const botIcon = document.createElement("span");
        botIcon.className = "material-symbols-outlined";
        botIcon.textContent = "smart_toy";
        chatLi.appendChild(botIcon);
    }
    
    // Créer le paragraphe pour le texte
    const textP = document.createElement("p");
    
    if (typeof message === "string") {
        if (className === "incoming") {
            textP.innerHTML = message; // Pour permettre le HTML dans les messages du bot
        } else {
            textP.textContent = message; // Pour les messages de l'utilisateur
        }
    } else if (message.reply) {
        textP.textContent = message.reply;
    }
    
    messageContainer.appendChild(textP);
    
    // Ajouter l'image si présente dans le message
    if (message.product && message.product.imageUrl) {
        const productDiv = document.createElement("div");
        productDiv.className = "product-preview";
        
        const productInfo = document.createElement("div");
        productInfo.className = "product-info";
        productInfo.innerHTML = `
            <p class="product-list">
            ${message.product.name}\n
            ${message.product.price}Ar/${message.product.unit_of_measurement}\n
            ${message.product.description}
            </p>
        `;
        
        const img = document.createElement("img");
        img.src = message.product.imageUrl;
        img.alt = message.product.name;
        img.onerror = () => {
            img.src = "/assets/img/products/product-img-1.jpg"; // Image par défaut en cas d'erreur
            console.error("Erreur de chargement de l'image:", message.product.imageUrl);
        };
        
        productDiv.appendChild(productInfo);
        productDiv.appendChild(img);
        messageContainer.appendChild(productDiv);
    }
    
    chatLi.appendChild(messageContainer);
    return chatLi;
}

const generateResponse = (incomingChatLi) => {
    const messageElement = incomingChatLi.querySelector(".message-container");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ MSG: userMessage })
    };

    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            // Remplacer le message existant par la nouvelle réponse
            const newChatLi = createChatLi(data, "incoming");
            incomingChatLi.innerHTML = newChatLi.innerHTML;

            // Ajouter les gestionnaires d'événements pour les éléments interactifs si nécessaire
            const productPreview = incomingChatLi.querySelector('.product-preview');
            if (productPreview) {
                productPreview.addEventListener('click', () => {
                    // Gérer le clic sur le produit si nécessaire
                    console.log('Product clicked:', data.product);
                });
            }
        })
        .catch(error => {
            messageElement.innerHTML = `
                <p class="error">
                    Oops! Une erreur s'est produite. Veuillez réessayer.
                </p>`;
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

// Gestion de la hauteur dynamique du textarea
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Gestion des événements
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
chatbotCloseBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Styles CSS à ajouter
const style = document.createElement('style');
style.textContent = `
    .message-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .product-preview {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        margin-top: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .product-preview:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .product-preview img {
        max-width: 200px;
        height: auto;
        border-radius: 6px;
        margin-top: 8px;
    }
    
    .product-info {
        margin-bottom: 5px;
    }
    
    .product-name {
        font-weight: bold;
        margin: 0;
    }
    
    .product-price {
        color: #666;
        margin: 2px 0 0 0;
    }
    
    .error {
        color: #ff4444;
    }
`;
document.head.appendChild(style);