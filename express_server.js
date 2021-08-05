const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
// created tinyCookie secure session
app.use(
  cookieSession({
    name: "tinyCookie",
    keys: ["myPassword", "secondPassword"],
  })
);
app.use(morgan("dev"));

app.set("view engine", "ejs");

// generate random alphanumeric numbers
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  b2xVn2: { userID: 1, longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { userID: 1, longURL: "http://www.google.com" },
  d34565: { userID: 2, longURL: "http://www.google.com" },
};

const users = {
  1: {
    id: "1",
    email: "a@a.com",
    password: "$2b$10$2YCZMSaqizp4kc1STwSOvedWrOq36LRrEs/CqEV8ss1cRrAkzQ.ju", // 'pass' is the password before hashed
  },
  2: {
    id: "2",
    email: "b@b.com",
    password: "$2b$10$2lLnqqe9isMgb4P6N892hu2.1CV1ZIHfKZh5aQyQscylPjV4bRObu", // 'pass2' is the password before hashed
  },
};

// 1. Return true if email & password already exists in users object
// 2. Checks if the email only exitsts in users object else return false
const isExist = (email, password) => {
  for (const user in users) {
    // hashed password stored in users
    const hashedPassword = users[user].password;

    // Verify if the user's email and password is not empty
    // Also check if the password is the same with the hashPassword stored in users
    if (
      email &&
      password &&
      users[user].email === email &&
      bcrypt.compareSync(password, hashedPassword)
    ) {
      return true;
    }

    if (users[user].email === email && password === undefined) {
      return true;
    }
  }
  return false;
};

// if logged in redirect to /urls
const redirectIfLogged = (req, res) => {
  if (Object.keys(users).includes(req.session["user_id"])) {
    return res.redirect("/urls");
  }
};

// filters and return only urlDabase that includes the specific userID
const urlsForUser = (id) => {
  const usersURL = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID.toString() === id) {
      usersURL[url] = urlDatabase[url];
    }
  }
  return usersURL;
};

// cross check if the user have permission to access the shortURL
const isShortURLExist = (shortURL, id) => {
  if (Object.keys(urlsForUser(id)).includes(shortURL)) {
    return true;
  }
  return false;
};

// display error message if page not found
const pageNotFound = (res) => {
  return res.status(403).render("urls_404", {
    error: "Please login / register to have access to this page!",
  });
};

// dispaly access denied for unauthorized user
const unauthorized = (res) => {
  return res.status(403).render("urls_404", { error: "Error: Access Denied!" });
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const cookieUserID = req.session["user_id"];
  console.log("Session Cookie", cookieUserID);

  // redirect to urls_404 page if not logged in
  if (!users[cookieUserID]) {
    pageNotFound(res);
  }

  const user = users[cookieUserID];
  const templateVars = { urls: urlsForUser(cookieUserID), user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // Accessible only if you logged in!
  if (req.session["user_id"]) {
    const user = users[req.session["user_id"]];
    const templateVars = { user };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (req.session["user_id"]) {
    const { longURL } = req.body;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { userID: req.session["user_id"], longURL };
    return res.redirect(`/urls/${shortURL}`);
  }
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.session["user_id"];

  // redirect to urls_404 page if not logged in
  if (!users[cookieUserID]) {
    pageNotFound(res);
  }

  if (isShortURLExist(shortURL, cookieUserID)) {
    const longURL = urlDatabase[shortURL].longURL;
    const user = users[cookieUserID];
    const templateVars = { shortURL, longURL, user };
    return res.render("urls_show", templateVars);
  }
  unauthorized(res);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.session["user_id"];

  // redirect to urls_404 page if not logged in
  if (!users[cookieUserID]) {
    pageNotFound(res);
  }

  // checks if user have access to edit
  if (isShortURLExist(shortURL, cookieUserID)) {
    urlDatabase[shortURL].longURL = req.body.newURL;
    urlDatabase[shortURL].userID = req.session["user_id"];
    return res.redirect(`/urls/${shortURL}`);
  }
  unauthorized(res);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieUserID = req.session["user_id"];

  // redirect to urls_404 page if not logged in
  if (!users[cookieUserID]) {
    pageNotFound(res);
  }

  if (isShortURLExist(shortURL, cookieUserID)) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }

  unauthorized(res);
});

app.get("/u/:shortURL", (req, res) => {
  // checking if the shortURL does exist in urlDatabase
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(404).render("urls_404");
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user };

  // if logged in redirect to /urls
  redirectIfLogged(req, res);

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  // checks if email exists in our object
  if (!isExist(email, password)) {
    return res
      .status(403)
      .render("urls_login", { error: "Email or Password is incorrect!" });
  }

  // finding the current object id using the email value
  const id = Object.keys(users).find((key) => users[key].email === email);

  // res.cookie("user_id", id);
  // send back encrypted cookie to client
  req.session["user_id"] = id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  // if logged in redirect to /urls
  redirectIfLogged(req, res);

  const user = users[req.session["user_id"]];
  const templateVars = { user };

  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  // check if email or password are empty
  // and also checks if email already exists in users object
  if (email.length === 0 || password.length === 0 || isExist(req.body.email)) {
    return res.status(400).render("urls_register", {
      error: "This email already exists or incorrect input!",
    });
  }

  // Password converted to hash value
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id,
    email,
    password: hashedPassword,
  };
  users[id] = newUser;
  // send back encrypted cookie to client
  req.session["user_id"] = id;

  res.redirect("/urls");
});

app.get("*", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
