// routes/api/prayer_session_routes.js

const express = require('express');
const { startPrayerSession , updatePrayerSession, loadSinglePrayerSession} = require('../../controllers/prayer_session_controller');

const router = express.Router();

router.post('/user/:profile_id/prayer-session', startPrayerSession);
router.get('/user/:profile_id/prayer-session', loadSinglePrayerSession);
router.post('/esp/prayer-session/update', updatePrayerSession);


module.exports = router;
