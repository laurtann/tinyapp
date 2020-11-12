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

// function to check URLs in database
const urlsForUser = function(id, urlDB) {
  const userUrls = {};
  for (const short in urlDB) {
    if (urlDB[short].userID === id) {
      userUrls[short] = urlDB[short];
    } 
  } 
  return userUrls;
};

module.exports = { authenticateUser, urlsForUser };