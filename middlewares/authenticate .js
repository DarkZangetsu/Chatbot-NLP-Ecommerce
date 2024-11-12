// ./middlewares/authenticate.js
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Vous pouvez ajouter les informations de l'utilisateur à la requête
        next(); // Passer au middleware suivant ou à la route
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token' });
    }
};
