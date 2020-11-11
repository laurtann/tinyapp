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
  // const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  // let random = "";
  // for (let i = 0; i < 6; i++) {
  //   random += chars[Math.floor(Math.random() * Math.floor(37))];
  // }
  // return random;
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

// Day 1 code
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

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

// get for request page
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls', (req, res) => { s
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

//login
// app.post('/login', (req, res) => {
//   res.cookie('username', req.body.username);
//   res.redirect('/urls');
// });

// delete cookie
app.post('/logout', (req, res) => {
  res.clearCookie('username');
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

  console.log(users);
  //cookie time
  res.cookie('user_id', userID);
  res.redirect('/urls');
})

// D1 Old code
// app.post("/urls", (req, res) => {
//   console.log(req.body);  // Log the POST request body to the console
//   res.send("Ok");         // Respond with 'Ok' (we will replace this)
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

