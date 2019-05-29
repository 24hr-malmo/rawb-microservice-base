const axios = require('axios');

const ms = require('../');
const PORT = 9000;

const start = async () => {

    let options = {
        name: 'foo 1.0.0',
        version: '1.0.0',
        appPath:  '/data',
        port: PORT,
        logger: { error: console.log, verbose: console.log, },
    };

    let server = await ms.start(options);

    server.get('/tjena', (req, res, next) => {
        res.send({hej: 1});
        next();
    });

    server.post('/foo', async (req, res, next) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.send({answer: 'bar'});
        await next();
    });

    // Normal errors
    server.get('/error-1', (req, res, next) => {
        next({name: 'error-1'});
    });

    // throw errors
    server.get('/error-2', async (req, res, next) => {
        throw new Error('error-2');
    });

    server.get('/error-3', (req, res, next) => {
        next({name: 'error-1', toJSON: () => {
            return {
                custom: 'foo',
                data: 1
            };
        }});
    });

    console.log('Server started');

    const serverUrl = `http://localhost:${PORT}`;

    try {
        console.log('Call /tjena');
        let response = await axios.get(`${serverUrl}/tjena`);
        let body = await response.text();
        console.log('Result 1', body);
    } catch (err) {
        console.log('Error', err.code, err.stack);
    }

    try {
        console.log('Call /foo');
        let req = await axios.post(`${serverUrl}/foo`, { method: 'POST' });
        let res = await req.text();
        console.log('Result 2', res);
    } catch (err) {
        console.log('Error', err.code, err.stack);
    }

    try {
        console.log('Call /data/error-1');
        let req = await axios.get(`${serverUrl}/data/error-1`);
        let res = await req.text();
        console.log('res', res);
    } catch (err) {
        console.log('Error', err.code, err.stack);
    }

    try {
        console.log('Call /data/error-2');
        let req = await axios.get(`${serverUrl}/data/error-2`);
        let res = await req.text();
        console.log('res', res);
    } catch (err) {
        console.log('Error', err.code, err.stack);
    }


};

start();
