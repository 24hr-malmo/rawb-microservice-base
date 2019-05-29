const assert = require('assert');
const axios = require('axios');

const ms = require('../');
const PORT = 9009;

const options = {
    name: 'foo 1.0.0',
    version: '1.0.0',
    appPath:  '/data',
    port: PORT,
    logger: { error: () => {}, verbose: console.log, },
};

describe('Errors', function () {

    let server;
    const serverUrl = `http://localhost:${PORT}`;

    afterEach(async function() {
        await server.close();
    });

    it('A GET request should answer as expected', async function () {

        server = await ms.start(options);

        server.get('/tjena', (req, res, next) => {
            res.send({ hej: 1 });
            next();
        });

        let { data } = await axios.get(`${serverUrl}/tjena`);

        assert(1 === data.hej);

    });

    it('A POST request should answer as expected', async function () {

        server = await ms.start(options);

        server.post('/foo', async (req, res, next) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            res.send({answer: 'bar'});
            await next();
        });

        let { data } = await axios.post(`${serverUrl}/foo`, {});

        assert(data.answer === 'bar');

    });

    it('An endpoint that throws an error should responde as an error', async function () {

        server = await ms.start(options);

        server.get('/error', async (req, res, next) => {
            throw new Error('error-2');
        });

        try {

            await axios.get(`${serverUrl}/error`, {});

        } catch (err) {

            let { data } = err.response;

            assert(err.response.status !== 404);
            assert(data.success === false);
            assert(data.message === 'error-2');
            assert(!!data.stack);

        }

    });

    it('An endpoint that throws an error with a toJSON should return the decorated body', async function () {

        server = await ms.start(options);

        server.get('/error', async (req, res, next) => {
            next({name: 'error-1', toJSON: () => {
                return {
                    custom: 'foo',
                    data: 1
                };
            }});
        });

        try {

            await axios.get(`${serverUrl}/error`, {});

        } catch (err) {

            let { data } = err.response;

            assert(err.response.status !== 404);
            assert(data.success === false);
            assert(data.name === 'error-1');
            assert(data.custom === 'foo');

        }

    });




});
