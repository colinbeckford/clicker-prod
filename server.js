require('dotenv').config();
const dbUrl = process.env.JAWSDB_URL;
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const port = 3000;

const url = new URL(dbUrl);
const dbConfig = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove the leading slash
  connectionLimit: 50
};

// Create a MySQL connection pool using the extracted connection details
const db = mysql.createPool(dbConfig);

// Check the connection
db.getConnection(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Start the server

app.listen((process.env.PORT || port), () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/appendClicks', (req, res) => {
    const dataArray = req.body.dataArray;
    const insertQuery = 'INSERT INTO 2024nyyl (judge, link, second, score) VALUES ?';
    db.query(insertQuery, [dataArray], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting data into "2024nyyl" table:', insertErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.json({ message: 'Data received and inserted successfully!' });
        }
      });
  });

app.get('/getClicks/:link', (req, res) => {
    const linkValue = req.params.link;
    const selectQuery = 'SELECT * FROM 2024nyyl WHERE link = ?';
    db.query(selectQuery, [linkValue], (selectErr, result) => {
      if (selectErr) {
        console.error('Error retrieving data from "2024nyyl" table:', selectErr);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(result);
      }
    });
  });

  app.get('/getJudges', (req, res) => {
    const selectQuery = 'SELECT judge, COUNT(DISTINCT link) AS count FROM 2024nyyl GROUP BY judge ORDER BY count DESC';
    db.query(selectQuery, (selectErr, result) => {
      if (selectErr) {
        console.error('Error retrieving data from "2024nyyl" table:', selectErr);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(result);
      }
    });
  });
  
  app.get('/getLinks', (req, res) => {
    const selectQuery = 'SELECT link, COUNT(DISTINCT judge) AS count FROM 2024nyyl GROUP BY link ORDER BY count DESC';
    db.query(selectQuery, (selectErr, result) => {
      if (selectErr) {
        console.error('Error retrieving data from "2024nyyl" table:', selectErr);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(result);
      }
    });
  });

  function handleExit(signal) {
    console.log(`Received ${signal}. Closing MySQL connection pool...`);
    db.end(err => {
      if (err) {
        console.error('Error closing MySQL connection pool:', err);
      } else {
        console.log('MySQL connection pool closed.');
      }
      process.exit(err ? 1 : 0);
    });
  }
  
  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);