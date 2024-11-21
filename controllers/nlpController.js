//nlpController.js
import natural from 'natural';
import db from '../db/dbConnection.js';
import { initializeNLP, classifier } from './initilalizeNLP.js';

// Initialisation du tokenizer
const tokenizer = new natural.WordTokenizer();

// Variable pour stocker les produits en cache
let productsCache = null;

// Fonctions utilitaires pour la base de données
const getProducts = () => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM products JOIN categories ON products.category_id = categories.category_id',
      (error, results) => {
        if (error) reject(error);
        // Ajouter le chemin complet de l'image pour chaque produit
        const productsWithImagePaths = results.map(product => ({
          ...product,
          imageUrl: `/images/product/${product.image}`

        }));
        console.log(productsWithImagePaths.map(p => p.imageUrl));
        resolve(productsWithImagePaths);
      }
    );
  });
};

const addToCart = (userId, productId, quantity) => {
  return new Promise((resolve, reject) => {
    // Vérifier le stock avant l'ajout
    db.query(
      'SELECT * FROM products WHERE product_id = ? AND stock_quantity >= ?',
      [productId, quantity],
      (error, product) => {
        if (error) return reject(error);
        if (!product.length) {
          return reject(new Error('Produit non disponible ou stock insuffisant'));
        }

        // Création d'un nouveau panier
        db.query(
          'INSERT INTO cart (user_id) VALUES (?)',
          [userId || 1],
          (error, cart) => {
            if (error) return reject(error);
            const cartId = cart.insertId;

            // Ajout du produit dans le panier
            db.query(
              'INSERT INTO cart_items (cart_id, product_id, quantity, price) SELECT ?, ?, ?, price FROM products WHERE product_id = ?',
              [cartId, productId, quantity, productId],
              (error) => {
                if (error) return reject(error);

                // Mise à jour du stock
                db.query(
                  'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                  [quantity, productId],
                  (error) => {
                    if (error) return reject(error);
                    resolve(true);
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};


// Fonction pour gérer la redirection vers le paiement
const handleCheckoutPayment = () => {
  return {
    action: 'payment_link'
  };
};

// Fonction pour trouver un produit par nom
const findProductByName = (searchTerm) => {
  if (!productsCache) return null;

  return productsCache.find(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Nouvelles fonctions utilitaires pour gérer les nouvelles intentions
const handleGreeting = () => {
  const greetings = [
    "Bonjour! Comment puis-je vous aider aujourd'hui?",
    "Bienvenue! Que puis-je faire pour vous?",
    "Bonjour! Je suis là pour vous aider avec vos achats."
  ];
  return { reply: greetings[Math.floor(Math.random() * greetings.length)] };
};

const handleGoodbye = () => {
  const goodbyes = [
    "Au revoir! Merci de votre visite.",
    "À bientôt! Passez une excellente journée.",
    "Merci de votre visite, à bientôt!"
  ];
  return { reply: goodbyes[Math.floor(Math.random() * goodbyes.length)] };
};

const handleThanks = () => {
  const responses = [
    "Je vous en prie! Y a-t-il autre chose que je peux faire pour vous?",
    "C'est un plaisir! Puis-je vous aider avec autre chose?",
    "De rien! N'hésitez pas si vous avez d'autres questions."
  ];
  return { reply: responses[Math.floor(Math.random() * responses.length)] };
};

const handleNextStep = (currentState) => {
  // État à maintenir dans la session utilisateur
  return {
    reply: "Que souhaitez-vous faire maintenant? Vous pouvez:\n" +
      "- Continuer vos achats\n" +
      "- Voir votre panier\n" +
      "- Passer à la caisse"
  };
};

const handleConfirmation = (currentState) => {
  return {
    reply: "Voulez-vous confirmer cette action? Dites 'oui' pour continuer ou 'non' pour annuler."
  };
};

const handleMoreInfo = () => {
  return {
    reply: "Que souhaitez-vous savoir de plus? Je peux vous donner:\n" +
      "- Plus de détails sur un produit\n" +
      "- Des informations sur nos services\n" +
      "- Des conseils d'utilisation"
  };
};


// Gestionnaire principal des messages
const handleMessage = async (message) => {
  try {
    const tokens = tokenizer.tokenize(message.toLowerCase());
    const intent = classifier.classify(message);

    switch (intent) {
      case 'show_products':
        productsCache = await getProducts();
        return {
          products: productsCache.map(p => ({
            name: p.name,
            price: p.price,
            unit_of_mesurement: p.unit_of_mesurement,
            imageUrl: `/images/product/${p.image}`,
          }))
        };
      case 'product_details':
        const productTerms = tokens.filter(token => token.length > 2);
        let foundProduct = null;

        for (const term of productTerms) {
          foundProduct = findProductByName(term);
          if (foundProduct) break;
        }

        if (foundProduct) {
          return {
            product: {
              name: foundProduct.name,
              price: foundProduct.price,
              unit_of_measurement: foundProduct.unit_of_mesurement,
              description: foundProduct.description,
              imageUrl: `/images/product/${foundProduct.image}`
            }
          };
        }
        return { reply: "Je n'ai pas trouvé ce produit. Pouvez-vous préciser?" };

      case 'add_to_cart':
        const productToAdd = tokens
          .filter(token => token.length > 2)
          .find(token => findProductByName(token));

        if (productToAdd) {
          const product = findProductByName(productToAdd);
          await addToCart(1, product.product_id, 1);
          return {
            reply: `J'ai ajouté ${product.name} à votre panier. Voulez-vous continuer vos achats ou passer à la caisse?`,
            action: 'added_to_cart'
          };
        }
        return { reply: "Je n'ai pas compris quel produit vous souhaitez ajouter. Pouvez-vous préciser?" };


        case 'checkout-payment':
            return handleCheckoutPayment();

      case 'greeting':
        return handleGreeting();

      case 'goodbye':
        return handleGoodbye();

      case 'thanks':
        return handleThanks();

      case 'next_step':
        return handleNextStep(userState);

      case 'confirmation':
        return handleConfirmation(userState);

      case 'more_info':
        return handleMoreInfo();

      case 'polite':
        return {
          reply: "Je vous en prie! Comment puis-je vous aider?"
        };

      case 'acknowledge':
        return {
          reply: "Très bien. Que souhaitez-vous faire ensuite?"
        };

      case 'positive':
        return {
          reply: "Je suis ravi que cela vous convienne! Puis-je faire autre chose pour vous?"
        };

      case 'pause':
        return {
          reply: "D'accord, je vous attends. Prenez votre temps!",
          action: 'pause_conversation'
        };

      case 'continue':
        return {
          reply: "Je suis là pour continuer à vous aider. Que souhaitez-vous faire?",
          action: 'resume_conversation'
        };

      case 'help':
        return {
          reply: "Je peux vous aider à :\n" +
            "- Voir la liste des produits disponibles\n" +
            "- Obtenir les détails d'un produit spécifique avec images\n" +
            "- Ajouter des produits à votre panier\n" +
            "Que souhaitez-vous faire ?"
        };

      default:
        return {
          reply: "Je ne suis pas sûr de comprendre. Voulez-vous voir nos produits disponibles?"
        };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    throw error;
  }
};

// Contrôleur Express
const handleNLPRequest = async (req, res) => {
  try {
    const userMessage = req.body.MSG;
    const response = await handleMessage(userMessage);
    res.json(response);
  } catch (error) {
    console.error('Error in NLP handler:', error);
    res.status(500).json({
      reply: "Désolé, une erreur s'est produite. Pouvez-vous réessayer?"
    });
  }
};

// Initialiser le NLP au démarrage
initializeNLP().catch(console.error);

export default handleNLPRequest;