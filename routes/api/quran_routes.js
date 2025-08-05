//  routes/api/quran_routes.js

const express = require('express')
const { getQuran,updateQuranCurrentPage, getQuranCurrentPage } = require('../../controllers/quran_controller');
const router = express.Router();

router.get('/quran', getQuran)
router.put('/quran-progress/:profile_id', updateQuranCurrentPage);
router.get('/quran-progress/:profile_id', getQuranCurrentPage);

module.exports = router;

