//  routes/api/prayer_times_routes.js

const express = require('express');
const { addPrayerTimes } = require('../../controllers/prayer_times_controller');
const router = express.Router();

router.post('/profiles/:profile_id/prayer-times', addPrayerTimes);

module.exports = router;
