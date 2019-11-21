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
        if (options.appPath) {
            req.url = req.url.replace(options.appPath, '');
        }
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
            let requestId = req.headers['x-request-id'];
            options.logger.error(`Restify reported an error: ${err.message}, ${status}, \n${err.stack} `, { requestId });
        }
        res.status(status);
        let response = {
            success: false,
            message: err.message,
        };
        if (err.statusCode !== 404) {
            response = {
                ...response,
                name: err.name,
                stack: err.stack,
            }

            if (typeof err.toJSON === 'function') {
                response = {
                    ...response,
                    ...err.toJSON()
                }
            }
        }

        res.send(response);

        return callback();
    })

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
                let requestId = req.headers['x-request-id'];
                options.logger.error(`Error reported an error: ${err.message}, ${status}, \n${err.stack} `, { requestId });
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
                        err.name = err.name || 'unknown-error-no-name';
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
    server.put = asyncHandler(server.put.bind(server));
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
