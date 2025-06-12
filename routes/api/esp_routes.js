// routes/api/esp_routes.js

const express = require('express');
const { reportEspStatus, readEspStatus } = require('../../controllers/esp_controller');
const router = express.Router();

router.post('/esp/status', reportEspStatus);
router.get('/esp/status/:espId', readEspStatus);

module.exports = router;
