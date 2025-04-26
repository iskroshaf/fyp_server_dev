const express = require('express');
const order_routes = require('./routes/api/order_routes');
const auth_routes = require('./routes/api/auth/auth_routes');

dotenv = require('dotenv');

const app = express();
app.use(express.json());

app.use('/api', order_routes);
app.use('/api', auth_routes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});