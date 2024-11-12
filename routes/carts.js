// ./routes/carts.js
import express from "express";
import { createCart, getCartDetails, updateCart, deleteCart } from '../controllers/cartController.js';

const router = express.Router();

router.get("/", getCartDetails);

// Route pour créer une nouvelle cart 
router.post("/", createCart);

// Route pour mettre à jour une  cart 
//router.put("/", updateCart);
router.put("/:cart_item_id", updateCart);


// Route pour supprimer une  cart 
router.delete("/:cart_id", deleteCart);

export default router; // Assure-toi que cette ligne est présente