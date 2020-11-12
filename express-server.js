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

const urlDatabase = {};

// database of users
const users = {};

// redirect from home page
app.get('/', (req, res) => {
  const userID = req.cookies['user_id'];
  if (userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  }
})

// returns json string with urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// sending HTML
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// render urls page for logged in user 
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: urls, username: users[userID] };
  res.render("urls_index", templateVars);
});

// manage permissions and render new urls page
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) { 
    const templateVars = { username: users[userID] }
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/urls');
  }
});

// render register page/ redirect for logged in users
app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { username: users[userID] };
  res.render("register", templateVars);
});

// render new login page/redirect for logged in users
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { username: users[userID] };
  res.render("login", templateVars);
})

// manage permissions & short URL resassignment
app.get("/urls/:shortURL", (req, res) => {
  const short = req.params.shortURL;
  const userID = req.cookies["user_id"];
  let userURLs;

  if (userID) {
    userURLs = urlsForUser(userID, urlDatabase);
  } else {
    res.status(401);
    res.send("You are not authorized to view this Short Link, please Log In");
    return;
  };
  
  if (urlDatabase[short]) {
    if (userURLs[short] && userID) {
      const long = urlDatabase[short].longURL;
      const templateVars = { shortURL: short, longURL: long, username: users[userID]};
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
  const short = req.params.shortURL;
  const long = urlDatabase[short].longURL;
  res.redirect(long);
});

// update urlDatabase with new short/long pair 
app.post('/urls', (req, res) => { 
  const short = generateRandomString();
  const long = req.body.longURL;
  const userID = req.cookies["user_id"];
  urlDatabase[short] = { longURL: long, userID: userID };
  res.redirect(`/urls/${short}`);
});

// login post
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  };

  if (authenticateUser(users, email) === false) {
    res.status(403);
    res.send("Email not found, please register");
    return;
  };

  if (authenticateUser(users, email, password) === false) {
    res.status(403);
    res.send("Incorrect password, please try again");
    return;
  };

  res.cookie('user_id', authenticateUser(users, email, password));
  res.redirect('/urls');
});

// delete my URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.cookies["user_id"];
  const short = req.params.shortURL;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (userURLs[short] === short) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
    return;
  }

  res.status(401);
  res.send("You are not authorized to delete this URL");
  return;
});


// edit longURL 
app.post('/urls/:shortURL', (req, res) => {
  const short = req.params.shortURL;
  const newURL = req.body.newURL;
  const userID = req.cookies["user_id"];

  if (urlDatabase[short].userID === userID) {
    urlDatabase[short].longURL = newURL;
    res.redirect('/urls');
    return;
  } else {
    res.status(401);
    res.send("You are not authorized to edit this URL");
  }
});


// registration handler
app.post('/register', (req, res) => {
  // error handling
  const email = req.body.email;
  const password = req.body.password
  if (!email || !password) {
    res.status(400);
    res.send("Please enter a valid email & password");
    return;
  };

  if (authenticateUser(users, email) !== false) {
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