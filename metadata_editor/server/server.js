const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 5500;

app.use(bodyParser.json());

app.use(express.static('../'));

// write JSON data to a file
function writeJsonFile(filename, jsonData, callback) {
  const filePath = path.join('objects', filename); // relative path

  const jsonString = JSON.stringify(jsonData, null, 2);

  fs.writeFile(filePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      callback(err);
    } else {
      console.log('File saved successfully');
      callback(null);
    }
  });
}

app.post('/save/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(filename);
  const jsonData = req.body;

  writeJsonFile(filename, jsonData, (err) => {
    if (err) {
      res.status(500).send('Error writing file');
    } else {
      res.send('File saved successfully');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


