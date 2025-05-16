//  routes/api/user_routes.js

const express = require('express');
const { getUserProfile, updateUserProfile, addUserProfile,getSingleUserProfile} = require('../../controllers/user_controller');
const router = express.Router();

router.get('/user/profile', getUserProfile);
router.get('/user/:profile_id/profile', getSingleUserProfile);
router.put('/user/:profile_id/profile', updateUserProfile);
router.post('/user/profile', addUserProfile);

module.exports = router;
