const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://final-year-project-1cf32-default-rtdb.firebaseio.com/' 
});

const db = admin.firestore();

module.exports = { admin, db };