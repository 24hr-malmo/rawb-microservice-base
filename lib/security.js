
const proxyCheck = (additionalSecurityCheck) => (req, res, next) => {

    // We need to check this first, since restify will not run any middlewares if we dont have a 
    // server.get or server.post. It will only trigger middlewares if we have some route.
    // But the routes will always be executed AFTER a middleware, which means that our security
    // check will happen before, and status will not be allowed without a being called form the api.
    // So we check if its a status call, and allow it anyway.
    if (req.url === '/status') {
        return next();
    }

    let develop = process.env.NODE_ENV !== 'production';

    if (typeof additionalSecurityCheck === 'function') {
        develop = develop && additionalSecurityCheck(req);
    }

    let isFromApi = req.headers['proxy-service'] && req.headers['proxy-service'] === 'api';

    if (develop || isFromApi) {
        next();
    } else {
        res.status(401);
        res.send({message: 'Requests must be proxied through the API'});
    }

};


module.exports = {
    proxyCheck: proxyCheck
};
