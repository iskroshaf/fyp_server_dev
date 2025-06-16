// prayer_controller.js

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
      currentRakaat : currentRakaat || 1,
      status : status || false,
      lastUpdated: adminTimestamp,
    });
    return res.status(200).json({ message: 'Prayer session updated from ESP32' });
  } catch (error) {
    console.error('ESP update error:', error);
    return res.status(500).json({ error: 'Failed to update session from ESP32' });
  }
};


const getSinglePrayerSession = async (req, res) => {
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

const getProfilesPrayerData = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const profilesSnap = await db.collection('profiles')
      .where('userId', '==', uid)
      .get();

    const profilesData = [];

    const today = new Date();
    const todayDate = today.getDate();
    const currentMonth = new Intl.DateTimeFormat('en', { month: 'short' }).format(today).toUpperCase();
    const currentYear = today.getFullYear();

    for (const doc of profilesSnap.docs) {
      const profile = { id: doc.id, ...doc.data() };

      const prayerSessionsSnap = await db.collection('prayer_sessions')
        .where('profileId', '==', profile.id)
        .get();

      const prayer_sessions = [];
      prayerSessionsSnap.forEach(sessionDoc => {
        prayer_sessions.push({ id: sessionDoc.id, ...sessionDoc.data() });
      });

      const prayerTimesSnap = await db.collection('prayer_times')
        .where('profileId', '==', profile.id)
        .where('month', '==', currentMonth)
        .where('year', '==', currentYear)
        .limit(1)
        .get();

      let prayer_times_meta = {
        month: currentMonth,
        year: currentYear,
        createdAt: null,
        last_updated: null,
        zone: null,
        days: {}
      };

      if (!prayerTimesSnap.empty) {
        const ptDoc = prayerTimesSnap.docs[0];
        const ptData = ptDoc.data();

        prayer_times_meta = {
          month: ptData.month,
          year: ptData.year,
          zone: ptData.zone,
          createdAt: ptData.createdAt,
          last_updated: ptData.last_updated,
          days: ptData.prayers
        };
      }

      profilesData.push({
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        birthdate: profile.birthdate,
        prayer_sessions,
        prayer_times: prayer_times_meta
      });
    }

    return res.status(200).json({
      message: 'Fetched all profiles\' prayer sessions and prayer times for the next 7 days',
      profiles: profilesData
    });

  } catch (error) {
    console.error('Error getting profiles with prayer data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch data' });
  }
};


module.exports = { startPrayerSession, updatePrayerSession, getSinglePrayerSession, addPrayerTimes, getProfilesPrayerData };

