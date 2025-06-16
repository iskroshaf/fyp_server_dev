// routes/api/verse_notes_routes.js

const express = require('express');
const { addVerseNote, getVerseNotes, updateVerseNote, deleteVerseNote } = require('../../controllers/verse_notes_controller');
const router = express.Router();

router.post('/user/:profile_id/verse-notes', addVerseNote);
router.get('/user/:profile_id/verse-notes', getVerseNotes);
router.patch('/user/:profile_id/verse-notes/:note_id', updateVerseNote); 
router.delete('/user/:profile_id/verse-notes/:note_id', deleteVerseNote); 


module.exports = router;