const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const argon2 = require('argon2');
require('dotenv').config();

const app = express();
const port = 5500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // for login form

// session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // true if HTTPS
}));

// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());


// load users
const usersFilePath = path.join(__dirname, 'users.json');

function loadUsers() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data).users;
  }
  return [];
}

// passport local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    const users = loadUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }

    try {
      // verifying the password with argon2
      if (await argon2.verify(user.password_hash, password)) {
        return done(null, user);
      } else {
        return done(null, false, {message: 'Incorrect password.'});
      }
    } catch (err) {
      return done(err);
    }
  }
));

// serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize user from session
passport.deserializeUser((id, done) => {
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  done(null, user);
});

// protecting routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'http_root', 'login.html'));
});

// login form submission
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      // If successful, redirect to the url with a user ID
      return res.redirect('/#' + encodeURIComponent(user.username));
    });
  })(req, res, next);
});

// protecting '/objects/*' routes
app.use((req, res, next) => {
  if (req.path.startsWith('/objects/')) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res.redirect('/login');
    }
  } else {
    return next();
  }
});


// protecting main
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'http_root', 'main.html'));
});

app.use(express.static('./http_root'));

// protecting static files in http_root
app.use(isAuthenticated, express.static(path.join(__dirname, 'http_root')));

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