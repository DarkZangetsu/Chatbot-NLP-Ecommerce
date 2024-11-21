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
    // Commencer par nettoyer les anciens articles du panier qui n'ont pas été commandés
    db.beginTransaction((transactionError) => {
      if (transactionError) return reject(transactionError);

      // Rechercher le panier le plus récent de l'utilisateur
      db.query(
        'SELECT cart_id FROM cart WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId || 1],
        (error, carts) => {
          if (error) {
            return db.rollback(() => reject(error));
          }

          if (carts.length > 0) {
            const cartId = carts[0].cart_id;

            // Supprimer tous les articles de ce panier avant d'ajouter de nouveaux
            db.query(
              'DELETE FROM cart_items WHERE cart_id = ?',
              [cartId],
              (deleteError) => {
                if (deleteError) {
                  return db.rollback(() => reject(deleteError));
                }

                // Vérifier le stock avant l'ajout
                db.query(
                  'SELECT * FROM products WHERE product_id = ? AND stock_quantity >= ?',
                  [productId, quantity],
                  (error, products) => {
                    if (error) {
                      return db.rollback(() => reject(error));
                    }
                    if (!products.length) {
                      return db.rollback(() => reject(new Error('Produit non disponible ou stock insuffisant')));
                    }

                    // Ajouter le nouvel article au panier nettoyé
                    db.query(
                      'INSERT INTO cart_items (cart_id, product_id, quantity, price) SELECT ?, ?, ?, price FROM products WHERE product_id = ?',
                      [cartId, productId, quantity, productId],
                      (error) => {
                        if (error) {
                          return db.rollback(() => reject(error));
                        }

                        // Utiliser la fonction updateStock
                        updateStock(
                          productId, 
                          quantity, 
                          () => {
                            // Valider la transaction
                            db.commit((commitError) => {
                              if (commitError) {
                                return db.rollback(() => reject(commitError));
                              }
                              resolve(true);
                            });
                          }, 
                          (stockError) => {
                            return db.rollback(() => reject(stockError));
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          } else {
            // Créer un nouveau panier si aucun n'existe
            db.query(
              'INSERT INTO cart (user_id) VALUES (?)',
              [userId || 1],
              (error, cart) => {
                if (error) {
                  return db.rollback(() => reject(error));
                }
                const newCartId = cart.insertId;

                // Vérifier le stock
                db.query(
                  'SELECT * FROM products WHERE product_id = ? AND stock_quantity >= ?',
                  [productId, quantity],
                  (error, products) => {
                    if (error) {
                      return db.rollback(() => reject(error));
                    }
                    if (!products.length) {
                      return db.rollback(() => reject(new Error('Produit non disponible ou stock insuffisant')));
                    }

                    // Ajouter le nouvel article au nouveau panier
                    db.query(
                      'INSERT INTO cart_items (cart_id, product_id, quantity, price) SELECT ?, ?, ?, price FROM products WHERE product_id = ?',
                      [newCartId, productId, quantity, productId],
                      (error) => {
                        if (error) {
                          return db.rollback(() => reject(error));
                        }

                        // Utiliser la fonction updateStock
                        updateStock(
                          productId, 
                          quantity, 
                          () => {
                            // Valider la transaction
                            db.commit((commitError) => {
                              if (commitError) {
                                return db.rollback(() => reject(commitError));
                              }
                              resolve(true);
                            });
                          }, 
                          (stockError) => {
                            return db.rollback(() => reject(stockError));
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        }
      );
    });
  });
};

// Fonction utilitaire pour mettre à jour le stock
const updateStock = (productId, quantity, resolve, reject) => {
  db.query(
    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
    [quantity, productId],
    (error) => {
      if (error) return reject(error);
      resolve(true);
    }
  );
};

const createOrder = (userId) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) return reject(err);

      // Rechercher les paniers de l'utilisateur
      db.query(
        'SELECT cart_id FROM cart WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId],
        (error, carts) => {
          if (error) {
            return db.rollback(() => reject(error));
          }
          if (!carts.length) {
            return db.rollback(() => reject(new Error('Aucun panier trouvé')));
          }

          const cartId = carts[0].cart_id;

          // Calculer le prix total
          db.query(
            'SELECT SUM(quantity * price) AS total_price FROM cart_items WHERE cart_id = ?',
            [cartId],
            (error, totalResult) => {
              if (error) {
                return db.rollback(() => reject(error));
              }
              
              const totalPrice = totalResult[0]?.total_price || 0;

              // Si le prix total est 0, rejeter la commande
              if (totalPrice === 0) {
                return db.rollback(() => reject(new Error('Panier vide')));
              }

              // Supprimer les commandes en attente existantes pour cet utilisateur
              db.query(
                'DELETE FROM orders WHERE user_id = ? AND order_status = "pending"',
                [userId],
                (error) => {
                  if (error) {
                    return db.rollback(() => reject(error));
                  }

                  // Insérer une nouvelle commande
                  db.query(
                    'INSERT INTO orders (user_id, total_price, order_status, payment_id) VALUES (?, ?, ?, ?)',
                    [userId, totalPrice, 'pending', 1],
                    (error, orderResult) => {
                      if (error) {
                        return db.rollback(() => reject(error));
                      }
                      const orderId = orderResult.insertId;

                      // Insérer les articles de la commande
                      db.query(
                        'INSERT INTO order_items (order_id, product_id, quantity, price) ' +
                        'SELECT ?, product_id, quantity, price FROM cart_items WHERE cart_id = ?',
                        [orderId, cartId],
                        (error) => {
                          if (error) {
                            return db.rollback(() => reject(error));
                          }

                          // Supprimer les articles du panier
                          db.query(
                            'DELETE FROM cart_items WHERE cart_id = ?',
                            [cartId],
                            (error) => {
                              if (error) {
                                return db.rollback(() => reject(error));
                              }

                              // Valider la transaction
                              db.commit((commitError) => {
                                if (commitError) {
                                  return db.rollback(() => reject(commitError));
                                }
                                resolve(orderId);
                              });
                            }
                          );
                        }
                      );

                       // Création d'un enregistrement de paiement
                       db.query(
                        'INSERT INTO payments (order_id, payment_method, payment_status) VALUES (?, ?, ?)',
                        [orderId, 'others', 'pending'],
                        (error, paymentResult) => {
                          if (error) {
                            return db.rollback(() => reject(error));
                          }

                          // Mettre à jour l'ID de paiement dans la commande
                          db.query(
                            'UPDATE orders SET payment_id = ? WHERE order_id = ?',
                            [paymentResult.insertId, orderId],
                            (error) => {
                              if (error) {
                                return db.rollback(() => reject(error));
                              }

                              // Valider toutes les transactions
                              db.commit((err) => {
                                if (err) {
                                  return db.rollback(() => reject(err));
                                }
                                resolve(orderId);
                              });
                            }
                          );
                        }
                      )
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};


// Nouvelle fonction pour récupérer les articles du panier
const getCartItems = (userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT p.product_id, p.name, p.price, ci.quantity, p.unit_of_mesurement, p.image 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.product_id 
       JOIN cart c ON ci.cart_id = c.cart_id 
       WHERE c.user_id = ? 
       ORDER BY ci.cart_id DESC 
       LIMIT 1`,
      [userId],
      (error, results) => {
        if (error) reject(error);
        
        const cartItemsWithImagePaths = results.map(item => ({
          ...item,
          imageUrl: `/images/product/${item.image}`,
          total_price: item.price * item.quantity
        }));
        
        resolve(cartItemsWithImagePaths);
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
          // Extraire le produit et la quantité
          const productMatch = tokens.find(token => findProductByName(token));
          const quantityMatch = tokens.find(token => /^\d+$/.test(token));
  
          if (productMatch) {
            const product = findProductByName(productMatch);
            const quantity = quantityMatch ? parseInt(quantityMatch) : 1;
            
            try {
              await addToCart(1, product.product_id, quantity);
              return {
                reply: `J'ai ajouté ${quantity} ${product.name}(s) à votre panier. Voulez-vous autre chose ?`,
                action: 'added_to_cart'
              };
            } catch (error) {
              return { 
                reply: "Désolé, la quantité demandée n'est pas disponible.",
                action: 'stock_error'
              };
            }
          }
          
          return { 
            reply: "Je n'ai pas compris quel produit vous voulez ajouter. Pouvez-vous préciser ?"
          };  


        case 'checkout-payment':
          try {
            const orderId = await createOrder(1);
            return {
              action: 'payment_link',
              reply: 'Commande créée avec succès',
              orderId: orderId
            };
          } catch (error) {
            console.error(error);
            return {
              reply: "Impossible de créer la commande. Votre panier est-il vide ? " + error.message
            };
          }


          case 'view_cart':
            try {
              const cartItems = await getCartItems(1);
              if (cartItems.length === 0) {
                return { reply: "Votre panier est actuellement vide." };
              }
              
              const cartDetails = cartItems.map(item => 
                `- ${item.name}: ${item.quantity} ${item.unit_of_mesurement} x ${item.price}€ = ${item.total_price}€`
              ).join('\n');
              
              const totalCartPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);
              
              return {
                reply: `Voici les produits dans votre panier:\n${cartDetails}\n\nTotal: ${totalCartPrice}€`,
                cartItems: cartItems
              };
            } catch (error) {
              return { reply: "Impossible de récupérer les articles du panier." };
            }

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