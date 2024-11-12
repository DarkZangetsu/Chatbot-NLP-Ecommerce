import path from "path";
import { dirname } from "path";
import { fileURLToPath } from 'url';
import hbs from 'hbs';
import fs from 'fs';
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour configurer les chemins
function configurePaths() {
    return {
        publicDirectory: path.join(__dirname, './public'),
        viewsPath: path.join(__dirname, './pages'),
        partialsPath: path.join(__dirname, './pages/partials'),
        layoutsPath: path.join(__dirname, './pages/layouts')
    };
}

// Fonction pour configurer Handlebars
function configureHandlebars(app, paths) {
    app.set('view engine', 'hbs');
    app.set('views', paths.viewsPath);
    app.set('view options', { layout: 'layouts/main' });
    hbs.registerPartials(paths.partialsPath);
}

// Fonction pour enregistrer un partial
function registerPartial(partialName, filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        hbs.registerPartial(partialName, content);
        console.log(`${partialName} partial registered successfully`);
    } else {
        console.error(`${partialName}.hbs file not found at:`, filePath);
    }
}

// Fonction principale d'exportation
export function configurePages(app) {
    const paths = configurePaths();
    configureHandlebars(app, paths);

    // Enregistrement des partials
    registerPartial('homepage-slider', path.join(paths.partialsPath, 'homepage-slider.hbs'));
    registerPartial('product-section', path.join(paths.partialsPath, 'product-section.hbs'));
    registerPartial('chatBot-section', path.join(paths.partialsPath, 'chatBot-section.hbs'));
    registerPartial('cart-section', path.join(paths.partialsPath, 'cart-section.hbs'));
    registerPartial('singleProduct-section', path.join(paths.partialsPath, 'singleProduct-section.hbs'));
    registerPartial('checkout-section', path.join(paths.partialsPath, 'checkOut-section.hbs'));
    
    
    registerPartial('admin-sidebar', path.join(paths.partialsPath, 'adminSidebar.hbs'));
    registerPartial('admin-navbar', path.join(paths.partialsPath, 'adminNavbar.hbs'));
    registerPartial('admin-dashboard', path.join(paths.partialsPath, 'adminDashboard.hbs'));

    // Middleware pour les fichiers statiques
    app.use(express.static(paths.publicDirectory));
}