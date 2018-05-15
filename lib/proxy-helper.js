'use strict';

const errorHelpers = require('./helpers/errors');

const fetch = require('isomorphic-fetch');

exports.init = (apiToken) => {

    const baseOptions = {
        headers: {
            'Authorization': 'Bearer ' + apiToken, // config.API_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    async function handleProxyResponse(url, options){

        try {
            let res = await fetch(url, options);

            await errorHelpers.handleErrorsInFetchRes(res); // eslint-disable-line

            let response = res.headers.get('content-type').indexOf('application/json') !== -1 ? await res.json() : await res.text();

            return response;
        } catch (err) {
            return {
                status: 500,
                error: err
            };
        }
    }

    return {

        get: async function(url, extraHeaders){

            let options = Object.assign({
                method: 'GET'
            }, baseOptions);

            options.headers = Object.assign(options.headers, extraHeaders);

            return handleProxyResponse(url, options);

        },

        post: async function(url, data){

            if (typeof data !== 'string') { // Convert anything that is not a string into a JSON string
                data = JSON.stringify(data); // eslint-disable-line
            }
            let options = Object.assign({
                method: 'POST',
                body: data
            }, baseOptions);

            return handleProxyResponse(url, options);
        },

        getSecurityHeaders: (headers) => {
            return Object.keys(headers).reduce((list, key) => {
                if (key.indexOf('x-') === 0) {
                    list[key] = headers[key];
                }
                return list; 
            }, {});
        }

    };

};


