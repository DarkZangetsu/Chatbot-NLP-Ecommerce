import db from '../db/dbConnection.js';


export const createCart = (req, res) => {
    // Validation des données d'entrée
    if (!req.body.user_id || !req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Données invalides pour la création du panier'
        });
    }

    // Commencer une transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error("Erreur lors du début de la transaction:", err);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du panier'
            });
        }

        // 1. D'abord, insérer dans la table cart
        const cartSql = "INSERT INTO cart (user_id) VALUES (?)";
        const cartValues = [req.body.user_id];

        db.query(cartSql, cartValues, (err, cartResult) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Erreur lors de la création du panier:", err);
                    res.status(500).json(err);
                });
            }

            const cart_id = cartResult.insertId; // Récupérer l'ID du panier créé
            const cartItems = req.body.items; // Supposons que les items sont envoyés dans le body

            // 2. Ensuite, insérer les items du panier
            const cartItemSql = "INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ?";
            const cartItemValues = cartItems.map(item => [
                cart_id,
                item.product_id,
                item.quantity,
                item.price
            ]);

            db.query(cartItemSql, [cartItemValues], (err, itemResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Erreur lors de l'insertion des items:", err);
                        res.status(500).json(err);
                    });
                }

                // Si tout va bien, valider la transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Erreur lors de la validation de la transaction:", err);
                            res.status(500).json(err);
                        });
                    }

                    return res.json({
                        message: "Le panier et ses items ont été créés avec succès",
                        cart: {
                            cart_id: cart_id,
                            user_id: req.body.user_id,
                            items: cartItems
                        }
                    });
                });
            });
        });
    });
};

// Dans cartController.js

export const getCartDetails = (req, res) => {
    const sql = `
        SELECT 
            c.cart_id,
            u.user_id,
            u.username,
            p.product_id,
            p.name AS product_name,
            p.image AS product_image,
            p.price AS product_base_price,
            p.stock_quantity AS stock_quantity,
            ci.cart_item_id,
            ci.quantity,
            ci.price AS cart_item_price,
            (ci.quantity * ci.price) AS total_item_price
        FROM cart c
        INNER JOIN users u ON c.user_id = u.user_id
        INNER JOIN cart_items ci ON c.cart_id = ci.cart_id
        INNER JOIN products p ON ci.product_id = p.product_id
        ORDER BY c.cart_id DESC
    `;

    db.query(sql, (err, data) => {
        if (err) {
            console.error("Erreur lors de la récupération des détails du panier:", err);
            return res.status(500).json({ 
                success: false, 
                error: "Erreur lors de la récupération des détails du panier" 
            });
        }

        // Restructurer les données pour regrouper les items par panier
        const cartsMap = new Map();

        data.forEach(item => {
            if (!cartsMap.has(item.cart_id)) {
                cartsMap.set(item.cart_id, {
                    cart_id: item.cart_id,
                    user_id: item.user_id,
                    username: item.username,
                    items: [],
                    total_cart_price: 0
                });
            }

            const cart = cartsMap.get(item.cart_id);
            cart.items.push({
                cart_id: item.cart_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_image: item.product_image,
                product_base_price: item.product_base_price,
                stock_quantity: item.stock_quantity,
                cart_item_id: item.cart_item_id,
                quantity: item.quantity,
                cart_item_price: item.cart_item_price,
                total_item_price: item.total_item_price
            });

            cart.total_cart_price += item.total_item_price;
        });

        // Convertir la Map en tableau
        const formattedCarts = Array.from(cartsMap.values());
        // Compter le nombre de paniers distincts
        const cartCount = formattedCarts.length;
        return res.json({
            success: true,
            carts: formattedCarts,
            cartCount: cartCount
        });
    });
};

// Mise à jour de la fonction updateCart
// export const updateCart = (req, res) => {
//     return new Promise((resolve, reject) => {
//         const cart_item_id = req.body.cart_item_id;
//         const newQuantity = req.body.quantity;

//         if (!cart_item_id || !newQuantity) {
//             return res.status(400).json({ success: false, message: 'Paramètres manquants' });
//         }

//         // Requête SQL pour mettre à jour la quantité dans cart_items
//         const q = "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?";

//         db.query(q, [newQuantity, cart_item_id], (err, result) => {
//             if (err) {
//                 console.error('Erreur lors de la mise à jour de la quantité:', err);
//                 return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la quantité' });
//             }

//             // Si la mise à jour est réussie, renvoyer la nouvelle quantité et l'ID de l'item mis à jour
//             res.json({ success: true, message: 'Quantité mise à jour avec succès', cart_item_id, newQuantity });
//         });
//     });
// };
export const updateCart = (req, res) => {
    const cart_item_id = req.params.cart_item_id;  // Récupérer l'ID depuis l'URL
    const newQuantity = req.body.quantity;

    if (!cart_item_id || !newQuantity) {
        return res.status(400).json({ success: false, message: 'Paramètres manquants' });
    }

    const q = "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?";
    db.query(q, [newQuantity, cart_item_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de la quantité:', err);
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la quantité' });
        }

        res.json({ success: true, message: 'Quantité mise à jour avec succès', cart_item_id, newQuantity });
    });
};


export const deleteCart = (req, res) => {
    const cart_id = req.params.cart_id; // Récupérer l'ID du panier à supprimer
    const { cart_item_id } = req.body; // Récupérer l'ID de l'item à supprimer

    if (!cart_id || !cart_item_id) {
        return res.status(400).json({ success: false, message: 'ID du panier ou ID de l\'article manquant' });
    }

    // Commencer une transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error("Erreur lors du début de la transaction:", err);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du panier'
            });
        }

        // 1. Supprimer d'abord l'item du panier
        const deleteCartItemsSql = "DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?";
        db.query(deleteCartItemsSql, [cart_item_id, cart_id], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error("Erreur lors de la suppression de l'item du panier:", err);
                    res.status(500).json(err);
                });
            }

            // Vérifier si le panier est vide et le supprimer si c'est le cas
            const checkCartItemsSql = "SELECT COUNT(*) AS itemCount FROM cart_items WHERE cart_id = ?";
            db.query(checkCartItemsSql, [cart_id], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Erreur lors de la vérification des items du panier:", err);
                        res.status(500).json(err);
                    });
                }

                if (results[0].itemCount === 0) {
                    // 2. Si le panier est vide, le supprimer
                    const deleteCartSql = "DELETE FROM cart WHERE cart_id = ?";
                    db.query(deleteCartSql, [cart_id], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error("Erreur lors de la suppression du panier:", err);
                                res.status(500).json(err);
                            });
                        }
                    });
                }

                // Si tout est bien supprimé, valider la transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Erreur lors de la validation de la transaction:", err);
                            res.status(500).json(err);
                        });
                    }

                    return res.json({
                        success: true,
                        message: 'L\'article a été supprimé avec succès'
                    });
                });
            });
        });
    });
};

