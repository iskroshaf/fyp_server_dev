//  routes/api/doa_routes.js

const express = require('express')
const { getDoa } = require('../../controllers/doa_controller');
const router = express.Router();

router.get('/doa', getDoa)

module.exports = router;

