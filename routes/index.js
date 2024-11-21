// ../routes/index.js
import express from "express";
import categRoutes from './categories.js';
import prodRoutes from './products.js';
import cartRoutes from './carts.js';
import dfWebhook from './dfWebhook.js';
// Ajouter l'import du contrôleur Dialogflow
import handleNLPRequest from '../controllers/nlpController.js';


const router = express.Router();


router.get("/", (req, res) => {
    res.render("index", {
        title: "Hello Page",
    });
});
router.get("/cart", (req, res) => {
    res.render("cartPage", {
        title: "Carts Page",
    });
});
router.get("/singleProduct", (req, res) => {
    res.render("singleProdPage", {
        title: "Carts Page",
    });
});

router.get("/checkout", (req, res) => {
    res.render("checkOutPage", {
        title: "Checkout Page",
    });
});


router.get("/admin", (req, res) => {
    res.render("admin", {
        layout: 'layouts/adminMain' // Spécifiez le layout ici
    });
});

router.get("/productList", (req, res) => {
    res.render("adminProductList", {
        layout: 'layouts/adminMain', // Spécifiez le layout ici
        
    });
});



// Route pour gérer les messages NLP
router.post('/send-msg', handleNLPRequest);

// Routes pour les catégories, produits, carts
router.use('/categories', categRoutes);
router.use('/products', prodRoutes);
router.use('/carts', cartRoutes);

// Ajout de dfWebhook pour d'autres fonctionnalités éventuelles
router.use(dfWebhook);

export default router;