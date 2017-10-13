const debug = require("debug")("tinyapp:server");
const express = require("express");
const { urlencoded } = require("body-parser");
const cookieParser = require("cookie-parser");

const config = require("./config");
const db = require("./db");
const {
  authMiddleware,
  localsMiddleware,
  injectUrls,
  error,
} = require("./middlewares");
const { render, redirect } = require("./helpers");

const app = express();

app.set("view engine", "ejs");

app.locals = {
  title: null,
  loggedIn: false,
  username: null,
  error: null,
  bare: false,
};

app.use(express.static(`${__dirname}/public`));
app.use(urlencoded({ extended: true }));
app.use(cookieParser(config.secret));
app.use(localsMiddleware({ db }));
app.use(authMiddleware());

app.param("shortUrl", (req, res, next, shortUrl) => {
  debug("entering :shortUrl");
  res.locals.url = req.db.scoped(req.userId).findUrlById(shortUrl);
  next();
  debug("leaving :shortUrl");
});

app.get("/", redirect("/urls"));
app.get("/urls", injectUrls(), render("index"));

app.get("/urls/new", render("new"));
app.post("/urls/new", (req, res) => {
  const { longUrl } = req.body;
  const shortUrl = req.db.scoped(req.userId).createUrl(longUrl);
  res.redirect(`/urls/${shortUrl}`);
});

app.get("/urls/:shortUrl", render("show"));

app.post("/urls/:shortUrl", (req, res) => {
  req.db.scoped(req.userId).updateUrl(res.locals.url.id, req.body.longUrl);
  res.redirect(`/urls/${res.locals.url.id}`);
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  req.db.scoped(req.userId).deleteUrlById(req.params.shortUrl);
  res.redirect("/");
});

app.get("/u/:shortUrl", (req, res) => {
  req.db.clicked(res.locals.url.id);
  res.redirect(res.locals.url.longUrl);
});

app.get("/login", redirect("/"));
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const userId = req.db.authenticate(email, password);

  if (userId) {
    return res.authenticate(userId).redirect("/");
  }

  throw new Error("Invalid email or password");
});

app.get("/register", render("register"));
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  try {
    const userId = req.db.register(email, password);

    return res.authenticate(userId).redirect("/");
  } catch (error) {
    res.render("register", { email, password, error });
  }
});

app.post("/logout", (req, res) => res.logout());

app.use(error());

app.listen(config.port, "0.0.0.0", function() {
  console.log(`Listening on ${this.address().port}`);
});
