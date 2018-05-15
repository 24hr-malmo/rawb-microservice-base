
const proxyCheck = (additionalSecurityCheck) => (req, res, next) => {

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
