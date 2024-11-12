import db from '../db/dbConnection.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [results] = await db.query(sql, [email]);

        if (!results.length) {
            return res.status(401).json({ message: 'Email or password is incorrect' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email or password is incorrect' });
        }

        // Création du token JWT
        const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        // Définir le cookie du jeton JWT
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        });

        // Insertion dans login_state après une authentification réussie
        const q = 'INSERT INTO login_state (user_id) VALUES (?)';
        await db.query(q, [user.user_id]);

        // Réponse de succès
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred' });
    }
};
