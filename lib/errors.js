
var NotFound = function (msg, constr) {
    Error.captureStackTrace && Error.captureStackTrace(this, constr || this); // eslint-disable-line
    this.message = msg || 'Default Error Message';
    this.statusCode = 404;
    this.name = 'NotFound';

};

NotFound.prototype = Error.prototype;

module.exports = {
    NotFound,
    StatusError: function(statusCode, errorMessage, serviceName) {
        let error = new Error();
        error.message = errorMessage;
        error.statusCode = statusCode;
        error.originService = serviceName;
        return error;
    }
};
