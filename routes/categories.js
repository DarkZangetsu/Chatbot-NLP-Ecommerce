// ./routes/categories.js

import express from "express";
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory, upload } from '../controllers/categoryController.js';
import { createEntityType, deleteEntityFromEntityType, updateEntityInEntityType   } from '../lib/dialogflow/index.js';


const router = express.Router();

// Route pour récupérer les catégories
router.get("/", getCategories);

// Route pour créer une nouvelle catégorie (avec upload de fichier)

router.post("/", upload.single('categ_image'), async (req, res) => {
    try {
        // Créer la catégorie sans renvoyer de réponse dans createCategory
        await createCategory(req, res);

        const { entity, entityType } = req.body;

        // Vérifier si la réponse a déjà été envoyée
        if (res.headersSent) {
            return;  // Si la réponse a déjà été envoyée, ne rien faire
        }

        // Ajouter l'entité à Dialogflow si les données sont fournies
        if (entity && entityType) {
            const updatedEntityType = await createEntityType(entityType, [entity]);
            return res.json({ success: true, message: 'Catégorie créée et entité ajoutée.', updatedEntityType });
        }

        res.json({ success: true, message: 'Catégorie créée sans entité.' });
    } catch (error) {
        if (!res.headersSent) {  // S'assurer que la réponse n'a pas encore été envoyée
            console.error('Erreur lors de la création de la catégorie ou de l\'ajout de l\'entité:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de la création de la catégorie ou de l\'ajout de l\'entité' });
        }
    }
});


// Route pour modifier une catégorie (avec upload de fichier)
router.put("/:category_id", upload.single('categ_image'), async (req, res) => {
    try {
        // Récupérer l'ancienne catégorie
        const oldCategory = await getCategory(req.params.category_id);
        
        // Mettre à jour la catégorie dans la base de données
        const updatedCategory = await updateCategory(req);
        
        // Mettre à jour l'entité dans Dialogflow si le nom de la catégorie a changé
        if (oldCategory.category_name !== updatedCategory.category_name) {
            await updateEntityInEntityType('CategoryType', oldCategory.category_name, updatedCategory.category_name);
        }
        
        res.json({ success: true, message: 'Catégorie et entité Dialogflow mises à jour avec succès', category: updatedCategory });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la catégorie et de l\'entité:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
    }
});

// Route pour supprimer une  catégorie (avec upload de fichier)
router.delete("/:category_id", async (req, res) => {
    try {
        const categoryId = req.params.category_id;
        
        // Récupérer le nom de la catégorie avant de la supprimer
        const category = await getCategory(categoryId);
        
        // Supprimer la catégorie de la base de données
        await deleteCategory(categoryId);
        
        // Supprimer l'entité correspondante de Dialogflow
        await deleteEntityFromEntityType('CategoryType', category.category_name);
        
        res.json({ success: true, message: 'Catégorie et entité Dialogflow supprimées avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie et de l\'entité:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
});
export default router;
