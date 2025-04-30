// controllers/userController.js

const { admin, db } = require('../services/firebase_service');

const userProfile = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Authorization header missing or invalid format' });
    }

    const idToken = authHeader.split('Bearer ')[1];

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
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

module.exports = { userProfile };
