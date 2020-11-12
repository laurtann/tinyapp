const { assert } = require('chai');

const { fetchUserFromEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('fetchUserFromEmail', function() {
  it('should return a user with valid email', function() {
    const user = fetchUserFromEmail(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";
    assert.isTrue(user.id === expectedOutput);
  });

  it("should return false if email is not in database", function() {
    const user = fetchUserFromEmail(testUsers, "tinyapp@example.com");
    const expectedOutput = false;
    assert.isTrue(user === expectedOutput);
  });
});