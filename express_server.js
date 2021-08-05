const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.set("view engine", "ejs");

//
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  b2xVn2: { userId: 1, longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { userId: 1, longURL: "http://www.google.com" },
};

const users = {
  1: {
    id: "1",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  2: {
    id: "2",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// return true if email & password already exists in user object
// or it return true if email only exitsts in user object else return false
const isExist = (email, password) => {
  for (const user in users) {
    if (
      email &&
      password &&
      users[user].email === email &&
      users[user].password === password
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
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // Accessible only if you logged in!
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const { longURL } = req.body;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { userId: req.cookies["user_id"], longURL };
    res.redirect(`/urls/${shortURL}`);
  }
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const user = users[req.cookies["user_id"]];
  const templateVars = { shortURL, longURL, user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shorURL", (req, res) => {
  const shortURL = req.params.shorURL;
  urlDatabase[shortURL].longURL = req.body.newURL;
  urlDatabase[shortURL].userId = req.cookies["user_id"];
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  delete urlDatabase[id];

  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const user = users[req.cookies["user_id"]];
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
    res
      .status(403)
      .render("urls_login", { error: "Email or Password is incorrect!" });
  }

  // finding the current object id using the email value
  const id = Object.keys(users).find((key) => users[key].email === email);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  // if logged in redirect to /urls
  redirectIfLogged(req, res);

  const user = users[req.cookies["user_id"]];
  const templateVars = { user };

  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();

  // check if email or password are empty
  // and also checks if email already exists in users object
  if (
    req.body.email.trim().length === 0 ||
    req.body.password.trim().length === 0 ||
    isExist(req.body.email)
  ) {
    res.status(400).render("urls_register", {
      error: "This email already exists or incorrect input!",
    });
  }

  const newUser = {
    id: userId,
    email: req.body.email.trim(),
    password: req.body.password.trim(),
  };
  console.log("users:", users);
  users[userId] = newUser;
  res.cookie("user_id", userId);

  res.redirect("/urls");
});

app.get("*", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
