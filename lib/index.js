'use strict';

const restify = require('restify');
const semver = require('semver');

const security = require('./security');
const statusCheck = require('./status-check');

const start = async (options, logger) => {

    const version = semver.valid(options.version) ? options.version : '0.0.0';

    const server = restify.createServer({
        name: options.name,
        version: version,
    });

    // Handle path prefix
    server.pre((req, res, next) => {
        req.url = req.url.replace(options.appPath, '');
        next();
    });

    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser({
        mapParams: true
    }));
    server.use(restify.plugins.bodyParser({
        mapParams: true
    }));

    // The health check should be exposed before the security check
    server.get('/status', statusCheck);

    // Make sure the request is proxied through our API
    server.use(security.proxyCheck(options.additionalSecurityCheck));

    server.use(async (req, res, next) => {

        try {
            await next();
        } catch (err) {
            logger.error(err);
            let status = 500;
            if (err.statusCode) {
                status = err.statusCode;
            } else if (res.statusCode !== 200) {
                status = res.statusCode;
            }
            res.status(status);
            let message = err.message ? err.message : err.stack;
            res.send({success: false, message});
        }
    });

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
