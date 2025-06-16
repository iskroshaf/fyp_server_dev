// routes/api/user_routes.js

const express = require('express');
const {
  readUserProfile,
  updateUserProfile,
  addUserProfile,
  readSingleUserProfile,
  updateProfileLocation
} = require('../../controllers/user_controller');

const router = express.Router();

router.get('/user/profile', readUserProfile);
router.get('/user/:profile_id/profile', readSingleUserProfile);
router.patch('/user/:profile_id/profile', updateUserProfile);
router.post('/user/profile', addUserProfile);
router.patch('/user/:profile_id/location', updateProfileLocation);

module.exports = router;
