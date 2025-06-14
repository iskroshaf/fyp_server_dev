// routes/api/prayer_session_routes.js

const express = require('express');
const { startPrayerSession , updatePrayerSession, readSinglePrayerSession} = require('../../controllers/prayer_session_controller');

const router = express.Router();

router.post('/user/:profile_id/prayer-session', startPrayerSession);
router.get('/user/:profile_id/prayer-session', readSinglePrayerSession);
router.patch('/esp/prayer-session/update', updatePrayerSession);


module.exports = router;
