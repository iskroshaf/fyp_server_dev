//  routes/api/quran_routes.js

const express = require('express')
const { readQuran } = require('../../controllers/quran_controller');
const router = express.Router();

router.get('/quran', readQuran)

module.exports = router;

