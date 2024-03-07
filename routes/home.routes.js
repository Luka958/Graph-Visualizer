const express = require('express');
const router = express.Router();
const DM = require('../models/DefaultsModel');
const {getProperties, insertProperties} = require("../models/UserModel");

router.get('/', async (req, res, next) => {
    if (req.session.user === undefined) {
        res.redirect('/login');

    } else {
        const rows = await getProperties(req.session.user.id);
        if (rows.length === 0) {
            // user accessing for the first time after login
            req.session.props = {
                vertex: DM.vertexSVG,
                edge: DM.edgeSVG,
                canvas: DM.canvasProps
            }
            await insertProperties(req.session.user.id, {
                vertex: JSON.stringify(DM.vertexSVG),
                edge: JSON.stringify(DM.edgeSVG),
                canvas: JSON.stringify(DM.canvasProps)
            });

        } else {
            // don't change props if they already exist
            if (req.session.props === undefined) {
                req.session.props = {
                    vertex: rows[0].vertex,
                    edge: rows[0].edge,
                    canvas: rows[0].canvas
                }
            }
        }
        // req.session.props.vertex = JSON.parse(req.session.props.vertex)
        // req.session.props.edge = JSON.parse(req.session.props.edge)
        // req.session.props.canvas = JSON.parse(req.session.props.canvas)

        res.render('home', {
            user: req.session.user,
            vertexProps: DM.vertexProps,
            edgeProps: DM.edgeProps,
            vertexSVG: req.session.props.vertex,
            edgeSVG: req.session.props.edge,
            canvasProps: req.session.props.canvas,
            userType: 'registered',
            imported: req.session.imported !== undefined ? Buffer.from(req.session.imported) : undefined
        });
        // save changes to session after rendering home page (session won't save automatically in this context)
        req.session.imported = undefined;
        req.session.save();
    }
});

module.exports = router;