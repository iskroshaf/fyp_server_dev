// controllers/doa_controller.js

const path = require('path');
const fs = require('fs');

const getDoa = async (req, res) => {
  try {
    const doaDataPath = path.join(__dirname, '..', 'assets', 'data', 'doa.json');

    if (!fs.existsSync(doaDataPath)) {
      return res.status(404).json({ message: 'Doa data not found.' });
    }

    res.status(200).sendFile(doaDataPath);
  } catch (error) {
    console.error('Error sending Doa JSON:', error);
    res.status(500).json({ message: 'Failed to retrieve Doa data.' });
  }
};

module.exports = { getDoa };
