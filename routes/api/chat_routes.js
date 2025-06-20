// /routes/chat_routes.ja

const express = require('express')
const { sendMessage, getMessages, getChats } = require('../../controllers/chat_controller');

const router = express.Router()
router.post('/chat/:profile_id', sendMessage);
router.get('/chats/:profileId', getChats);
router.get('/messages/:chatId', getMessages);

module.exports = router;