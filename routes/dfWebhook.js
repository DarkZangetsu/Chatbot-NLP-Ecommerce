import express from 'express';
import { dialogflow } from 'actions-on-google';
import * as df from '../lib/dialogflow/index.js';
import { getSession, createIntentName } from '../helpers/index.js';

const router = express.Router();
const gaApp = dialogflow({
  debug: false,
  clientId: process.env.CLIENT_ID,
});

const userInputBuffer = {};

gaApp.fallback(async (conv) => {
  const { intent } = conv;
  const sessionId = getSession(conv);

  switch (intent) {
    case 'Add_Rule': {
      const { training_phrase, bots_response } = conv.parameters;
      await df.createIntent(
        createIntentName(training_phrase),
        [training_phrase],
        [bots_response],
      );
      conv.ask(conv.body.queryResult.fulfillmentText);
      break;
    }
    case 'Default Fallback Intent': {
      userInputBuffer[sessionId] = conv.query;
      conv.ask(conv.body.queryResult.fulfillmentText);
      break;
    }
    case 'Default Fallback Intent - no': {
      delete userInputBuffer[sessionId];
      conv.ask(conv.body.queryResult.fulfillmentText);
      break;
    }
    case 'Default Fallback Intent - yes': {
      const training_phrase = userInputBuffer[sessionId];
      conv.followup('add_rule', { training_phrase });
      break;
    }
    default:
      return conv.ask(conv.body.queryResult.fulfillmentText);
  }
});

gaApp.catch((conv, error) => {
  console.error('Error in Dialogflow conversation:', error);
  return conv.ask('Oops, something went wrong... Please try again later.');
});

router.post('/webhook', gaApp);

export default router;