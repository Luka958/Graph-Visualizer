const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const {readFile} = require('node:fs/promises');
const router = express.Router();

router.post('/', (req, res, next) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async function (err, fields, files) {
        try {
            req.session.imported = await readFile(files.fileToImport.filepath, {encoding: 'utf8'});
            // save the vertex and edge SVG settings to the session
            const data = JSON.parse(req.session.imported);
            req.session.props.vertex = data.vertexSVG;
            req.session.props.edge = data.edgeSVG;

            // delete the temporary directory with the .json file
            fs.rmSync(files.fileToImport.filepath, { recursive: true, force: true });
            res.redirect('/');
        } catch (err) {
            console.log(err.message);
        }
    });
});

module.exports = router;