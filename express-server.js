const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const checkUserEmail = require('./helpers.js');
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

function generateRandomString() {
  const id = Math.random().toString(36).substring(2, 8);
  return id;
}

// data
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// database of users
const users = {

};

// // check if email exists in database
// const checkUserEmail = function(database, email) {
//   for (let user in database) {
//     if (database[user].email === email) {
//       return email;
//     }
//   }
//   return false;
// }

// returns json string with urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//sending HTML
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//here
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

// get for new login page
app.get("/login", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

// redirect to original website when shortURL put after /u/ slug
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// update urlDatabase with new short/long pair
app.post('/urls', (req, res) => { 
  const short = generateRandomString();
  const long = req.body.longURL;
  urlDatabase[short] = long;
  res.redirect(`/urls/${short}`);
});

//login - don't know if I still need this
// app.post('/login', (req, res) => {
//   // res.cookie('username', req.body.username);
//   res.redirect('/urls');
// });

// delete my URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit longURL
app.post('/urls/:shortURL', (req, res) => {
  const long = req.body.longURL;
  urlDatabase[req.params.shortURL] = long;
  res.redirect('/urls');
});

// registration handler
app.post('/register', (req, res) => {
  // error handling
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  }
  if (checkUserEmail(users, req.body.email) !== false) {
    res.status(400);
    res.send("Email already exists, please log in");
    return;
  }

  // initialize user objs
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  }

  // create cookie
  res.cookie('user_id', userID);
  res.redirect('/urls');

  console.log(users);
});

// delete cookie on logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});