// ./controllers/categoryController.js
import db from '../db/dbConnection.js';
import multer from 'multer';

// Configuration de multer pour le téléchargement de fichiers
import fs from 'fs';
import path from 'path';

// Définir le chemin absolu vers le dossier d'images
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public', 'images');

// Fonction utilitaire pour obtenir le chemin absolu d'une image
const getImagePath = (filename) => path.join(IMAGE_DIRECTORY, filename);


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = path.resolve('./public/images');
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const fileExt = path.extname(file.originalname);
//         const safeName = req.body.category_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
//         const newFileName = `${safeName}${fileExt}`;
//         cb(null, newFileName);
//     }
// });
// Mise à jour de la configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(IMAGE_DIRECTORY)) {
            fs.mkdirSync(IMAGE_DIRECTORY, { recursive: true });
        }
        cb(null, IMAGE_DIRECTORY);
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const safeName = req.body.category_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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

// Récupérer les catégories
export const getCategories = (req, res) => {
    const sql = "SELECT * FROM categories ORDER BY category_id DESC";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
};


export const getCategory = (category_id) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM categories WHERE category_id = ?", [category_id], (err, data) => {
            if (err) reject(err);
            if (!data.length) reject(new Error("Category not found"));
            resolve(data[0]);
        });
    });
};


export const createCategory = (req, res) => {
    const sql = "INSERT INTO categories (`category_name`, `description`, `categ_image`) VALUES (?)";
    const fileName = req.file ? req.file.filename : null;
    const values = [
        req.body.category_name,
        req.body.description,
        fileName // Utilisation du nom de fichier de l'image
    ];

    db.query(sql, [values], (err, data) => {
        if (err) {
            console.error("Erreur lors de la création de la catégorie:", err);
            return res.status(500).json(err);
        }
        //return res.json("La catégorie a été créée avec succès");
        return res.json({
            message: "La catégorie a été créée avec succès",
            category: {
                category_name: req.body.category_name,
                description: req.body.description,
                categ_image: fileName
            }
        });
    });
};

// Mise à jour de la fonction updateCategory
export const updateCategory = (req) => {
    return new Promise((resolve, reject) => {
        const category_id = req.params.category_id;

        db.query("SELECT * FROM categories WHERE category_id = ?", [category_id], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return reject(new Error("Catégorie non trouvée"));

            const oldCategory = results[0];
            let newFileName = oldCategory.categ_image;

            const updateDatabase = () => {
                const q = "UPDATE categories SET `category_name` = ?, `description` = ?, `categ_image` = ? WHERE category_id = ?";
                const values = [req.body.category_name, req.body.description, newFileName];

                db.query(q, [...values, category_id], (err, data) => {
                    if (err) return reject(err);
                    resolve({
                        category_id,
                        category_name: req.body.category_name,
                        description: req.body.description,
                        categ_image: newFileName
                    });
                });
            };

            if (req.file) {
                const fileExt = path.extname(req.file.originalname);
                const safeName = req.body.category_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                newFileName = `${safeName}${fileExt}`;

                const oldFilePath = oldCategory.categ_image ? getImagePath(oldCategory.categ_image) : null;
                const newFilePath = getImagePath(newFileName);

                fs.rename(req.file.path, newFilePath, (err) => {
                    if (err) return reject(err);

                    if (oldFilePath && oldCategory.categ_image !== newFileName) {
                        fs.unlink(oldFilePath, (err) => {
                            if (err && err.code !== 'ENOENT') console.error("Erreur lors de la suppression de l'ancien fichier:", err);
                            updateDatabase();
                        });
                    } else {
                        updateDatabase();
                    }
                });
            } else if (req.body.category_name !== oldCategory.category_name && oldCategory.categ_image) {
                const fileExt = path.extname(oldCategory.categ_image);
                const safeName = req.body.category_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                newFileName = `${safeName}${fileExt}`;

                const oldFilePath = getImagePath(oldCategory.categ_image);
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

// Mise à jour de la fonction deleteCategory
export const deleteCategory = (categoryId) => {
    return new Promise((resolve, reject) => {
        const selectQuery = "SELECT * FROM categories WHERE category_id = ?";
        db.query(selectQuery, [categoryId], (selectErr, selectResults) => {
            if (selectErr) return reject(selectErr);
            if (selectResults.length === 0) return reject(new Error("Catégorie non trouvée"));

            const category = selectResults[0];

            const deleteQuery = "DELETE FROM categories WHERE category_id = ?";
            db.query(deleteQuery, [categoryId], (deleteErr, deleteResults) => {
                if (deleteErr) return reject(deleteErr);

                if (category.categ_image) {
                    const imagePath = getImagePath(category.categ_image);
                    fs.unlink(imagePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Erreur lors de la suppression de l'image:", unlinkErr);
                        }
                        resolve({
                            message: "Catégorie supprimée avec succès",
                            deletedCategory: category
                        });
                    });
                } else {
                    resolve({
                        message: "Catégorie supprimée avec succès",
                        deletedCategory: category
                    });
                }
            });
        });
    });
};
