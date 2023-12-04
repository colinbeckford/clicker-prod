const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Create a MySQL database connection
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'becko',
  database: 'Clicker',
});

// Check the connection
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/appendClicks', (req, res) => {
    const dataArray = req.body.dataArray;
    const insertQuery = 'INSERT INTO clicks (judge, link, second, score) VALUES ?';
    db.query(insertQuery, [dataArray], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting data into "clicks" table:', insertErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.json({ message: 'Data received and inserted successfully!' });
        }
      });
  });

  app.get('/getClicks/:link', (req, res) => {
    const linkValue = req.params.link;
    const selectQuery = 'SELECT * FROM clicks WHERE link = ?';
    db.query(selectQuery, [linkValue], (selectErr, result) => {
      if (selectErr) {
        console.error('Error retrieving data from "clicks" table:', selectErr);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(result);
      }
    });
  });
  
