const express = require('express')
const router = express.Router()

// middleware that is specific to this router
router.use(function(req, res, next) {
    next();
});

// define the home page route
router.get('/', function (req, res) {
    res.status(200).send('Project Malekai API Status: Online');
})
module.exports = router;
