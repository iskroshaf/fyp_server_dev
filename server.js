// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const auth_routes = require('./routes/api/auth_routes');
const user_routes = require('./routes/api/user_routes');
const quran_routes = require('./routes/api/quran_routes');
const doa_routes = require('./routes/api/doa_routes');
const prayer_routes = require('./routes/api/prayer_routes');
const verse_notes_routes = require('./routes/api/verse_notes_routes');
<<<<<<< HEAD
const point_routes = require('./routes/api/point_routes');
=======
>>>>>>> e7ae5f4826d27cad412e901b65834bcc383687a1
const chat_routes = require('./routes/api/chat_routes');

const esp = require('./routes/api/esp_routes');

const { checkEspConnections } = require('./controllers/esp_controller');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', auth_routes);
app.use('/api', user_routes);
app.use('/api', quran_routes);
app.use('/api', doa_routes);
app.use('/api', prayer_routes);
app.use('/api', verse_notes_routes);
<<<<<<< HEAD
app.use('/api', point_routes);
=======
>>>>>>> e7ae5f4826d27cad412e901b65834bcc383687a1
app.use('/api', chat_routes);

app.use('/api', esp);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

setInterval(checkEspConnections, 60 * 1000);
