const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

function generateRandomString() {
  const id = Math.random().toString(36).substring(2, 8);
  return id;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// database of users
const users = {

};

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
  console.log("This is a cookie", req.cookies["user_id"]);
  console.log("This is a user obj with cookie id", users[req.cookies["user_id"]]);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
  console.log("this is users obj", users);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls', (req, res) => { 
  const short = generateRandomString();
  const long = req.body.longURL;
  urlDatabase[short] = long;
  res.redirect(`/urls/${short}`);
});

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
});

// delete cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
