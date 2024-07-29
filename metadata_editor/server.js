const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 5500;

app.use(bodyParser.json());

app.use(express.static('./http_root'));

// write JSON data to a file
function writeJsonFile(filename, jsonData, callback) {
  const filePath = path.join('./http_root/objects', filename); // relative path
  const tempFilePath = filePath + '.tmp'; // path for a temporary file

  const jsonString = JSON.stringify(jsonData, null, 2);

  // writing to a temporary file first
  fs.writeFile(tempFilePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('Error writing temp file:', err);
      callback(err);
    } else {
      // renaming the temp file
      fs.rename(tempFilePath, filePath, (renameErr) => {
        if (renameErr) {
          callback(err);
        }
        else {
          callback(null);
        }
      });
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


