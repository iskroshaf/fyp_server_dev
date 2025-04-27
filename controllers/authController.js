// controllers/authController.js
const { admin, db } = require('../services/firebase_service');

const googleLogin = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
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
    return res.status(401).json({ error: 'Invalid or expired ID token' });
  }
};
module.exports = { googleLogin };

