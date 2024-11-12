// ./routes/books.js
import express from "express";
import { authenticate } from '../middlewares/auth.js'; // Importez votre middleware d'authentification

const router = express.Router();

// Appliquez l'authentification à toutes les routes
router.use(authenticate);


export default router;
