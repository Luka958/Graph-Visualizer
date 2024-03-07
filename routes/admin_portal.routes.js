const express = require('express');
const router = express.Router();
const { getUsers, updateUsersRole } = require('../models/UserModel');

router.get('/', (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/login');
    }
    if (req.session.user.role === 'admin') {
        getUsers().then(rows => {
            res.render('admin_portal', {
                users: rows
            });
        });

    } else {
        res.status(403).render('forbidden');
    }
});

router.post('/', (req, res) => {
    console.log("here", req.query)
    updateUsersRole(Object.keys(req.query), Object.values(req.query)).then(() => {
        // get updated users
        getUsers().then(rows => {
            res.render('admin_portal', {
                users: rows
            });
        });
    });
});

module.exports = router;