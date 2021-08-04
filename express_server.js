const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const user = users[req.cookies["user_id"]];
  const templateVars = { shortURL, longURL, user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shorURL", (req, res) => {
  const shortURL = req.params.shorURL;
  urlDatabase[shortURL] = req.body.newURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  delete urlDatabase[id];

  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  console.log("users:", users);
  const user = users[req.cookies["user_id"]];
  const templateVars = { user };
  console.log("templateVars", templateVars);
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email: req.body.email,
    password: req.body.password,
  };
  console.log("users:", users);
  users[userId] = newUser;
  res.cookie("user_id", userId);

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
