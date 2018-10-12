require('isomorphic-fetch');

let ms = require('../');

const start = async () => {

    let options = {
        name: 'foo 1.0.0',
        version: '1.0.0',
        appPath:  '/data',
        port: 9000,
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

    console.log('Server started');

    setTimeout( async() => {




    try {
        let req = await fetch('http://localhost:9000/tjena');
        let res = await req.text();
        console.log('Result 1', res);
    } catch (err) {
        console.log(err);
    }

    try {
        let req = await fetch('http://localhost:9000/foo', { method: 'POST' });
        let res = await req.text();
        console.log('Result 2', res);
    } catch (err) {
        console.log(err);
    }



    try {
        let req1 = await fetch('http://localhost:9000/data/error-2');
        let res1 = await req1.text();
        console.log('res1', res1);
    } catch (err) {
        console.log(err);
    }

    }, 5000);



};

start();
