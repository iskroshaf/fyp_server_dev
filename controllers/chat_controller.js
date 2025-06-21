// controllers/chat_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');

const sendMessage = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params; 
    const { receiverId, message } = req.body;

    if (!receiverId || !message?.trim()) {
      return res.status(400).json({ error: 'receiverId and message are required' });
    }

    const profileRef = db.collection('profiles').doc(profile_id);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return res.status(404).json({ error: 'Sender profile not found' });
    }

    if (profileSnap.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const chatId = [profile_id, receiverId].sort().join('_');
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc();

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await chatRef.set({
      participants: [profile_id, receiverId],
      lastMessage: message,
      lastSentAt: timestamp,
    }, { merge: true });

    await messageRef.set({
      senderId: profile_id,
      receiverId,
      message,
      sentAt: timestamp,
    });

    return res.status(200).json({ success: true, message: 'Message sent' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messagesRef = db.collection('chats').doc(chatId).collection('messages').orderBy('sentAt', 'asc');
    const messagesSnap = await messagesRef.get();

    const messages = messagesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};

const getChats = async (req, res) => {
  try {
    const { profileId } = req.params;

    const chatsRef = db.collection('chats').where('participants', 'array-contains', profileId);
    const chatsSnap = await chatsRef.orderBy('lastSentAt', 'desc').get();

    const chats = [];

    for (const doc of chatsSnap.docs) {
      const chatData = doc.data();
      const otherParticipant = chatData.participants.find(p => p !== profileId);

      let otherProfile = null;
      if (otherParticipant) {
        const otherRef = db.collection('profiles').doc(otherParticipant);
        const otherSnap = await otherRef.get();
        if (otherSnap.exists) {
          const { name, photoURL } = otherSnap.data();
          otherProfile = { profileId: otherParticipant, name, photoURL };
        }
      }

      chats.push({
        chatId: doc.id,
        lastMessage: chatData.lastMessage || '',
        lastSentAt: chatData.lastSentAt || null,
        otherParticipant: otherProfile,
      });
    }

    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};

module.exports = { sendMessage, getMessages, getChats };


