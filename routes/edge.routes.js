const express = require('express');
const {updateProperties} = require("../models/UserModel");
const router = express.Router();

router.post('/', async (req, res, next) => {
    req.session.props.edge = req.body;
    await updateProperties(req.session.user.id, req.session.props);
    res.end();
});

module.exports = router;