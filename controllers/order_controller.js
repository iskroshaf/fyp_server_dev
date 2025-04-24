const { admin, db } = require('../services/firebase_service');

const createOrder = async (req, res) => {
    const { customerId, items, totalPrice } = req.body;
    try {
      const newOrderRef = db.collection('orders').doc();
      const orderData = {
        customerId,
        items,
        totalPrice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await newOrderRef.set(orderData);
      res.status(201).json({ message: 'Order created successfully', orderId: newOrderRef.id });
    } catch (error) {
      res.status(500).json({ message: 'Error creating order', error });
    }
  };

  module.exports = {
    createOrder,
  };