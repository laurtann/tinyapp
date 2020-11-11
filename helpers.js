// check if email exists in database
const authenticateUser = function(database, email, password) {
  if (password === undefined) {
    for (let user in database) {
      if (database[user].email === email) {
        return user;
      }
    }
  } else {
    for (let user in database) {
      if (database[user].email === email && database[user].password === password) {
        return user;
      }
    }
  } return false;
}

module.exports =  authenticateUser;