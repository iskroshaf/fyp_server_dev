//  routes/api/auth/auth_routes.js

const express = require('express');
const { googleLogin, userRegister} = require('../../../controllers/authController');
const router = express.Router();

router.post('/auth/google', googleLogin);
router.post('/auth/register', userRegister);

module.exports = router;
