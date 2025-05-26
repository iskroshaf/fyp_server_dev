// prayer_session_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');

const startPrayerSession = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params;
    let { prayerName } = req.body;

    if (!prayerName) {
      return res.status(400).json({ error: 'prayerName is required' });
    }

    prayerName = prayerName.toLowerCase();  

    const profileRef = db.collection('profiles').doc(profile_id);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const prayerTimesSnapshot = await db.collection('prayer_times')
      .where('profileId', '==', profile_id)
      .limit(1)
      .get();

    if (prayerTimesSnapshot.empty) {
      return res.status(404).json({ error: 'Prayer times not found for this profile' });
    }

    const prayerTimesId = prayerTimesSnapshot.docs[0].id;

    const existingSessionsSnapshot = await db.collection('prayer_sessions')
      .where('profileId', '==', profile_id)
      .get();

    for (const doc of existingSessionsSnapshot.docs) {
      if (doc.data().prayerName.toLowerCase() === prayerName) {
        return res.status(200).json({
          message: 'Prayer session already exists',
          sessionId: doc.id,
        });
      }
    }

    const sessionId = `session_${new Date().toISOString().split('T')[0]}_${prayerName}_${uid.slice(0, 6)}`;

    await db.collection('prayer_sessions').doc(sessionId).set({
      sessionId,
      prayerTimesId,
      profileId: profile_id,
      prayerName,
      currentRakaat: 1,
      status: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: 'Prayer session started successfully',
      sessionId,
    });

  } catch (error) {
    console.error('Error starting prayer session:', error);
    return res.status(500).json({ error: error.message || 'Failed to start prayer session' });
  }
};


const updatePrayerSession = async (req, res) => {
  try {
    const { sessionId, currentRakaat, timestamp } = req.body;

    const sessionRef = db.collection('prayer_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Prayer session not found' });
    }

    const sessionData = sessionDoc.data();

    const maxRakaatMap = {
      fajr: 2,
      dhuhr: 4,
      asr: 4,
      maghrib: 3,
      isya: 4,
    };

    const prayerNameLower = sessionData.prayerName.toLowerCase();
    const maxRakaat = maxRakaatMap[prayerNameLower] || 4;

    const status = currentRakaat >= maxRakaat;

  const adminTimestamp = admin.firestore.Timestamp.fromDate(new Date(timestamp));
  await sessionRef.update({
    currentRakaat,
    status,
    lastUpdated: adminTimestamp,
  });


    return res.status(200).json({ message: 'Prayer session updated from ESP32' });
  } catch (error) {
    console.error('ESP update error:', error);
    return res.status(500).json({ error: 'Failed to update session from ESP32' });
  }
};


module.exports = { startPrayerSession,updatePrayerSession };

