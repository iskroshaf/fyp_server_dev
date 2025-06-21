// controllers/user_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');

const getUserProfile = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const profilesRef = db.collection('profiles');
    const snapshot = await profilesRef.where('userId', '==', uid).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No profiles found for this user' });
    }

    const userProfiles = [];
    snapshot.forEach(doc => {
      userProfiles.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({
      message: 'User profiles fetched successfully',
      profiles: userProfiles,
    });

  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
};

const getSingleUserProfile = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { profile_id } = req.params;

    const profileRef = db.collection('profiles').doc(profile_id);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileData = doc.data();
    if (profileData.userId !== uid) {
      return res.status(403).json({ error: 'You do not have permission to access this profile' });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      profile: { id: doc.id, ...profileData },
    });

  } catch (error) {
    console.error('Error fetching single user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};


const updateUserProfile = async(req, res)=>{
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { profile_id } = req.params;
    const { username, gender, birthdate, biodata} = req.body;

    const profileRef = db.collection('profiles').doc(profile_id);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profileData = doc.data();
    if (profileData.userId !== uid) {
      return res.status(403).json({ error: 'You do not have permission to access this profile' });
    }

    await profileRef.update({
      username: username || null,
      gender: gender || null,
      birthdate : birthdate || null,
      biodata: biodata || null,
    });

    return res.status(200).json({
      message: 'User profile updated successfully',
    });
    
  } catch (error) {
    console.error('Error update user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
}

const addUserProfile = async (req, res) => {
  try {
    const { username, gender, birthdate } = req.body;
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const profilesRef = db.collection('profiles');
    const newProfileRef = await profilesRef.add({
      userId: uid,
      username: username,
      gender: gender,
      birthdate: birthdate,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: 'New user profile created successfully',
      profileId: newProfileRef.id,
    });

  } catch (error) {
    console.error('Error adding user profile:', error);
    return res.status(500).json({ error: 'Failed to add user profile' });
  }
};

const updateProfileLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { profile_id } = req.params;

    const profileRef = db.collection('profiles').doc(profile_id);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileData = doc.data();
    if (profileData.userId !== uid) {
      return res.status(403).json({ error: 'No permission to update this profile' });
    }

    await profileRef.update({
      latitude: latitude || null,
      longitude: longitude || null,
    });

    return res.status(200).json({
      message: 'User location updated successfully',
    });

  } catch (error) {
    console.error('Error update location:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};



module.exports = { getUserProfile, updateUserProfile, addUserProfile, getSingleUserProfile, updateProfileLocation};
