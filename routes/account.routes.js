const express = require('express');
const router = express.Router();
const { User, getByUsername} = require('../models/UserModel');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const UserValidatorModel = require("./models/UserValidatorModel");

router.get('/', (req, res, next) => {
    if (req.session.user === undefined) {
        res.redirect('/');

    } else {
        res.render('account', {
            user: req.session.user,
            error: null
        });
    }
});

router.post('/', UserValidatorModel.validation('account'), (req, res, next) => {
    const result = validationResult(req).array();
    if (result.length !== 0) {
        res.render('account', {
            user: req.session.user,
            error: UserValidatorModel.getErrorMessage(result)
        });
        return;
    }
    getByUsername(req.body['username']).then(rows => {
        if ((rows.length === 0 && req.session.user.username !== req.body['username']) ||
            (rows.length === 1 && req.session.user.username === req.body['username'])) {
            let user = new User(
                req.session.user.id,
                req.session.user.username, req.session.user.email, req.session.user.firstName,
                req.session.user.lastName, req.session.user.dateOfBirth, req.session.user.country,
                req.session.user.company, req.session.user.password, req.session.user.role
            );
            user.updateUser(
                req.body['username'], req.body['first-name'], req.body['last-name'],
                req.body['date-of-birth'], req.body['country'], req.body['company'],
                bcrypt.hashSync(req.body['password'], 7)).

            then(result => {
                req.session.user = user;

                res.render('account', {
                    user: req.session.user,
                    ...(result.rowCount === 1) && {
                        // success: 'Account settings updated successfully.',
                        error: null,
                    },
                    ...(result.rowCount === 0) && {
                        error: 'Account settings didn\'t update.'
                    }
                });
            });

        } else {
            res.render('account', {
                user: req.session.user,
                error: 'Chosen username already exists!'
            });
        }
    });
});

module.exports = router;