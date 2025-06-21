const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');


const getProfilePoints = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params;

    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' });
    }

    const profileRef = db.collection('profiles').doc(profile_id);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const pointRef = db.collection('points').doc(profile_id);
    const pointDoc = await pointRef.get();

    if (!pointDoc.exists) {
      return res.status(200).json({
        profile_id,
        totalPoint: 0,
        message: 'No points found for this profile',
      });
    }

    const { totalPoint, createdAt } = pointDoc.data();

    return res.status(200).json({
      profile_id,
      totalPoint,
      createdAt,
    });

  } catch (error) {
    console.error('Error fetching profile points:', error);
    return res.status(500).json({ error: 'Failed to get profile points' });
  }
};

module.exports = { getProfilePoints };
