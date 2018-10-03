
module.exports = function (req, res) {
    res.send({
        status: 'ok',
        name: req.serverName,
        version: req._matchedVersion,
    });
};


