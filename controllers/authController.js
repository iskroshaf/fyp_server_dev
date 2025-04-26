const { admin, db } = require('../services/firebase_service');

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    // 🔒 Verify ID token from client
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    // 📦 Create user doc if doesn't exist
    if (!doc.exists) {
      await userRef.set({
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        provider: 'google',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 🎫 Optional: create custom session token or JWT (if using sessions)
    // const customToken = await admin.auth().createCustomToken(uid);

    return res.status(200).json({
      message: 'Login successful',
      uid,
    });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'Invalid or expired ID token' });
  }
};

module.exports = { googleLogin };
