import dotenv from 'dotenv';
import mysql from 'mysql';

dotenv.config(); // Charger les variables d'environnement

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect((error) => {
    if (error) {
        console.error('Database connection failed:', error);
        return; // Stoppe l'exécution si la connexion échoue
    }
    console.log('MySQL Connected...');
});

export default db;
