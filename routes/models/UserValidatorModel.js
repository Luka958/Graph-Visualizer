const { body } = require('express-validator');
const _ = require('lodash');

function validation(page) {
    return [
        body('first-name').not().isEmpty().not().isNumeric().trim().isLength({ min: 2 }),
        body('last-name').not().isEmpty().not().isNumeric().trim().isLength({ min: 2 }),
        ... (page === 'signup') ? [body('email').isEmail().normalizeEmail()] : [],
        body('date-of-birth').isDate(),
        body('country').not().isEmpty().not().isNumeric().trim().isLength({ min: 2 }),
        body('company').not().isNumeric().trim(),
        body('username').not().isEmpty().trim().isLength({ min: 2 })
    ];
}

function getErrorMessage(result) {
    let errMsg = '';

    for (let i = 0; i < result.length; i++) {
        errMsg += result[i].msg + ' ' + result[i].param;
        (i !== result.length - 1) ? errMsg += ', ' : errMsg += '!';
    }
    return _.capitalize(errMsg);
}

module.exports = { validation, getErrorMessage }