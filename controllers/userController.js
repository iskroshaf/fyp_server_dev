// controllers/userController.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./authController');


const getUserProfile = async (req, res) => {
  try {
    const idToken = await getUserToken(req); 

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const profileRef = db.collection('profiles').doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({
      message: 'User profile fetched successfully',
      userProfile: doc.data(),
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
};

const updateUserProfile = async(req, res)=>{
  try {
    const { name, gender, birthdate, biodata} = req.body;

    const idToken = await getUserToken(req); 
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;


    const profileRef = db.collection('profiles').doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    await profileRef.update({
      name: name || null,
      gender: gender || null,
      birthdate : birthdate || null,
      biodata: biodata || null,
    });

    return res.status(200).json({
      message: 'User profile updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user profile' });
  }
}

module.exports = { getUserProfile, updateUserProfile };
