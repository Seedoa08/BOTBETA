const { owners } = require('../config/owners');

module.exports = function isOwner(userId) {
    return owners.includes(userId);
};
