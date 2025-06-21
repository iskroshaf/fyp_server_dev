// routes/api/prayer_routes.js

const express = require('express');
const { startPrayerSession , updatePrayerSession, getSinglePrayerSession, addPrayerTimes, getProfilePrayerPerformance, getProfilesPrayerPerformance} = require('../../controllers/prayer_controller');

const router = express.Router();

router.post('/user/:profile_id/prayer-session', startPrayerSession);
router.get('/user/:profile_id/prayer-session', getSinglePrayerSession);
router.post('/esp/prayer-session/update', updatePrayerSession);
router.post('/profiles/:profile_id/prayer-times', addPrayerTimes);
router.get('/profiles/:profile_id/prayer-data', getProfilePrayerPerformance);
router.get('/user/profile/prayer-performance', getProfilesPrayerPerformance);

module.exports = router;
