//  routes/api/quran_routes.js

const express = require('express')
const {getQuran} = require('../../controllers/quran_controller');
const router = express.Router();

router.get('/quran', getQuran)

module.exports = router;

