let ms = require('../');

const start = async () => {

    let options = {
        name: 'foo 1.0.0',
        version: '1.0.0',
        appPath:  '',
        port: 9000,
    };

    let server = await ms.start(options);

    server.get('/tjena', (req, res, next) => {
        res.send({hej: 1});
        next();
    });

};

start();
