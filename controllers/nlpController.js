import natural from 'natural';
import db from '../db/dbConnection.js';  // Modifié pour utiliser l'import default

// Initialisation du tokenizer
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.LogisticRegressionClassifier();

// Variable pour stocker les produits en cache
let productsCache = null;

// Fonction pour initialiser le classificateur
const initializeNLP = async () => {
  try {
    // Intentions pour la recherche de produits
    classifier.addDocument('montre-moi les produits', 'show_products');
    classifier.addDocument('liste des produits', 'show_products');
    classifier.addDocument('que vendez-vous', 'show_products');
    classifier.addDocument('voir les produits', 'show_products');
    classifier.addDocument('produits disponibles', 'show_products');
    
    // Intentions pour les détails d'un produit
    classifier.addDocument('détails du produit', 'product_details');
    classifier.addDocument('information sur', 'product_details');
    classifier.addDocument('prix de', 'product_details');
    classifier.addDocument('caractéristiques de', 'product_details');
    classifier.addDocument('description de', 'product_details');
    
    // Intentions pour l'ajout au panier
    classifier.addDocument('ajouter au panier', 'add_to_cart');
    classifier.addDocument('je veux acheter', 'add_to_cart');
    classifier.addDocument('commander', 'add_to_cart');
    classifier.addDocument('acheter', 'add_to_cart');
    classifier.addDocument('mettre dans le panier', 'add_to_cart');

    // Intentions pour l'aide
    classifier.addDocument('aide', 'help');
    classifier.addDocument('comment ça marche', 'help');
    classifier.addDocument('besoin d\'aide', 'help');
    classifier.addDocument('assistance', 'help');

    // Entraînement du classificateur
    classifier.train();

    // Charger les produits en cache
    productsCache = await getProducts();
    console.log('NLP system initialized successfully');
  } catch (error) {
    console.error('Error initializing NLP system:', error);
    throw error;
  }
};

// Fonctions utilitaires pour la base de données
const getProducts = () => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM products JOIN categories ON products.category_id = categories.category_id',
      (error, results) => {
        if (error) reject(error);
        resolve(results);
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

// Fonction pour trouver un produit par nom
const findProductByName = (searchTerm) => {
  if (!productsCache) return null;
  
  return productsCache.find(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Gestionnaire principal des messages
const handleMessage = async (message) => {
  try {
    const tokens = tokenizer.tokenize(message.toLowerCase());
    const intent = classifier.classify(message);
    
    switch (intent) {
      case 'show_products':
        // Rafraîchir le cache des produits
        productsCache = await getProducts();
        return {
          reply: `Voici nos produits disponibles:\n${productsCache.map(p => 
            `- ${p.name} (${p.price}€/${p.unit_of_mesurement})`).join('\n')}`,
          products: productsCache
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
            reply: `${foundProduct.name}\nPrix: ${foundProduct.price}€/${foundProduct.unit_of_mesurement}\n${foundProduct.description}`,
            product: foundProduct
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

      case 'help':
        return {
          reply: "Je peux vous aider à :\n" +
                "- Voir la liste des produits disponibles\n" +
                "- Obtenir les détails d'un produit spécifique\n" +
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