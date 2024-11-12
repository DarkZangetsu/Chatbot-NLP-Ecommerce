function createIntentName(firstTrainingPhrase) {
    const trainingPhraseReplaced = firstTrainingPhrase.replace(/\s/g, '_');
    // Corriger length ici
    const strLength = trainingPhraseReplaced.length; // au lieu de lenght
    let strFixedLength = '';
    if (strLength > 20) {
        strFixedLength = trainingPhraseReplaced.substring(0, 21);
    } else {
        const filler = '_'.repeat(20 - strLength);
        strFixedLength = `${trainingPhraseReplaced}${filler}`;
    }
    return `${strFixedLength}_${Date.now()}`;
}

function getSession(conv) {
    const { session } = conv.body;
    const sessionIdArr = session.split('/');
    // Corriger length ici aussi
    return sessionIdArr[sessionIdArr.length - 1]; // au lieu de lenght
}

export {
    createIntentName,
    getSession,
}