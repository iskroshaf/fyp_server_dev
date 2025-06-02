// routes/api/esp_routes.js

const express = require('express');
const { reportEspStatus, getEspStatus } = require('../../controllers/esp_controller');
const router = express.Router();

router.post('/esp/status', reportEspStatus);
router.get('/esp/status/:espId', getEspStatus);

module.exports = router;
