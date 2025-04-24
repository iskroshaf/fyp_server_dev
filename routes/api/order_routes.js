const express = require('express');
const router = express.Router();

const { createOrder } = require('../../controllers/order_controller');

router.post('/orders', createOrder);

module.exports = router;