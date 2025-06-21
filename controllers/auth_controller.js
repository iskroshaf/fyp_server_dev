// controllers/auth_controller.js
const { admin, db } = require('../services/firebase_service');

const getUserToken = async (req) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid format');
  }
  return authHeader.split('Bearer ')[1];
};

const googleLogin = async (req, res) => {
  try {
    const idToken = await getUserToken(req); 

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const profileRef = db.collection('profiles').doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
      await profileRef.set({
        userId: uid,
        email: decodedToken.email,
        username: decodedToken.name,
        photoURL: decodedToken.picture,
        role: 1,
        provider: 'google',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({
      message: 'Login successful',
      uid,
      user: {
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
      }
    });

  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: error.message || 'Invalid or expired ID token' });
  }
};


const userRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    const existingUser = await admin.auth().getUserByEmail(email).catch(() => null);
    if (existingUser) {
      return res.status(400).json({ error: 'The email address is already in use by another account.' });
    }

    const usernameSnapshot = await db.collection('profiles')
      .where('username', '==', username)
      .get();

      if (!usernameSnapshot.empty) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    const userRef = db.collection('profiles').doc(userRecord.uid);
    await userRef.set({
      userId: userRecord.uid,
      email: email,
      username : username,
      role: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Error creating new user:', error);
    return res.status(500).json({ error: error.message || 'Failed to register user' });
  }
};

module.exports = { googleLogin, userRegister ,getUserToken};


