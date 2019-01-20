const restify = require('restify');
const semver = require('semver');

const security = require('./security');
const statusCheck = require('./status-check');

const start = async (options) => {

    const versionString = options.version ? options.version.replace(/[^0-9\.]/g, '') : '1.0.0';
    const version = semver.valid(versionString) ? versionString : '1.0.0';

    const server = restify.createServer({
        ...options,
        version: version,
    });

    // Handle path prefix
    server.pre((req, res, next) => {
        req.url = req.url.replace(options.appPath, '');
        return next();
    });

    // The health check should be exposed before the security check
    server.get('/status', statusCheck);
   
    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser({ mapParams: true }));
    server.use(restify.plugins.bodyParser({ multiples: true, mapParams: true }));

    // Make sure the request is proxied through our API
    server.use(security.proxyCheck(options.additionalSecurityCheck));

    // It seems that our error hanlding below doesnt work, so this is a copy that 
    // actually works. It might that by upgrading to 7.x we introudced an incompability with await
    // and have to fallback to normal error handling. From what I read, 
    // we cant handle await async and throw errors as in koa, meaning that we need to
    // throw errors with the normal next(err) mechanichs
    server.on('restifyError', function(req, res, err, callback) {

        let status = 500;
        if (err.statusCode || err.status) {
            status = err.statusCode || err.status;
        } else if (res.statusCode !== 200) {
            status = res.statusCode;
        }
        if (options.logger) {
            options.logger.error(err.message, status, err.stack);
        }
        res.status(status);
        let message = err.message ? err.message : err.stack;
        res.send({success: false, message});

        return callback();

    });

    server.use(async (req, res, next) => {

        try {
            await next();
        } catch (err) {
            let status = 500;
            if (err.statusCode || err.status) {
                status = err.statusCode || err.status;
            } else if (res.statusCode !== 200) {
                status = res.statusCode;
            }
            if (options.logger) {
                options.logger.error(err.message, status, err.stack);
            }
            res.status(status);
            let message = err.message ? err.message : err.stack;
            res.send({success: false, message});
        }
    });

    let asyncHandler = (original) => (route, func) => {
        if (!Array.isArray(func) && (func && func.then || func[Symbol.toStringTag] === 'AsyncFunction')) {
            original(route, async (req, res, next) => {
                try {
                    await func(req, res, next);
                } catch (err) {
                    if (!err.name) {
                        err.name = err.parsedData ? err.parsedData.message : (err.type || err.message || 'unknown-error-no-name');
                    }
                    next(err);
                }
            });
        } else {
            original(route, func);
        }
    };

    // We decorate the original methods so we can use async await
    server.get = asyncHandler(server.get.bind(server));
    server.post = asyncHandler(server.post.bind(server));
    server.del = asyncHandler(server.del.bind(server));
    server.patch = asyncHandler(server.patch.bind(server));
    server.head = asyncHandler(server.head.bind(server));

    return new Promise((resolve, reject) => {
        server.listen(options.port, async (err) => { // eslint-disable-line
            if (err) {
                return reject(err);
            }
            resolve(server);
        });
    });

};

exports.start = start;
