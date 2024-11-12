// ./routes/products.js
import express from "express";
import { getProducts, createProduct, updateProduct, deleteProduct, upload, getProduct } from '../controllers/productController.js';
import { createEntityType, deleteEntityFromEntityType, updateEntityInEntityType   } from '../lib/dialogflow/index.js';


const router = express.Router();

// Route pour récupérer les produits
router.get("/", getProducts);

// Route pour créer une nouvelle produit (avec upload de fichier)

router.post("/", upload.single('image'), async (req, res) => {
    try {
        // Créer la product sans renvoyer de réponse dans createProduct
        await createProduct(req, res);

        const { entity, entityType } = req.body;

        // Vérifier si la réponse a déjà été envoyée
        if (res.headersSent) {
            return;  // Si la réponse a déjà été envoyée, ne rien faire
        }

        // Ajouter l'entité à Dialogflow si les données sont fournies
        if (entity && entityType) {
            const updatedEntityType = await createEntityType(entityType, [entity]);
            return res.json({ success: true, message: 'Produit créée et entité ajoutée.', updatedEntityType });
        }

        res.json({ success: true, message: 'Produit créée sans entité.' });
    } catch (error) {
        if (!res.headersSent) {  // S'assurer que la réponse n'a pas encore été envoyée
            console.error('Erreur lors de la création de la produit ou de l\'ajout de l\'entité:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de la création de la produit ou de l\'ajout de l\'entité' });
        }
    }
});

// Route pour mettre à jour un produit (avec upload de fichier)
router.put("/:product_id", upload.single('image'), async (req, res) => {
    try {
        // Récupérer l'ancien produit
        const oldProduct = await getProduct(req.params.product_id);

        // Mettre à jour le produit dans la base de données
        const updatedProduct = await updateProduct(req);

        // Si le nom du produit a changé, mettre à jour l'entité dans Dialogflow
        if (oldProduct.name !== updatedProduct.name) {
            // Mettre à jour l'entité dans Dialogflow
            await updateEntityInEntityType("ProductType", oldProduct.name, updatedProduct.name);
        }

        res.json({ success: true, message: 'Produit et entité Dialogflow mises à jour avec succès.', product: updatedProduct });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du produit' });
    }
});

// Route pour supprimer une  produit (avec upload de fichier)
router.delete("/:product_id", async (req, res) => {
    const productId = req.params.product_id;
    try {
        //const productId = req.params.product_id;
        
        // Récupérer le produit avant de le supprimer
        const product = await getProduct(productId);
        
        // Supprimer le produit de la base de données
        await deleteProduct(productId);
        
        // Supprimer l'entité correspondante de Dialogflow
        await deleteEntityFromEntityType('ProductType', product.name);
        
        res.json({ success: true, message: 'Produit et entité Dialogflow supprimés avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du produit et de l\'entité:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
});

// Dans routes/products.js, ajoutez cette route
router.get("/:product_id", async (req, res) => {
    try {
        const product = await getProduct(req.params.product_id);
        res.json(product);
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération du produit' 
        });
    }
});

export default router; // Assure-toi que cette ligne est présente
