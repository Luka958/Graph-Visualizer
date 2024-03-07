const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, insertUser, getByUsername} = require('../models/UserModel');
const { formatDate } = require("../models/DateModel");
const UserValidatorModel = require("./models/UserValidatorModel");

router.get('/', (req, res, next) => {
    res.render('signup', { error: null });
});

router.post('/', UserValidatorModel.validation('signup'), (req, res, next) => {
    const result = validationResult(req).array();
    if (result.length !== 0) {
        res.render('signup', { error: UserValidatorModel.getErrorMessage(result) });
        return;
    }
    let username = req.body['username'];
    let password = req.body['password'];

    getByUsername(username).then(async rows => {
        if (rows.length === 0) {
            // user doesn't exist in DB
            // the 2nd argument represents the number of rounds for securing the hash, [5, 15]
            password = bcrypt.hashSync(password, 7);

            insertUser(
                username, req.body['email'], req.body['first-name'], req.body['last-name'],
                req.body['date-of-birth'], req.body['country'], req.body['company'], password,
                'student'
            ).then(() => {
                getByUsername(username).then(async rows2 => {
                    let row = rows2[0];
                    req.session.user = new User(
                        row['id'], row['username'], row['email'], row['first_name'], row['last_name'],
                        formatDate(row['date_of_birth']),
                        row['country'], row['company'], row['password'], row['role']);

                    // save session before redirect
                    res.redirect('/')
                    // req.session.save(err => err ? res.status(500).send(err) : res.redirect('/'));
                })
            });

        } else {
            res.render('signup', { error: 'The user with provided e-mail already exists!' });
        }
    })
});

module.exports = router;