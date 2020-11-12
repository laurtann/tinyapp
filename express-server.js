const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const PORT = 8080; // default port 8080

const { authenticateUser, urlsForUser } = require('./helpers');

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

function generateRandomString() {
  const id = Math.random().toString(36).substring(2, 8);
  return id;
}

// database of URLs
const urlDatabase = {};

// database of users
const users = {};

// redirect from home page
app.get('/', (req, res) => {
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  }
})

// returns json string with urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//sending HTML
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// user can only see own links
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies["user_id"], urlDatabase), username: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

// make sure that user is logged in to see this page
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) { 
    const templateVars = { username: users[req.cookies["user_id"]] }
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

// get for new login page
app.get("/login", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
})

// old
// app.get("/urls/:shortURL", (req, res) => {
//   const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, username: users[req.cookies["user_id"]]};
//   res.render("urls_show", templateVars);
// });

//YAAASSSSSSSSSSS
app.get("/urls/:shortURL", (req, res) => {
  // getting userURL obj
  const userURLs = urlsForUser(req.cookies["user_id"], urlDatabase);
  const short = req.params.shortURL;
  // if short exists
  if (urlDatabase[short]) {
    //if user is logged in and url exists
    if (userURLs[short] && req.cookies["user_id"]) {
      const templateVars = { shortURL: short, longURL: urlDatabase[short].longURL, username: users[req.cookies["user_id"]]};
      res.render("urls_show", templateVars);
    } else {
      res.status(401);
      res.send("You are not authorized to view this Short Link");
    }
  } else {
    res.status(404);
    res.send("This short URL does not exist");
  }
});

// redirect to original website when shortURL put after /u/ slug
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// update urlDatabase with new short/long pair
app.post('/urls', (req, res) => { 
  const short = generateRandomString();
  const long = req.body.longURL;
  urlDatabase[short] = { longURL: long, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${short}`);
});

// login post
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  };

  if (authenticateUser(users, req.body.email) === false) {
    res.status(403);
    res.send("Email not found, please register");
    return;
  };

  if (authenticateUser(users, req.body.email, req.body.password) === false) {
    res.status(403);
    res.send("Incorrect password, please try again");
    return;
  };

  res.cookie('user_id', authenticateUser(users, req.body.email, req.body.password));
  res.redirect('/urls');
});

// delete my URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  const userURLs = urlsForUser(req.cookies["user_id"], urlDatabase);
  for (let short in userURLs) {
    if (short === req.params.shortURL) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
      return;
    }
  }

  res.status(401);
  res.send("You are not authorized to delete this URL");
  return;
});

// edit longURL
app.post('/urls/:shortURL', (req, res) => {
  const long = req.body.longURL;
  urlDatabase[req.params.shortURL] = long;
  res.redirect('/urls');
});

// // edit longURL
app.post('/urls/:shortURL', (req, res) => {
  const userURLs = urlsForUser(req.cookies["user_id"], urlDatabase);
  console.log(userURLs);

  for (const short in userURLs) {
    if (short === req.params.shortURL) {
      urlDatabase[req.params.shortURL].longURL = req.body.newURL;
      res.redirect('/urls');
      return;
    } else {
      res.status(401);
      res.send("You are not authorized to edit this URL");
      return;
    }
  };
});


// registration handler
app.post('/register', (req, res) => {
  // error handling
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  };

  if (authenticateUser(users, req.body.email) !== false) {
    res.status(400);
    res.send("Email already exists, please log in");
    return;
  };

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

// delete cookie on logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});