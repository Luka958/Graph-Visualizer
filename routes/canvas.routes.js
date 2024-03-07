const express = require('express');
const router = express.Router();
const express_formidable = require('express-formidable');
const {updateProperties} = require("../models/UserModel");

// express_formidable for handling FormData,
// app doesn't work when included in server.js
router.use(express_formidable());

router.post('/', async (req, res) => {
    if (req.fields['canvas-type-radio'] !== undefined) {
        req.session.props.canvas.canvasType = req.fields['canvas-type-radio'];
    }
    if (req.fields['grid-type-radio'] !== undefined) {
        req.session.props.canvas.gridType = req.fields['grid-type-radio'];
    }
    if (req.fields['canvas-background-color'] !== undefined) {
        req.session.props.canvas.backgroundColor = req.fields['canvas-background-color'];
    }
    if (req.fields['canvas-grid-color'] !== undefined) {
        req.session.props.canvas.gridColor = req.fields['canvas-grid-color'];
    }
    if (req.fields['canvas-thin-line-width'] !== undefined) {
        req.session.props.canvas.thin.value = req.fields['canvas-thin-line-width'];
    }
    if (req.fields['canvas-wide-line-width'] !== undefined) {
        req.session.props.canvas.wide.value = req.fields['canvas-wide-line-width'];
    }
    await updateProperties(req.session.user.id, req.session.props);
    res.end();
});

module.exports = router;