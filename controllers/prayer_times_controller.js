// controllers/prayer_times_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');


const addPrayerTimes = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { profile_id } = req.params;
    const prayerTimesData = req.body;

    const profileDoc = await db.collection('profiles').doc(profile_id).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    // Check if prayer times doc already exists for this profile
    const existingPrayerTimesSnapshot = await db.collection('prayer_times')
      .where('profileId', '==', profile_id)
      .limit(1)
      .get();

    if (!existingPrayerTimesSnapshot.empty) {
      const existingDoc = existingPrayerTimesSnapshot.docs[0];
      await db.collection('prayer_times').doc(existingDoc.id).update({
        ...prayerTimesData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        message: 'Prayer times updated successfully',
        prayerTimesId: existingDoc.id,
      });
    } else {
      const prayerTimesRef = db.collection('prayer_times').doc();
      await prayerTimesRef.set({
        profileId: profile_id,
        ...prayerTimesData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        message: 'Prayer times added successfully',
        prayerTimesId: prayerTimesRef.id,
      });
    }

  } catch (error) {
    console.error('Error adding prayer times:', error);
    return res.status(500).json({ error: error.message || 'Failed to add prayer times' });
  }
};

module.exports = {addPrayerTimes}
