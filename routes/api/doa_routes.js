//  routes/api/doa_routes.js

const express = require('express')
const { readDoa } = require('../../controllers/doa_controller');
const router = express.Router();

router.get('/doa', readDoa)

module.exports = router;

