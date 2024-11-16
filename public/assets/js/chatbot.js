// Fonction pour créer un message entrant (bot)
const createIncomingMessage = (content, productDetails = null) => {
  const li = document.createElement('li');
  li.className = 'chat incoming';
  
  // Icône du bot
  const botIcon = document.createElement('span');
  botIcon.className = 'material-symbols-outlined';
  botIcon.textContent = 'smart_toy';
  
  // Container pour le message
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';
  
  // Texte du message
  const messageText = document.createElement('p');
  messageText.textContent = content;
  messageContainer.appendChild(messageText);
  
  // Si nous avons des détails de produit, ajouter l'image et les informations
  if (productDetails && productDetails.image) {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      
      const productImage = document.createElement('img');
      productImage.src = `/images/product/${productDetails.image}`;
      productImage.alt = productDetails.name;
      productImage.className = 'product-image';
      
      const productInfo = document.createElement('div');
      productInfo.className = 'product-info';
      if (productDetails.name) {
          const productName = document.createElement('h4');
          productName.textContent = productDetails.name;
          productInfo.appendChild(productName);
      }
      if (productDetails.price) {
          const productPrice = document.createElement('p');
          productPrice.textContent = `${productDetails.price}€`;
          productInfo.appendChild(productPrice);
      }
      
      productCard.appendChild(productImage);
      productCard.appendChild(productInfo);
      messageContainer.appendChild(productCard);
  }
  
  li.appendChild(botIcon);
  li.appendChild(messageContainer);
  
  return li;
};

// Fonction pour créer un message sortant (utilisateur)
const createOutgoingMessage = (content) => {
  const li = document.createElement('li');
  li.className = 'chat outgoing';
  
  const messageText = document.createElement('p');
  messageText.textContent = content;
  
  li.appendChild(messageText);
  return li;
};

// Fonction pour ajouter un message à la chatbox avec animation
const addMessageToChatbox = (messageElement) => {
  const chatbox = document.querySelector('.chatbox');
  messageElement.style.opacity = '0';
  chatbox.appendChild(messageElement);
  
  // Animation fade in
  requestAnimationFrame(() => {
      messageElement.style.transition = 'opacity 0.3s ease-in-out';
      messageElement.style.opacity = '1';
  });
  
  chatbox.scrollTop = chatbox.scrollHeight;
};

// Fonction pour gérer le chargement
const showLoadingIndicator = () => {
  const loadingMessage = createIncomingMessage('...');
  loadingMessage.classList.add('loading');
  addMessageToChatbox(loadingMessage);
  return loadingMessage;
};

// Gestionnaire d'envoi de message
const handleSendMessage = async () => {
  const textarea = document.querySelector('.chat-input textarea');
  const userMessage = textarea.value.trim();
  
  if (!userMessage) return;
  
  // Désactiver le textarea pendant l'envoi
  textarea.disabled = true;
  
  // Afficher le message de l'utilisateur
  addMessageToChatbox(createOutgoingMessage(userMessage));
  textarea.value = '';
  
  // Afficher l'indicateur de chargement
  const loadingIndicator = showLoadingIndicator();
  
  try {
      const response = await fetch('http://localhost:3000/api/send-msg', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({ MSG: userMessage })
      });
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Supprimer l'indicateur de chargement
      loadingIndicator.remove();
      
      // Créer le message du bot avec l'image si disponible
      const botMessage = createIncomingMessage(
          data.reply,
          data.product || null // Utiliser data.product au lieu de productDetails
      );
      
      addMessageToChatbox(botMessage);
  } catch (error) {
      console.error('Error sending message:', error);
      
      // Supprimer l'indicateur de chargement
      loadingIndicator.remove();
      
      addMessageToChatbox(createIncomingMessage(
          "Désolé, une erreur s'est produite. Pouvez-vous réessayer?"
      ));
  } finally {
      // Réactiver le textarea
      textarea.disabled = false;
      textarea.focus();
  }
};

// Styles CSS pour le chatbot
const styles = document.createElement('style');
styles.textContent = `
  .message-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
  }
  
  .product-card {
      max-width: 200px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-top: 8px;
      background: white;
  }
  
  .product-image {
      width: 100%;
      height: 150px;
      object-fit: cover;
  }
  
  .product-info {
      padding: 8px;
  }
  
  .product-info h4 {
      margin: 0;
      font-size: 14px;
      color: #333;
  }
  
  .product-info p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #666;
  }
  
  .chat.incoming .message-container {
      margin-left: 10px;
  }
  
  .chat.loading {
      opacity: 0.6;
  }
  
  .chatbox {
      scroll-behavior: smooth;
  }
  
  .chat-input textarea:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
  }
`;

document.head.appendChild(styles);

// Initialisation du chatbot
const initChatbot = () => {
  // Ajouter les event listeners
  document.querySelector('#send-btn').addEventListener('click', handleSendMessage);
  
  const textarea = document.querySelector('.chat-input textarea');
  textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  });
  
  // Gérer le bouton toggle du chatbot
  const chatbotToggler = document.querySelector('.chatbot-toggler');
  const chatbot = document.querySelector('.chatbot');
  const closeBtn = document.querySelector('.close-btn');
  
  chatbotToggler.addEventListener('click', () => {
      chatbot.classList.toggle('show');
      chatbotToggler.classList.toggle('active');
  });
  
  closeBtn.addEventListener('click', () => {
      chatbot.classList.remove('show');
      chatbotToggler.classList.remove('active');
  });
};

// Initialiser le chatbot quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initChatbot);