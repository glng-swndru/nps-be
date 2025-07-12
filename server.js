// Import library yang dibutuhkan
const express = require('express');
const mysql = require('mysql2/promise'); // Menggunakan mysql2/promise untuk async/await
const cors = require('cors');

// Inisialisasi aplikasi Express
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Mengizinkan request dari domain lain (frontend)
app.use(express.json()); // Mem-parsing body request dalam format JSON

// Konfigurasi koneksi ke database MySQL
// PENTING: Gunakan environment variables untuk data sensitif ini saat deployment.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', // User default MySQL seringkali 'root'
  password: process.env.DB_PASSWORD || 'password', // Ganti dengan password MySQL Anda
  database: process.env.DB_NAME || 'nps_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Endpoint untuk health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Backend is running' });
});

// Endpoint utama untuk menerima data NPS dari frontend
app.post('/api/submit-nps', async (req, res) => {
  const { score, comment } = req.body;

  // Validasi input sederhana
  if (score === undefined || score === null || score < 0 || score > 10) {
    return res.status(400).json({ error: 'Score is invalid. Must be between 0 and 10.' });
  }

  try {
    // Query untuk memasukkan data ke tabel nps_scores. MySQL menggunakan '?' sebagai placeholder.
    const queryText = 'INSERT INTO nps_scores(score, comment) VALUES(?, ?)';
    const queryValues = [score, comment];
    
    // Eksekusi query
    const [result] = await pool.query(queryText, queryValues);
    
    console.log('Data saved successfully. Insert ID:', result.insertId);
    
    // Kirim respon sukses ke frontend
    res.status(201).json({ 
      message: 'NPS score saved successfully!',
      data: {
        id: result.insertId,
        score: score,
        comment: comment
      }
    });

  } catch (err) {
    console.error('Error saving data to database:', err);
    res.status(500).json({ error: 'Internal server error. Could not save the score.' });
  }
});

// Menjalankan server
app.listen(port, () => {
  console.log(`NPS backend server listening on port ${port}`);
});
