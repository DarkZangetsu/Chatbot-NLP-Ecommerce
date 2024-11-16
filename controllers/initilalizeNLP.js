import natural from 'natural';

const classifier = new natural.LogisticRegressionClassifier();
let productsCache = null;

const initializeNLP = async () => {
    try {
      // Intentions pour la recherche/visualisation des produits avec focus sur "liste"
      classifier.addDocument('montre-moi les produits', 'show_products');
      classifier.addDocument('liste des produits', 'show_products');
      classifier.addDocument('voir la liste', 'show_products');
      classifier.addDocument('afficher la liste', 'show_products');
      classifier.addDocument('liste complète', 'show_products');
      classifier.addDocument('liste de vos produits', 'show_products');
      classifier.addDocument('liste des articles', 'show_products');
      classifier.addDocument('liste disponible', 'show_products');
      classifier.addDocument('liste du catalogue', 'show_products');
      classifier.addDocument('voir la liste des produits', 'show_products');
      classifier.addDocument('montrer la liste', 'show_products');
      classifier.addDocument('consulter la liste', 'show_products');
      classifier.addDocument('accéder à la liste', 'show_products');
      classifier.addDocument('ouvrir la liste', 'show_products');
      classifier.addDocument('liste des prix', 'show_products');
      classifier.addDocument('liste détaillée', 'show_products');
      classifier.addDocument('liste des articles disponibles', 'show_products');
      classifier.addDocument('liste des références', 'show_products');
      classifier.addDocument('liste des modèles', 'show_products');
      classifier.addDocument('liste par catégorie', 'show_products');
  
      // Autres formulations pour voir les produits
      classifier.addDocument('que vendez-vous', 'show_products');
      classifier.addDocument('voir les produits', 'show_products');
      classifier.addDocument('produits disponibles', 'show_products');
      classifier.addDocument('montrer le catalogue', 'show_products');
      classifier.addDocument('voir le catalogue', 'show_products');
      classifier.addDocument('catalogue complet', 'show_products');
      classifier.addDocument('catalogue des produits', 'show_products');
      classifier.addDocument('inventaire disponible', 'show_products');
      classifier.addDocument('voir l\'inventaire', 'show_products');
      classifier.addDocument('qu\'avez-vous en stock', 'show_products');
  
      // Questions directes
      classifier.addDocument('qu\'est-ce que vous avez', 'show_products');
      classifier.addDocument('qu\'est-ce que vous proposez', 'show_products');
      classifier.addDocument('qu\'est-ce que vous vendez', 'show_products');
      classifier.addDocument('quels sont vos produits', 'show_products');
      classifier.addDocument('que proposez-vous', 'show_products');
      classifier.addDocument('que puis-je acheter', 'show_products');
      classifier.addDocument('quels articles avez-vous', 'show_products');
      classifier.addDocument('montrez-moi ce que vous avez', 'show_products');
      classifier.addDocument('je voudrais voir vos produits', 'show_products');
      classifier.addDocument('pouvez-vous me montrer vos produits', 'show_products');
  
      // Formulations avec "afficher"
      classifier.addDocument('afficher tous les produits', 'show_products');
      classifier.addDocument('afficher le catalogue', 'show_products');
      classifier.addDocument('afficher les articles', 'show_products');
      classifier.addDocument('afficher l\'inventaire', 'show_products');
      classifier.addDocument('afficher les disponibilités', 'show_products');
      classifier.addDocument('afficher les options', 'show_products');
      classifier.addDocument('afficher les modèles', 'show_products');
      classifier.addDocument('afficher les références', 'show_products');
      classifier.addDocument('afficher les catégories', 'show_products');
      classifier.addDocument('afficher tout', 'show_products');
  
      // Formulations avec verbe "chercher/trouver"
      classifier.addDocument('je cherche des produits', 'show_products');
      classifier.addDocument('je cherche à voir vos articles', 'show_products');
      classifier.addDocument('je voudrais trouver', 'show_products');
      classifier.addDocument('je recherche des produits', 'show_products');
      classifier.addDocument('recherche de produits', 'show_products');
      classifier.addDocument('trouver des articles', 'show_products');
      classifier.addDocument('chercher dans le catalogue', 'show_products');
      classifier.addDocument('explorer les produits', 'show_products');
      classifier.addDocument('parcourir le catalogue', 'show_products');
      classifier.addDocument('naviguer dans les produits', 'show_products');
  
      // Formulations avec "présenter/montrer"
      classifier.addDocument('présentez-moi vos produits', 'show_products');
      classifier.addDocument('montrez-moi ce que vous avez', 'show_products');
      classifier.addDocument('faites-moi voir vos produits', 'show_products');
      classifier.addDocument('je veux voir vos articles', 'show_products');
      classifier.addDocument('pouvez-vous me présenter', 'show_products');
      classifier.addDocument('montrez-moi le catalogue', 'show_products');
      classifier.addDocument('présentation des produits', 'show_products');
      classifier.addDocument('faire voir les articles', 'show_products');
      classifier.addDocument('montrer les disponibilités', 'show_products');
      classifier.addDocument('présenter les options', 'show_products');
  
  
  
          
      // Intentions pour les détails d'un produit
      // Questions sur les caractéristiques générales
      classifier.addDocument('détails du produit', 'product_details');
      classifier.addDocument('caractéristiques du produit', 'product_details');
      classifier.addDocument('propriétés du produit', 'product_details');
      classifier.addDocument('spécifications du produit', 'product_details');
      classifier.addDocument('fiche technique', 'product_details');
      classifier.addDocument('fiche produit', 'product_details');
      classifier.addDocument('informations détaillées', 'product_details');
      classifier.addDocument('description complète', 'product_details');
      classifier.addDocument('plus d\'informations', 'product_details');
      classifier.addDocument('en savoir plus', 'product_details');
  
      // Questions sur le prix
      classifier.addDocument('prix du produit', 'product_details');
      classifier.addDocument('combien coûte', 'product_details');
      classifier.addDocument('quel est le prix', 'product_details');
      classifier.addDocument('prix de vente', 'product_details');
      classifier.addDocument('tarif', 'product_details');
      classifier.addDocument('coût', 'product_details');
      classifier.addDocument('ça coûte combien', 'product_details');
      classifier.addDocument('prix exact', 'product_details');
      classifier.addDocument('montant', 'product_details');
      classifier.addDocument('c\'est à quel prix', 'product_details');
  
      // Questions sur les dimensions
      classifier.addDocument('dimensions du produit', 'product_details');
      classifier.addDocument('quelle taille', 'product_details');
      classifier.addDocument('quelles dimensions', 'product_details');
      classifier.addDocument('mesures du produit', 'product_details');
      classifier.addDocument('taille exacte', 'product_details');
      classifier.addDocument('largeur du produit', 'product_details');
      classifier.addDocument('hauteur du produit', 'product_details');
      classifier.addDocument('longueur du produit', 'product_details');
      classifier.addDocument('poids du produit', 'product_details');
      classifier.addDocument('volume du produit', 'product_details');
  
      // Questions sur la composition/matériaux
      classifier.addDocument('composition du produit', 'product_details');
      classifier.addDocument('matériaux utilisés', 'product_details');
      classifier.addDocument('c\'est fait en quoi', 'product_details');
      classifier.addDocument('de quoi est-ce fait', 'product_details');
      classifier.addDocument('matière utilisée', 'product_details');
      classifier.addDocument('composition exacte', 'product_details');
      classifier.addDocument('quels matériaux', 'product_details');
      classifier.addDocument('type de matériau', 'product_details');
      classifier.addDocument('qualité des matériaux', 'product_details');
      classifier.addDocument('composition détaillée', 'product_details');
  
      // Questions sur la disponibilité
      classifier.addDocument('disponibilité du produit', 'product_details');
      classifier.addDocument('est-ce disponible', 'product_details');
      classifier.addDocument('en stock', 'product_details');
      classifier.addDocument('quand disponible', 'product_details');
      classifier.addDocument('délai de disponibilité', 'product_details');
      classifier.addDocument('stock disponible', 'product_details');
      classifier.addDocument('encore disponible', 'product_details');
      classifier.addDocument('quantité disponible', 'product_details');
      classifier.addDocument('toujours en stock', 'product_details');
      classifier.addDocument('rupture de stock', 'product_details');
  
      // Questions sur les couleurs/variantes
      classifier.addDocument('couleurs disponibles', 'product_details');
      classifier.addDocument('quelles couleurs', 'product_details');
      classifier.addDocument('autres couleurs', 'product_details');
      classifier.addDocument('variantes disponibles', 'product_details');
      classifier.addDocument('modèles disponibles', 'product_details');
      classifier.addDocument('différentes versions', 'product_details');
      classifier.addDocument('autres modèles', 'product_details');
      classifier.addDocument('choix de couleurs', 'product_details');
      classifier.addDocument('options de couleur', 'product_details');
      classifier.addDocument('variations possibles', 'product_details');
  
      // Questions sur l'utilisation
      classifier.addDocument('comment utiliser', 'product_details');
      classifier.addDocument('mode d\'emploi', 'product_details');
      classifier.addDocument('instructions d\'utilisation', 'product_details');
      classifier.addDocument('notice d\'utilisation', 'product_details');
      classifier.addDocument('comment ça marche', 'product_details');
      classifier.addDocument('comment s\'en servir', 'product_details');
      classifier.addDocument('guide d\'utilisation', 'product_details');
      classifier.addDocument('manuel d\'utilisation', 'product_details');
      classifier.addDocument('conseils d\'utilisation', 'product_details');
      classifier.addDocument('comment fonctionne', 'product_details');
  
      // Questions sur la garantie/SAV
      classifier.addDocument('garantie du produit', 'product_details');
      classifier.addDocument('durée de garantie', 'product_details');
      classifier.addDocument('conditions de garantie', 'product_details');
      classifier.addDocument('service après-vente', 'product_details');
      classifier.addDocument('SAV disponible', 'product_details');
      classifier.addDocument('support technique', 'product_details');
      classifier.addDocument('maintenance', 'product_details');
      classifier.addDocument('réparation possible', 'product_details');
      classifier.addDocument('assistance technique', 'product_details');
      classifier.addDocument('pièces détachées', 'product_details');
  
      // Formulations de questions directes
      classifier.addDocument('parlez-moi de ce produit', 'product_details');
      classifier.addDocument('que pouvez-vous me dire sur', 'product_details');
      classifier.addDocument('j\'aimerais savoir', 'product_details');
      classifier.addDocument('pouvez-vous me décrire', 'product_details');
      classifier.addDocument('donnez-moi plus de détails', 'product_details');
      classifier.addDocument('expliquez-moi ce produit', 'product_details');
      classifier.addDocument('dites m\'en plus', 'product_details');
      classifier.addDocument('je veux tout savoir sur', 'product_details');
      classifier.addDocument('racontez-moi tout sur', 'product_details');
      classifier.addDocument('détaillez-moi ce produit', 'product_details');
  
      // Questions comparatives
      classifier.addDocument('différence avec', 'product_details');
      classifier.addDocument('comparé à', 'product_details');
      classifier.addDocument('par rapport à', 'product_details');
      classifier.addDocument('avantages de ce produit', 'product_details');
      classifier.addDocument('inconvénients de ce produit', 'product_details');
      classifier.addDocument('points forts', 'product_details');
      classifier.addDocument('points faibles', 'product_details');
      classifier.addDocument('meilleur que', 'product_details');
      classifier.addDocument('similaire à', 'product_details');
      classifier.addDocument('équivalent à', 'product_details');
  
  
  
      
      // Intentions pour l'ajout au panier
      classifier.addDocument('ajouter au panier', 'add_to_cart');
      classifier.addDocument('je veux acheter', 'add_to_cart');
      classifier.addDocument('commander', 'add_to_cart');
      classifier.addDocument('acheter', 'add_to_cart');
      classifier.addDocument('mettre dans le panier', 'add_to_cart');
      classifier.addDocument('je prends', 'add_to_cart');
      classifier.addDocument('je voudrais commander', 'add_to_cart');
      classifier.addDocument('ajouter à mon panier', 'add_to_cart');
      classifier.addDocument('je souhaite acquérir', 'add_to_cart');
      classifier.addDocument('je vais prendre', 'add_to_cart');
      classifier.addDocument('ajoutez au panier', 'add_to_cart');
      classifier.addDocument('je désire acheter', 'add_to_cart');
      classifier.addDocument('mettre de côté', 'add_to_cart');
      classifier.addDocument('je veux commander', 'add_to_cart');
      classifier.addDocument('achat immédiat', 'add_to_cart');
  
      // Intentions pour l'aide
      classifier.addDocument('aide', 'help');
      classifier.addDocument('comment ça marche', 'help');
      classifier.addDocument('besoin d\'aide', 'help');
      classifier.addDocument('assistance', 'help');
      classifier.addDocument('pouvez-vous m\'aider', 'help');
      classifier.addDocument('j\'ai une question', 'help');
      classifier.addDocument('je ne comprends pas', 'help');
      classifier.addDocument('guide d\'utilisation', 'help');
      classifier.addDocument('comment faire pour', 'help');
      classifier.addDocument('expliquez-moi', 'help');
      classifier.addDocument('je suis perdu', 'help');
      classifier.addDocument('aidez-moi à', 'help');
      classifier.addDocument('conseil svp', 'help');
      classifier.addDocument('comment procéder', 'help');
      classifier.addDocument('mode d\'emploi', 'help');
  
      // Expressions de transition et de politesse
      classifier.addDocument('bonjour', 'greeting');
      classifier.addDocument('au revoir', 'goodbye');
      classifier.addDocument('merci', 'thanks');
      classifier.addDocument('s\'il vous plaît', 'polite');
      classifier.addDocument('d\'accord', 'acknowledge');
      classifier.addDocument('super', 'positive');
      classifier.addDocument('parfait', 'positive');
      classifier.addDocument('je reviens', 'pause');
      classifier.addDocument('à bientôt', 'goodbye');
      classifier.addDocument('bonne journée', 'goodbye');
  
      // Questions de suivi
      classifier.addDocument('et ensuite', 'next_step');
      classifier.addDocument('que faire maintenant', 'next_step');
      classifier.addDocument('c\'est tout', 'confirmation');
      classifier.addDocument('autre chose', 'more_info');
      classifier.addDocument('je continue', 'continue');
  
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


  export { initializeNLP, classifier };