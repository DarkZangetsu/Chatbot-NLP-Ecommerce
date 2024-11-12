import db from '../db/dbConnection.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const IMAGE_DIRECTORY = path.join(process.cwd(), 'public', 'images', 'product');

const getImagePath = (filename) => path.join(IMAGE_DIRECTORY, filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(IMAGE_DIRECTORY)) {
            fs.mkdirSync(IMAGE_DIRECTORY, { recursive: true });
        }
        cb(null, IMAGE_DIRECTORY);
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const safeName = req.body.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const newFileName = `${safeName}${fileExt}`;
        cb(null, newFileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb('Erreur: Seuls les fichiers images (gif, jpg, png) sont autorisés !', false);
    }
};

export const upload = multer({ storage: storage, fileFilter: fileFilter });

// Récupérer les Produits avec les informations de catégorie
export const getProducts = (req, res) => {
    const sql = `
        SELECT p.product_id, p.name, p.image, p.description, p.price, p.stock_quantity, p.unit_of_mesurement,
               c.category_name, p.crated_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        ORDER BY p.product_id DESC
    `;
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Erreur lors de la récupération des produits:", err);
            return res.status(500).json({ error: "Erreur lors de la récupération des produits" });
        }
        return res.json(data);
    });
};

export const getProduct = (product_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT p.product_id, p.name, p.image, p.description, p.price, p.stock_quantity, p.unit_of_mesurement,
               c.category_name, p.crated_at, p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = ?
            ORDER BY p.product_id DESC
        `;
        db.query(sql, [product_id], (err, data) => {
            if (err) reject(err);
            if (!data.length) reject(new Error("Product not found"));
            resolve(data[0]);
        });
    });
};

export const createProduct = (req, res) => {
    const sql = "INSERT INTO products (`name`, `image`, `description`, `price`, `stock_quantity`, `category_id`, `unit_of_mesurement`) VALUES (?)";
    const fileName = req.file ? req.file.filename : null;
    const values = [
        req.body.name,
        fileName, // Utilisation du nom de fichier de l'image
        req.body.description,
        req.body.price,
        req.body.stock_quantity,
        req.body.category_id,
        req.body.unity
    ];

    db.query(sql, [values], (err, data) => {
        if (err) {
            console.error("Erreur lors de la création de la produit:", err);
            return res.status(500).json(err);
        }
        //return res.json("La catégorie a été créée avec succès");
        return res.json({
            message: "La produit a été créée avec succès",
            product: {
                name: req.body.name,
                image: fileName,
                description: req.body.description,
                price: req.body.price,
                stock_quantity: req.body.stock_quantity,
                category_id: req.body.category_id
            }
        });
    });
};

// Mise à jour de la fonction updateProduct
export const updateProduct = (req) => {
    return new Promise((resolve, reject) => {
        const product_id = req.params.product_id;

        db.query("SELECT * FROM products WHERE product_id = ?", [product_id], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return reject(new Error("Produit non trouvé"));

            const oldProduct = results[0];
            let newFileName = oldProduct.image;

            const updateDatabase = () => {
                const q = "UPDATE products SET `name` = ?, `description` = ?, `image` = ?, `price` = ?, `stock_quantity` = ?, `unit_of_mesurement` = ?, `category_id` = ? WHERE product_id = ?";
                const values = [
                    req.body.name,
                    req.body.description,
                    newFileName,
                    req.body.price,
                    req.body.stock_quantity,
                    req.body.unity,
                    req.body.category_id
                ];

                db.query(q, [...values, product_id], (err, data) => {
                    if (err) return reject(err);
                    resolve({
                        product_id,
                        name: req.body.name,
                        description: req.body.description,
                        image: newFileName,
                        price: req.body.price,
                        stock_quantity: req.body.stock_quantity,
                        category_id: req.body.category_id
                    });
                });
            };

            if (req.file) {
                const fileExt = path.extname(req.file.originalname);
                const safeName = req.body.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                newFileName = `${safeName}${fileExt}`;

                const oldFilePath = oldProduct.image ? getImagePath(oldProduct.image) : null;
                const newFilePath = getImagePath(newFileName);

                fs.rename(req.file.path, newFilePath, (err) => {
                    if (err) return reject(err);

                    if (oldFilePath && oldProduct.image !== newFileName) {
                        fs.unlink(oldFilePath, (err) => {
                            if (err && err.code !== 'ENOENT') console.error("Erreur lors de la suppression de l'ancien fichier:", err);
                            updateDatabase();
                        });
                    } else {
                        updateDatabase();
                    }
                });
            } else if (req.body.name !== oldProduct.name && oldProduct.image) {
                const fileExt = path.extname(oldProduct.image);
                const safeName = req.body.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                newFileName = `${safeName}${fileExt}`;

                const oldFilePath = getImagePath(oldProduct.image);
                const newFilePath = getImagePath(newFileName);

                fs.rename(oldFilePath, newFilePath, (err) => {
                    if (err && err.code !== 'ENOENT') return reject(err);
                    updateDatabase();
                });
            } else {
                updateDatabase();
            }
        });
    });
};


// Mise à jour de la fonction deleteProduct
export const deleteProduct = (productId) => {
    return new Promise((resolve, reject) => {
        const selectQuery = "SELECT * FROM products WHERE product_id = ?";
        db.query(selectQuery, [productId], (selectErr, selectResults) => {
            if (selectErr) return reject(selectErr);
            if (selectResults.length === 0) return reject(new Error("Produit non trouvé"));

            const product = selectResults[0];
            const deleteQuery = "DELETE FROM products WHERE product_id = ?";
            db.query(deleteQuery, [productId], (deleteErr, deleteResults) => {
                if (deleteErr) return reject(deleteErr);

                if (product.image) {
                    const imagePath = getImagePath(product.image);
                    fs.unlink(imagePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Erreur lors de la suppression de l'image:", unlinkErr);
                        }
                        resolve({
                            success: true,
                            message: "Produit supprimé avec succès",
                            deletedProduct: product
                        });
                    });
                } else {
                    resolve({
                        success: true,
                        message: "Produit supprimé avec succès",
                        deletedProduct: product
                    });
                }
            });
        });
    });
};

