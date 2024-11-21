const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbotCloseBtn = document.querySelector(".close-btn");

let userMessage;
const API_URL = "http://localhost:3000/api/send-msg";

const createProductGrid = (products) => {
    const container = document.createElement("div");
    
    // Ajout du texte d'introduction
    const intro = document.createElement("p");
    intro.textContent = "Voici la liste de nos produits :";
    intro.className = "products-intro";
    container.appendChild(intro);
    
    // Création de la grille de produits
    const grid = document.createElement("div");
    grid.className = "products-grid";
    
    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card-mini";
        
        card.innerHTML = `
            <div class="card-header">
                <h5 class="card-title">${product.name}</h5>
            </div>
            <img src="${product.imageUrl}" class="product-image-mini" 
                 alt="${product.name}"
                 onerror="this.src='/assets/img/products/product-img-1.jpg'">
        `;
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
    return container;
};

const createCartDisplay = (cart) => {
    const container = document.createElement("div");
    container.className = "cart-container";
    
    const header = document.createElement("div");
    header.className = "cart-header";
    header.innerHTML = `<h4>Votre Panier</h4>`;
    container.appendChild(header);
    
    const itemsList = document.createElement("div");
    itemsList.className = "cart-items";
    
    cart.items.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <p>${item.quantity} ${item.unit_of_mesurement} x ${item.price} Ar</p>
                <p class="cart-item-total">${item.totalPrice} Ar</p>
            </div>
        `;
        itemsList.appendChild(itemDiv);
    });
    
    container.appendChild(itemsList);
    
    const footer = document.createElement("div");
    footer.className = "cart-footer";
    footer.innerHTML = `
        <div class="cart-total">Total: ${cart.total} Ar</div>
        <button class="checkout-btn">Procéder au paiement</button>
    `;
    container.appendChild(footer);
    
    return container;
};

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");
    
    if (className === "incoming") {
        const botIcon = document.createElement("span");
        botIcon.className = "material-symbols-outlined";
        botIcon.textContent = "smart_toy";
        chatLi.appendChild(botIcon);
    }
    
    if (typeof message === "string") {
        // Pour les messages texte simples
        const textP = document.createElement("p");
        if (className === "incoming") {
            textP.innerHTML = message;
        } else {
            textP.textContent = message;
        }
        messageContainer.appendChild(textP);
    } else if (Array.isArray(message.products)) {
        // Pour l'affichage de la grille de produits
        messageContainer.appendChild(createProductGrid(message.products));
    } else if (message.product) {
        // Pour l'affichage détaillé d'un seul produit
        const productDiv = document.createElement("div");
        productDiv.className = "card product-card";
        
        const productContent = `
            <div class="card-header bg-dark">
                <h5 class="card-title mb-0 text-white">${message.product.name}</h5>
            </div>
            <img src="${message.product.imageUrl}" class="card-img-top product-image" 
                 alt="${message.product.name}"
                 onerror="this.src='/assets/img/products/product-img-1.jpg'">
            <div class="card-body">
                <h6 class="card-subtitle mb-3 text-dark fw-bold">
                    ${message.product.price}Ar/${message.product.unit_of_measurement}
                </h6>
            </div>
             <div class="card-footer">
                <p class="card-text product-description">${message.product.description}</p>
            </div>
        `;
        
        productDiv.innerHTML = productContent;
        messageContainer.appendChild(productDiv);
    } else if (message.action === 'payment_link') {
        // Nouveau cas pour gérer le lien de paiement
        const paymentDiv = document.createElement("div");
        paymentDiv.className = "payment-link-container";
        
        // Création du message texte
        const textP = document.createElement("p");
        textP.textContent = "Vous pouvez procéder au paiement en cliquant ici :";
        paymentDiv.appendChild(textP);
        
        // Création du bouton de paiement
        const paymentButton = document.createElement("a");
        paymentButton.href = "http://localhost:3000/api/checkout/";
        paymentButton.target = "_blank";
        paymentButton.className = "payment-button";
        paymentButton.textContent = "Payer maintenant";
        paymentDiv.appendChild(paymentButton);
        
        messageContainer.appendChild(paymentDiv);
        
        // Ajout du style pour le bouton
        const style = document.createElement('style');
        style.textContent = `
            .payment-link-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 10px 0;
            }
            
            .payment-button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #ff6b35;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                text-align: center;
                transition: background-color 0.2s;
            }
            
            .payment-button:hover {
                background-color: #ff8c35;
            }
        `;
        document.head.appendChild(style);
    } else if (message.reply) {
        const textP = document.createElement("p");
        textP.textContent = message.reply;
        messageContainer.appendChild(textP);
    }
    
    chatLi.appendChild(messageContainer);
    return chatLi;
};

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
            const newChatLi = createChatLi(data, "incoming");
            incomingChatLi.innerHTML = newChatLi.innerHTML;

            const productCards = incomingChatLi.querySelectorAll('.product-card-mini');
            productCards.forEach(card => {
                card.addEventListener('click', () => {
                    const productName = card.querySelector('.card-title').textContent;
                    userMessage = `détails ${productName}`;
                    handleChat();
                });
            });
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
    if (!userMessage && !chatInput._customMessage) return;
    
    if (chatInput._customMessage) {
        userMessage = chatInput._customMessage;
        chatInput._customMessage = null;
    }

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

const style = document.createElement('style');
style.textContent = `
    .message-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 70%;
    }
    
    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        width: 100%;
        margin-top: 8px;
    }
    
    .product-card-mini {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.2s ease;
        cursor: pointer;
    }
    
    .product-card-mini:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .product-card-mini .card-header {
        padding: 8px;
        background: #f8f9fa;
    }
    
    .product-card-mini .card-title {
        font-size: 0.9rem;
        margin: 0;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .product-image-mini {
        width: 100%;
        height: 120px;
        object-fit: cover;
    }
    
    .product-card-mini .card-footer {
        padding: 8px;
        background: white;
        border-top: 1px solid #eee;
    }
    
    .product-card-mini .price {
        font-size: 0.9rem;
        font-weight: 600;
        color: #0d6efd;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .product-card {
        width: 100%;
        max-width: 300px;
        margin: 8px 0;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .product-image {
        height: 200px;
        object-fit: cover;
        border-radius: 0;
    }
    
    .error {
        color: #dc3545;
        padding: 8px;
        border-radius: 6px;
        background: rgba(220, 53, 69, 0.1);
    }
    
`;
document.head.appendChild(style);