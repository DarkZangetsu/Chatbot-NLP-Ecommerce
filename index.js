import dotenv from 'dotenv-extended';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Routes from "./routes/index.js";
import { configurePages } from './pageConfig.js';

dotenv.load();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: '*',
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    allowedHeaders: 'X-Requested-With, content-type',
    credentials: true
}));
app.use(express.static('public'));

// Configuration des pages et des vues
configurePages(app);
app.use("/api", Routes);

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Application starts on port ${port}`);
});
