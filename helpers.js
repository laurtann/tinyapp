// check if email exists in database
const checkUserEmail = function(database, email) {
  for (let user in database) {
    if (database[user].email === email) {
      return email;
    }
  }
  return false;
}

module.exports =  checkUserEmail;