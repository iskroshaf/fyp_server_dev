// routes/api/prayer_routes.js

const express = require('express');
const { getProfilePoints } = require('../../controllers/point_controller');

const router = express.Router();

router.get('/:profile_id/points', getProfilePoints);

module.exports = router;
