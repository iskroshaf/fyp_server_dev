// controllers/verse_notes_controller.js

const { admin, db } = require('../services/firebase_service');
const { getUserToken } = require('./auth_controller');

const addVerseNote = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id } = req.params;
    const { note, chapter, verse } = req.body;

    if (!note || !chapter || !verse) {
      return res.status(400).json({ error: 'Missing required fields: note, chapter, or verse' });
    }

    const profileRef = db.collection('profiles').doc(profile_id);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileSnap.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const verseNoteRef = db.collection('verse_notes').doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await verseNoteRef.set({
      profileId: profile_id,
      note,
      chapter,
      verse,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return res.status(200).json({
      message: 'Verse note added successfully',
      noteId: verseNoteRef.id,
    });

  } catch (error) {
    console.error('Error adding verse note:', error);
    return res.status(500).json({ error: 'Failed to add verse note' });
  }
};

const updateVerseNote = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id, note_id } = req.params;
    const { note } = req.body;

    const profileDoc = await db.collection('profiles').doc(profile_id).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const verseNoteRef = db.collection('verse_notes').doc(note_id);
    const verseNoteDoc = await verseNoteRef.get();

    if (!verseNoteDoc.exists) {
      return res.status(404).json({ error: 'Verse note not found' });
    }

    await verseNoteRef.update({
      note: note || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      message: 'Verse note updated successfully',
      noteId: note_id,
    });

  } catch (error) {
    console.error('Error updating verse note:', error);
    return res.status(500).json({ error: 'Failed to update verse note' });
  }
}

const readVerseNotes = async (req, res) => {
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

    const verseNotesRef = await db.collection('verse_notes')
      .where('profileId', '==', profile_id)
      .get();

    const notes = [];
    verseNotesRef.forEach(doc => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ notes });

  } catch (error) {
    console.error('Error fetching verse notes:', error);
    return res.status(500).json({ error: 'Failed to fetch verse notes' });
  }
}

const deleteVerseNote = async (req, res) => {
  try {
    const idToken = await getUserToken(req);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { profile_id, note_id } = req.params;

    const profileDoc = await db.collection('profiles').doc(profile_id).get();

    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileDoc.data().userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized access to this profile' });
    }

    const verseNoteRef = db.collection('verse_notes').doc(note_id);
    const verseNoteDoc = await verseNoteRef.get();

    if (!verseNoteDoc.exists) {
      return res.status(404).json({ error: 'Verse note not found' });
    }

    await verseNoteRef.delete();

    return res.status(200).json({ message: 'Verse note deleted successfully' });

  } catch (error) {
    console.error('Error deleting verse note:', error);
    return res.status(500).json({ error: 'Failed to delete verse note' });
  }
}

module.exports = { addVerseNote, readVerseNotes, updateVerseNote, deleteVerseNote };
