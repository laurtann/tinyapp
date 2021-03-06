const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;

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
    const templateVars = { message: "You are not authorized to view this Short Link, please Log In", username: users[userID] };
    res.render("urls_error", templateVars);
    return;
  }

  if (urlDatabase[short]) {
    if (userURLs[short] && userID) {
      const long = urlDatabase[short].longURL;
      const templateVars = { shortURL: short, longURL: long, username: users[userID] };
      res.render("urls_show", templateVars);
    } else {
      res.status(401);
      const templateVars = { message: "You are not authorized to view this Short Link.", username: users[userID] };
      res.render("urls_error", templateVars);
    }
  } else {
    res.status(404);
    const templateVars = { message: "This short URL does not exist", username: users[userID] };
    res.render("urls_error", templateVars);
  }
});

// redirect to original website when shortURL put after /u/ slug
app.get("/u/:shortURL", (req, res) => {
  const short = req.params.shortURL;
  const userID = req.session.user_id;
  if (!urlDatabase[short]) {
    res.status(404);
    const templateVars = { message: "This short link does not exist, please try again.", username: users[userID] };
    res.render("urls_error", templateVars);
    return;
  }
  const long = urlDatabase[short].longURL;
  res.redirect(long);
});

// update urlDatabase with new short/long pair
app.post('/urls', (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403);
    const templateVars = { message: "Please Log In To View Your URLs & Short Links", username: users[userID] };
    res.render("urls_error", templateVars);
    return;
  }
  const short = generateRandomString();
  const long = req.body.longURL;
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
    const templateVars = { message: "Please enter a valid email & password", username: null };
    res.render("urls_error", templateVars);
    return;
  }

  if (fetchUserFromEmail(users, email) !== false) {
    res.status(400);
    const templateVars = { message: "Email already exists, please log in", username: users[userID] };
    res.render("urls_error", templateVars);
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
  req.session['order_id'] = 123;
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
    const templateVars = { message: "Please enter a valid email & password", username: null };
    res.render("urls_error", templateVars);
    return;
  }

  if (userFromEmail === false) {
    res.status(403);
    const templateVars = { message: "Email not found, please register", username: null };
    res.render("urls_error", templateVars);
    return;
  } else {
    if (!bcrypt.compareSync(password, hashedPassword)) {
      res.status(401);
      const templateVars = { message: "Incorrect password, please try again", username: null };
      res.render("urls_error", templateVars);
      return;
    } else {
      req.session.user_id = userFromEmail.id;
      res.redirect('/urls');
    }
  }
});

// delete user URLs and permission handling
app.post('/urls/:shortURL/delete', (req, res) => {
  const orderID = req.session.order_id;
  const userID = req.session.user_id;
  const short = req.params.shortURL;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (userURLs[short]) {
    delete urlDatabase[short];
    delete userURLs[short];
    console.log(orderID);
    console.log(userID);
    res.redirect('/urls');
    return;
  }

  res.status(401);
  const templateVars = { message: "You are not authorized to delete this URL", username: users[userID] };
  res.render("urls_error", templateVars);
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
    const templateVars = { message: "You are not authorized to edit this URL", username: users[userID] };
    res.render("urls_error", templateVars);
  }
});

// delete cookie on logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}`);
});
