const errors = require('../errors');

async function handleErrorsInFetchRes(proxyResponse, name) {
    if (!proxyResponse.ok) {
        const proxyError = await proxyResponse.json();
        let customError;
        if (proxyError.message) {
            customError = new errors.StatusError(proxyResponse.status, proxyError.message, name);
        } else {
            customError = new errors.StatusError(proxyResponse.status, 'external-error', name);
            customError.originalError = proxyError;
        }
        throw customError;
    } else if (proxyResponse.status === 404 || proxyResponse.status === 401) {
        throw new errors.StatusError(proxyResponse.status, 'not found', name);
    }
    return proxyResponse;
}

module.exports = {
    handleErrorsInFetchRes: handleErrorsInFetchRes
};
