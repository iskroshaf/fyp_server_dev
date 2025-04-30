//  routes/api/user_routes.js

const express = require('express');
const { userProfile} = require('../../controllers/userController');
const router = express.Router();

router.get('/user/profile', userProfile);

module.exports = router;
