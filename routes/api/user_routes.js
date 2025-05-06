//  routes/api/user_routes.js

const express = require('express');
const { getUserProfile, updateUserProfile} = require('../../controllers/user_controller');
const router = express.Router();

router.get('/user/profile', getUserProfile);
router.put('/user/profile', updateUserProfile);

module.exports = router;
