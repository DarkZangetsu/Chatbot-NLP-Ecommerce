import { IntentsClient, EntityTypesClient, SessionsClient } from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

const projectId = process.env.PROJECT_ID;
const sessionId = uuidv4();

const dfCredentials = {
    projectId,
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
};

const intentsClient = new IntentsClient(dfCredentials);
const entityTypesClient = new EntityTypesClient(dfCredentials);
const sessionClient = new SessionsClient(dfCredentials);

const agentPath = intentsClient.projectAgentPath(projectId);
const entityTypePath = entityTypesClient.projectAgentPath(projectId);

// Fonction pour créer une intention (intent) dans Dialogflow
async function createIntent(displayName, trainingPhrasesParts, messageTexts) {
    const trainingPhrases = trainingPhrasesParts.map(partText => ({
        type: 'EXAMPLE',
        parts: [{ text: partText }]
    }));

    const intent = {
        displayName,
        trainingPhrases,
        messages: [{ text: { text: messageTexts } }],
        webhookState: 'WEBHOOK_STATE_ENABLED',
    };

    const [response] = await intentsClient.createIntent({ parent: agentPath, intent });
    return response;
}



// Fonction pour créer une entité
async function createEntityType(entityTypeDisplayName, newEntities) {
    try {
        const [entityTypes] = await entityTypesClient.listEntityTypes({ parent: entityTypePath });
        let existingEntityType = entityTypes.find(et => et.displayName === entityTypeDisplayName);

        if (existingEntityType) {
            const existingEntities = existingEntityType.entities.map(entity => entity.value);
            const entitiesToAdd = newEntities.filter(entity => !existingEntities.includes(entity));

            if (entitiesToAdd.length === 0) {
                console.log('Aucune nouvelle entité à ajouter.');
                return existingEntityType;
            }

            existingEntityType.entities.push(...entitiesToAdd.map(entity => ({
                value: entity,
                synonyms: [entity]
            })));

            const [updatedEntityType] = await entityTypesClient.updateEntityType({
                entityType: existingEntityType,
                updateMask: { paths: ['entities'] }
            });
            return updatedEntityType;
        } else {
            const entityType = {
                displayName: entityTypeDisplayName,
                kind: 'KIND_MAP',
                entities: newEntities.map(entity => ({
                    value: entity,
                    synonyms: [entity]
                }))
            };

            const [createdEntityType] = await entityTypesClient.createEntityType({
                parent: entityTypePath,
                entityType
            });
            return createdEntityType;
        }
    } catch (error) {
        console.error('Erreur lors de la création ou de la mise à jour de l\'entité:', error);
        throw error;
    }
}

async function updateEntityInEntityType(entityTypeDisplayName, oldEntityValue, newEntityValue) {
    try {
        const [entityTypes] = await entityTypesClient.listEntityTypes({ parent: entityTypePath });
        const existingEntityType = entityTypes.find(et => et.displayName === entityTypeDisplayName);

        if (existingEntityType) {
            const entityIndex = existingEntityType.entities.findIndex(entity => entity.value === oldEntityValue);

            if (entityIndex !== -1) {
                existingEntityType.entities[entityIndex] = {
                    value: newEntityValue,
                    synonyms: [newEntityValue]
                };

                const [updatedEntityType] = await entityTypesClient.updateEntityType({
                    entityType: existingEntityType,
                    updateMask: { paths: ['entities'] }
                });

                console.log(`Entité mise à jour avec succès dans le type d'entité ${entityTypeDisplayName}`);
                return updatedEntityType;
            } else {
                console.log(`Entité ${oldEntityValue} non trouvée dans le type d'entité ${entityTypeDisplayName}`);
                return null;
            }
        } else {
            console.log(`Type d'entité ${entityTypeDisplayName} non trouvé`);
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'entité:', error);
        throw error;
    }
}

// Fonction pour supprimer une entité d'un type d'entité
async function deleteEntityFromEntityType(entityTypeDisplayName, entityToDelete) {
    try {
        const [entityTypes] = await entityTypesClient.listEntityTypes({ parent: entityTypePath });
        const existingEntityType = entityTypes.find(et => et.displayName === entityTypeDisplayName);

        if (existingEntityType) {
            existingEntityType.entities = existingEntityType.entities.filter(
                entity => entity.value !== entityToDelete
            );

            const [updatedEntityType] = await entityTypesClient.updateEntityType({
                entityType: existingEntityType,
                updateMask: { paths: ['entities'] }
            });
            return updatedEntityType;
        } else {
            console.log(`Type d'entité ${entityTypeDisplayName} non trouvé.`);
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'entité:', error);
        throw error;
    }
}



// Fonction pour envoyer une requête à l'agent Dialogflow et obtenir une réponse
async function runSample(msg) {
    try {
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: msg,
                    languageCode: 'en-US',
                },
            },
        };

        const [response] = await sessionClient.detectIntent(request);
        return response.queryResult.fulfillmentText;
    } catch (error) {
        console.error('Error detecting intent:', error);
        throw new Error('Failed to communicate with Dialogflow');
    }
}

export {
    createIntent,
    createEntityType,
    updateEntityInEntityType,
    deleteEntityFromEntityType,
    runSample
};