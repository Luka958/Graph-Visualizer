const express = require('express');
const router = express.Router();
const express_formidable = require('express-formidable');

router.use(express_formidable());

router.post('/', (req, res) => {
    const item = {
        id: req.session.user.id,
        username: req.session.user.username,
        email: req.session.user.email,
        text: req.fields['bug-report-text']
    }
    res.end();
});

module.exports = router;