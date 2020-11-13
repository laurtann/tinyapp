const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080

const { fetchUserFromEmail, urlsForUser } = require('./helpers');

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

const generateRandomString = function() {
  const id = Math.random().toString(36).substring(2, 8);
  return id;
};

const urlDatabase = {};

// database of users
const users = {};

// redirect from home page
app.get('/', (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// returns json string with urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render urls page for logged in user
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: urls, username: users[userID] };
  res.render("urls_index", templateVars);
});

// manage permissions and render new urls page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const templateVars = { username: users[userID] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// render register page/ redirect for logged in users
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { username: users[userID] };
  res.render("register", templateVars);
});

// render new login page/redirect for logged in users
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { username: users[userID] };
  res.render("login", templateVars);
});

// manage permissions & short URL resassignment
app.get("/urls/:shortURL", (req, res) => {
  const short = req.params.shortURL;
  const userID = req.session.user_id;
  let userURLs;

  if (userID) {
    userURLs = urlsForUser(userID, urlDatabase);
  } else {
    res.status(401);
    res.send("You are not authorized to view this Short Link, please Log In");
    return;
  }
  
  if (urlDatabase[short]) {
    if (userURLs[short] && userID) {
      const long = urlDatabase[short].longURL;
      const templateVars = { shortURL: short, longURL: long, username: users[userID]};
      res.render("urls_show", templateVars);
    } else {
      res.status(401);
      res.send("You are not authorized to view this Short Link.");
    }
  } else {
    res.status(404);
    res.send("This short URL does not exist");
  }
});

// redirect to original website when shortURL put after /u/ slug
app.get("/u/:shortURL", (req, res) => {
  const short = req.params.shortURL;
  if (!urlDatabase[short]) {
    res.status(404);
    res.send("This short link does not exist, please try again.");
    return;
  }
  const long = urlDatabase[short].longURL;
  res.redirect(long);
});

// update urlDatabase with new short/long pair
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.status(403);
    res.send("Please Log In To View Your URLs & Short Links");
    return;
  }
  const short = generateRandomString();
  const long = req.body.longURL;
  const userID = req.session.user_id;
  urlDatabase[short] = { longURL: long, userID: userID };
  res.redirect(`/urls/${short}`);
});

// registration handler
app.post('/register', (req, res) => {
  // error handling
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  }

  if (fetchUserFromEmail(users, email) !== false) {
    res.status(400);
    res.send("Email already exists, please log in");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  // initialize user objs
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: email,
    password: hashedPassword
  };

  // create cookie
  req.session['user_id'] = userID;
  res.redirect('/urls');
});

// login post
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userFromEmail = fetchUserFromEmail(users, email);
  const hashedPassword = userFromEmail.password;

  if (!email || !password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  }

  if (userFromEmail === false) {
    res.status(403);
    res.send("Email not found, please register");
    return;
  } else {
    if (!bcrypt.compareSync(password, hashedPassword)) {
      res.status(401);
      res.send("Incorrect password, please try again");
      return;
    } else {
      req.session.user_id = userFromEmail.id;
      res.redirect('/urls');
    }
  }
});

// delete user URLs and permission handling
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  const short = req.params.shortURL;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (userURLs[short]) {
    delete urlDatabase[short];
    delete userURLs[short];
    res.redirect('/urls');
    return;
  }

  res.status(401);
  res.send("You are not authorized to delete this URL");
  return;
});

// edit longURL and permission handling
app.post('/urls/:shortURL', (req, res) => {
  const short = req.params.shortURL;
  const newURL = req.body.newURL;
  const userID = req.session.user_id;

  if (urlDatabase[short].userID === userID) {
    urlDatabase[short].longURL = newURL;
    res.redirect('/urls');
    return;
  } else {
    res.status(401);
    res.send("You are not authorized to edit this URL");
  }
});

// delete cookie on logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
