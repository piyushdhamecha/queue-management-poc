const express = require('express');

const router = express.Router();

router.use('/text-to-image', require('./textToImage'));

module.exports = router;
