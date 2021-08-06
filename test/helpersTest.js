const { assert } = require("chai");

const { getUserByEmail, checkEmailAndPassword } = require("../helpers.js");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    // 'pass' is the password before hashed
    password: "$2b$10$2YCZMSaqizp4kc1STwSOvedWrOq36LRrEs/CqEV8ss1cRrAkzQ.ju",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    // 'pass2' is the password before hashed
    password: "$2b$10$2lLnqqe9isMgb4P6N892hu2.1CV1ZIHfKZh5aQyQscylPjV4bRObu",
  },
};

describe("getUserByEmail", () => {
  it("should return a user with valid email", () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput);
  });

  it("should return undefined with invalid email", () => {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe("checkEmailAndPassword", () => {
  it("should return true if Email & Password exist", () => {
    const email = testUsers["userRandomID"].email;
    const password = "pass";
    assert.equal(checkEmailAndPassword(email, password, testUsers), true);
  });

  it("should return false if Email & Password don't exist", () => {
    const password = "pass";
    assert.equal(checkEmailAndPassword("a@a.com", password, testUsers), false);
  });
});
