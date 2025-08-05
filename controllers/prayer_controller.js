// controllers/prayer_controller.js

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

    const now = new Date();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');

    // ✅ sessionId includes profile_id to ensure uniqueness per child
    const sessionId = `session_${day}_${monthStr}_${prayerName}_${profile_id.slice(0, 6)}`;

    const sessionRef = db.collection('prayer_sessions').doc(sessionId);
    const existingSession = await sessionRef.get();

    if (existingSession.exists) {
      // Session exists, restart it
      await sessionRef.update({
        currentRakaat: 1,
        status: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        message: 'Prayer session restarted',
        sessionId,
      });
    }

    // Create new session
    await sessionRef.set({
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

    const sessionData = sessionDoc.data();
    const adminTimestamp = admin.firestore.Timestamp.fromDate(new Date(timestamp));

    await sessionRef.update({
      currentRakaat: currentRakaat || 1,
      status: status || false,
      lastUpdated: adminTimestamp,
    });

    if (status === true) {
      const { profileId, prayerName } = sessionData;

      const pointsRef = db.collection('points').doc(profileId);
      const pointsDoc = await pointsRef.get();

      const pointsToAdd = prayerName.toLowerCase() === 'fajr' ? 15 : 10;

      if (pointsDoc.exists) {
        const currentTotal = pointsDoc.data().totalPoint || 0;
        await pointsRef.update({
          totalPoint: currentTotal + pointsToAdd,
        });
      } else {
        await pointsRef.set({
          profileId,
          totalPoint: pointsToAdd,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return res.status(200).json({ message: 'Prayer session updated from ESP32 and points calculated' });

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

const getProfilePrayerPerformance = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params;

    const profileDoc = await db.collection('profiles').doc(profile_id).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileData = profileDoc.data();
    if (profileData.userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const profileCreatedAt = profileData.createdAt?.toDate?.();
    const now = new Date();

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    const prayerTimesSnap = await db.collection('prayer_times')
      .where('profileId', '==', profile_id)
      .where('month', '==', month)
      .where('year', '==', year)
      .limit(1)
      .get();

    let monthlyPrayerTimes = { zone: null, days: [] };
    let prayerTimesId = null;

    if (!prayerTimesSnap.empty) {
      const prayerTimesDoc = prayerTimesSnap.docs[0];
      prayerTimesId = prayerTimesDoc.id;
      const prayerTimesData = prayerTimesDoc.data();
      monthlyPrayerTimes = {
        zone: prayerTimesData.zone || null,
        days: prayerTimesData.prayers || [],
      };
    }

    let sessionsSnap = { empty: true, forEach: () => {} };
    if (prayerTimesId) {
      sessionsSnap = await db.collection('prayer_sessions')
        .where('profileId', '==', profile_id)
        .where('prayerTimesId', '==', prayerTimesId)
        .get();
    }

    const monthlyCompletedCounts = {};
    const monthlyIncompleteCounts = {};
    const last7DaysMap = new Map();

    for (let i = 7; i >= 1; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      if (profileCreatedAt && date >= profileCreatedAt) {
        const dayKey = date.getDate().toString().padStart(2, '0');
        last7DaysMap.set(dayKey, { day: dayKey, completed: 0, incomplete: 0 });
      }
    }

    let completedToday = 0;

    sessionsSnap.forEach(doc => {
      const data = doc.data();
      const prayerName = data.prayerName?.toLowerCase();
      const status = data.status;
      const createdAt = data.createdAt?.toDate?.();
      const sessionDay = data.day?.toString().padStart(2, '0');

      if (!prayerName || !createdAt || !sessionDay) return;

      if (status) {
        monthlyCompletedCounts[prayerName] = (monthlyCompletedCounts[prayerName] || 0) + 1;
      } else {
        monthlyIncompleteCounts[prayerName] = (monthlyIncompleteCounts[prayerName] || 0) + 1;
      }

      if (last7DaysMap.has(sessionDay)) {
        const entry = last7DaysMap.get(sessionDay);
        if (status) {
          entry.completed += 1;
        } else {
          entry.incomplete += 1;
        }
      }

      if (data.day?.toString() === day.toString() && status) {
        completedToday += 1;
      }
    });

    const totalDailyPrayers = 5;
    const prayerProgress = (completedToday / totalDailyPrayers) * 100;
    const weeklyPerformance = Array.from(last7DaysMap.values());

    const lastSessionSnap = await db.collection('prayer_sessions')
      .where('profileId', '==', profile_id)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    let lastPrayerSession = null;
    if (!lastSessionSnap.empty) {
      const lastDoc = lastSessionSnap.docs[0];
      lastPrayerSession = {
        id: lastDoc.id,
        ...lastDoc.data()
      };
    }

    const getDaysSince = (startDate, endDate) => {
      const oneDay = 1000 * 60 * 60 * 24;
      const diffInTime = endDate.getTime() - startDate.getTime();
      return Math.floor(diffInTime / oneDay);
    };

    const daysSinceCreation = getDaysSince(profileCreatedAt, now);
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const monthlyMissedCounts = {};

    prayerNames.forEach(prayer => {
      const expected = daysSinceCreation;
      const completed = monthlyCompletedCounts[prayer] || 0;
      const incomplete = monthlyIncompleteCounts[prayer] || 0;
      const missed = expected - completed - incomplete;
      monthlyMissedCounts[prayer] = missed > 0 ? missed : 0;
    });

    return res.status(200).json({
      month,
      day,
      year,
      prayerProgress,
      monthlyCompletedCounts,
      monthlyIncompleteCounts,
      monthlyMissedCounts,
      weeklyPerformance,
      lastPrayerSession,
      monthlyPrayerTimes,
    });

  } catch (error) {
    console.error('Error getting prayer data:', error);
    return res.status(500).json({ error: 'Failed to fetch prayer data' });
  }
};



const getProfilesPrayerPerformance = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const now = new Date();
    const dayNow = now.getDate();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const profilesSnap = await db.collection('profiles').where('userId', '==', uid).get();
    if (profilesSnap.empty) {
      return res.status(404).json({ error: 'No profiles found' });
    }

    const profiles = profilesSnap.docs.map(doc => ({
      id: doc.id,
      username: doc.data().username || null,
    }));

    const result = [];

    for (const profile of profiles) {
      const prayerTimesSnap = await db.collection('prayer_times')
        .where('profileId', '==', profile.id)
        .where('month', '==', month)
        .where('year', '==', year)
        .limit(1)
        .get();

      if (prayerTimesSnap.empty) {
        result.push({
          id: profile.id,
          username: profile.username,
          completion: {}
        });
        continue;
      }

      const prayerTimesDoc = prayerTimesSnap.docs[0];
      const prayerTimesId = prayerTimesDoc.id;

      const sessionsSnap = await db.collection('prayer_sessions')
        .where('profileId', '==', profile.id)
        .where('prayerTimesId', '==', prayerTimesId)
        .get();

      const dayCompletionMap = {};

      sessionsSnap.forEach(doc => {
        const data = doc.data();
        const day = data.day;
        const status = data.status;

        if (!dayCompletionMap[day]) {
          dayCompletionMap[day] = { completed: 0 };
        }

        if (status === true) {
          dayCompletionMap[day].completed++;
        }
      });

      const completionObj = {};
      const profileDoc = profilesSnap.docs.find(doc => doc.id === profile.id);
      const createdAt = profileDoc?.data()?.createdAt?.toDate?.();

      for (let day = 1; day < dayNow; day++) { 
        const dateOfThisDay = new Date(now.getFullYear(), now.getMonth(), day);

        if (createdAt && dateOfThisDay < createdAt) {
          continue; 
        }

        const completed = dayCompletionMap[day]?.completed || 0;
        const percent = Math.round((completed / 5) * 100);
        completionObj[`day ${day}`] = percent;
      }



      result.push({
        id: profile.id,
        username: profile.username,
        completion: completionObj
      });
    }

    return res.status(200).json({
      month,
      year,
      monthlyPrayerTimes: result
    });

  } catch (error) {
    console.error('Error fetching graph data:', error);
    return res.status(500).json({ error: 'Failed to fetch graph data' });
  }
};

module.exports = { startPrayerSession, updatePrayerSession, getSinglePrayerSession, addPrayerTimes, getProfilePrayerPerformance, getProfilesPrayerPerformance };

