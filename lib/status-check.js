'use strict';

module.exports = function status(req, res) {
    res.send({status: 'ok', name: req.serverName});
};


