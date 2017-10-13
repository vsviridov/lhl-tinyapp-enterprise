const COOKIE_NAME = "userId";
const debug = require("debug")("tinyapp:middleware");

module.exports = {
  authMiddleware() {
    return (req, res, next) => {
      debug("Entering authMiddleware: ");
      const userId = req.signedCookies[COOKIE_NAME];
      req.userId = userId;
      req.user = req.db.findUserById(req.userId);
      res.locals.loggedIn = !!req.user;
      res.locals.username = (req.user || {}).email;

      res.authenticate = userId =>
        res.cookie(COOKIE_NAME, userId, { signed: true });
      res.logout = () => res.clearCookie(COOKIE_NAME).redirect("/");

      next();
      debug("Leaving authMiddleware");
    };
  },
  localsMiddleware(reqLocals = {}, resLocals = {}) {
    return (req, res, next) => {
      for (const key in reqLocals) {
        if (Object.prototype.hasOwnProperty.call(reqLocals, key)) {
          req[key] = reqLocals[key];
        }
      }
      res.locals = { ...res.locals, ...resLocals };
      next();
    };
  },
  injectUrls() {
    return (req, res, next) => {
      debug("Entering injectUrls");
      res.locals.urls = req.db.scoped(req.userId).all;
      next();
      debug("Leaving injectUrls");
    };
  },
  error() {
    return (error, req, res, next) => {
      debug("enter error");
      res.status(500).render("error", { error, bare: true }, (err, html) => {
        if (err) {
          debug(err);
          return res.status(500).json({ error: error.message });
        }
        res.send(html);
        next();
      });
      debug("leaving error");
    };
  },
};
