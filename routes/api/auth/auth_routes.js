//  routes/api/auth/auth_routes.js

const express = require('express');
const { googleLogin } = require('../../../controllers/authController');
const router = express.Router();

router.post('/auth/google', googleLogin);

module.exports = router;
