// all the helper funcs 
// have to import users 
const users = require('./express-server.js');

// check if email exists in database
const checkUserEmail = function(userObj) {
  for (let user in users) {
    if (users[user].email === userObj.email) {
      return true;
    }
  }
  return false;
}

// function to handle registration errors
const handleRegErrors = function(userObj) {
  if (!userObj.email || !userObj.password) {
    res.statusCode(400);
  }

  if (checkUserEmail(userObj)) {
    res.statusCode(400);
  }
}

module.exports = { handleRegErrors, checkUserEmail }