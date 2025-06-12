// esp_controller.js

const { realtimeDb } = require('../services/firebase_service');

const reportEspStatus = async (req, res) => {
  try {
    const { espId, ip, isConnected } = req.body;

    if (!espId || !ip || typeof isConnected !== 'boolean') {
      return res.status(400).json({ error: 'espId, ip and isConnected are required' });
    }

    const espStatusRef = realtimeDb.ref(`esp/${espId}`);

    await espStatusRef.set({
      ip,
      isConnected,
      lastSeen: Date.now(),
    });

    return res.status(200).json({ message: 'ESP status updated' });
  } catch (error) {
    console.error('Error updating ESP status:', error);
    return res.status(500).json({ error: 'Failed to update ESP status' });
  }
};

const readEspStatus = async (req, res) => {
  try {
    const { espId } = req.params;

    const espStatusRef = realtimeDb.ref(`esp/${espId}`);

    const snapshot = await espStatusRef.get();

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'ESP status not found' });
    }

    return res.status(200).json(snapshot.val());
  } catch (error) {
    console.error('Error fetching ESP status:', error);
    return res.status(500).json({ error: 'Failed to fetch ESP status' });
  }
};


const checkEspConnections = async () => {
  const espRef = realtimeDb.ref('esp');
  const snapshot = await espRef.get();
  if (!snapshot.exists()) return;

  const allStatuses = snapshot.val();
  const now = Date.now();
  const DISCONNECT_THRESHOLD = 2 * 60 * 1000;


  for (const espId in allStatuses) {
    const esp = allStatuses[espId];
    if (esp.isConnected && (now - esp.lastSeen > DISCONNECT_THRESHOLD)) {
      await realtimeDb.ref(`esp/${espId}`).update({ isConnected: false });
      console.log(`ESP ${espId} marked as disconnected due to timeout`);
    }
  }
};


module.exports = { reportEspStatus, readEspStatus, checkEspConnections };