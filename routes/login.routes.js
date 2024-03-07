const express = require('express');
const { User, getByUsername } = require("../models/UserModel");
const bcrypt = require('bcrypt');
const router = express.Router();
const { formatDate } = require("../models/DateModel");

router.get('/', (req, res, next) => {
    res.render('login', { error: null });
});

router.post('/', (req, res, next) => {
    if (req.body['username'] === undefined || req.body['password'] === undefined) {
        res.redirect('/login');

    } else {
        getByUsername(req.body['username']).then(rows => {
            const row = rows[0];

            if (row === undefined) {
                res.render('login', {
                    error: 'Username or password is incorrect!'
                });
                return;
            }

            const user = new User(
                row['id'], row['username'], row['email'], row['first_name'], row['last_name'],
                formatDate(row['date_of_birth']),
                row['country'], row['company'], row['password'], row['role']
            );

            if (bcrypt.compareSync(req.body['password'], user.password)) {
                req.session.user = user;
                res.redirect('/');

            } else {
                res.render('login', {
                    error: 'Username or password is incorrect!'
                });
            }
        });
    }
});

module.exports = router;