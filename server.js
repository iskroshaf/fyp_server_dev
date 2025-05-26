// server.js
const express = require('express');
const cors = require('cors');
const auth_routes = require('./routes/api/auth_routes');
const user_routes = require('./routes/api/user_routes');
const quran_routes = require('./routes/api/quran_routes')
const prayer_times_routes = require('./routes/api/prayer_times_routes')
const prayer_session_routes = require('./routes/api/prayer_session_routes')

dotenv = require('dotenv');

const path = require('path');

dotenv.config(); 

const app = express();

app.use(cors()); 
app.use(express.json());

app.use('/api', auth_routes);
app.use('/api', user_routes);
app.use('/api', quran_routes);
app.use('/api', prayer_times_routes);
app.use('/api', prayer_session_routes);
app.use('/assets', express.static(path.join(__dirname, 'assets')));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});