// controllers/quran_controller.js

const path = require('path');
const fs = require('fs');

const readQuran = async (req, res) => {
  try {
    const quranDataPath = path.join(__dirname, '..', 'assets', 'data', 'quran.json');

    if (!fs.existsSync(quranDataPath)) {
      return res.status(404).json({ message: 'Quran data not found.' });
    }

    res.status(200).sendFile(quranDataPath);
  } catch (error) {
    console.error('Error sending Quran JSON:', error);
    res.status(500).json({ message: 'Failed to retrieve Quran data.' });
  }
};

module.exports = { readQuran };
