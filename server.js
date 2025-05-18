// server.js
const express = require('express');
const auth_routes = require('./routes/api/auth_routes');
const user_routes = require('./routes/api/user_routes');
const quran_routes = require('./routes/api/quran_routes')
const prayer_times_routes = require('./routes/api/prayer_times_routes')

dotenv = require('dotenv');

const path = require('path');
const app = express();

app.use(express.json());

app.use('/api', auth_routes);
app.use('/api', user_routes);
app.use('/api', quran_routes);
app.use('/api', prayer_times_routes);
app.use('/assets', express.static(path.join(__dirname, 'assets')));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});