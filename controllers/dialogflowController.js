import { runSample } from '../lib/dialogflow/index.js';

/**
 * Gère les requêtes entrantes pour Dialogflow.
 * @param {Object} req - L'objet de requête Express.
 * @param {Object} res - L'objet de réponse Express.
 */
async function handleDialogflowRequest(req, res) {
    try {
        const { MSG } = req.body;
        
        if (!MSG) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await runSample(MSG);
        res.json({ Reply: response });
    } catch (error) {
        console.error('Error handling Dialogflow request:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Sorry, something went wrong.' });
    }
}

export default handleDialogflowRequest;
