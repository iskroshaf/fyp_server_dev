// prayer_session_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');

const startPrayerSession = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params;
    let { prayerName, day } = req.body;

    if (!prayerName || !day) {
      return res.status(400).json({ error: 'prayerName or day is required' });
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
      const session = doc.data();
      if (session.prayerName.toLowerCase() === prayerName && session.day === day) {
        await db.collection('prayer_sessions').doc(doc.id).update({
          currentRakaat: 1,
          status: false,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        });

        return res.status(200).json({
          message: 'Prayer session restarted',
          sessionId: doc.id,
        });
      }
    }

    const now = new Date();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const sessionId = `session_${day}_${monthStr}_${prayerName}_${uid.slice(0, 6)}`;

    await db.collection('prayer_sessions').doc(sessionId).set({
      sessionId,
      day,
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
    const { sessionId, currentRakaat, timestamp, status } = req.body;

    const sessionRef = db.collection('prayer_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Prayer session not found' });
    }

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

const loadSinglePrayerSession = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { profile_id } = req.params;
    const profileDoc = await db.collection('profiles').doc(profile_id).get();
    
    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const sessionsSnapshot = await db.collection('prayer_sessions')
      .where('profileId', '==', profile_id)
      .get();

    const sessions = [];
    sessionsSnapshot.forEach(doc => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error load prayer session:', error);
    return res.status(500).json({ error: error.message || 'Failed to load prayer session' });
  }
};


module.exports = { startPrayerSession,updatePrayerSession, loadSinglePrayerSession };

