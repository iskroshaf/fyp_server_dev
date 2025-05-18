//  routes/api/user_routes.js

const express = require('express');
const { getUserProfile, updateUserProfile, addUserProfile,getSingleUserProfile, updateProfileLocation} = require('../../controllers/user_controller');
const router = express.Router();

router.get('/user/profile', getUserProfile);
router.get('/user/:profile_id/profile', getSingleUserProfile);
router.put('/user/:profile_id/profile', updateUserProfile);
router.post('/user/profile', addUserProfile);

router.patch('/user/:profile_id/location', updateProfileLocation);


module.exports = router;
