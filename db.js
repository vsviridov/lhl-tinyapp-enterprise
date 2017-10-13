const bcrypt = require("bcrypt");
const debug = require("debug")("tinyapp:db");

const users = [];
var urls = [];

const propEq = (prop, val) => obj => obj[prop] === val;

const getRandomId = () => (1000000 * Math.random()).toString(36);

const db = {
  register(email, password, id = getRandomId()) {
    debug(`register(${email}, ${password}, ${id})`);
    if (!email) {
      throw new Error("Email must be provided");
    }
    if (!password) {
      throw new Error("Password must be provided");
    }
    const user = this.findUserByEmail(email);
    if (user) {
      throw new Error("User with this email already exists");
    }

    users.push({
      id,
      email,
      password,
      toString() {
        return `User(${this.email})`;
      },
    });

    return id;
  },
  authenticate(email, password) {
    debug(`authenticate(${email}, ${password})`);
    if (!email) {
      throw new Error("Email must be provided");
    }
    if (!password) {
      throw new Error("Password must be provided");
    }
    const user = this.findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    return user.id;
  },
  findUserById(id) {
    return users.find(propEq("id", id));
  },
  findUserByEmail(email) {
    return users.find(propEq("email", email));
  },
  findUrlById(shortUrl) {
    return urls.find(propEq("id", shortUrl));
  },
  clicked(shortUrl) {
    const url = this.findUrlById(shortUrl);
    url.clicks++;
    url.lastClick = new Date();
  },
  scoped(userId) {
    const user = this.findUserById(userId);
    // if (!user) {
    //   throw new Error("Must be authenticated");
    // }
    debug(`scope: ${user}`);
    return {
      findUrlById(shortUrl) {
        const url = db.findUrlById(shortUrl);
        if (!url || url.userId !== userId) {
          throw new Error("Url not found");
        }
        return url;
      },
      deleteUrlById(shortUrl) {
        // XXX: Not authenticated
        urls = urls.filter(url => url.id !== shortUrl);
      },
      createUrl(longUrl, id = getRandomId()) {
        debug(`createUrl(${longUrl})`);
        if (!longUrl) {
          throw new Error("Must provide longUrl");
        }
        urls.push({ id, userId, longUrl, clicks: 0, lastClick: null });
        return id;
      },
      get all() {
        return urls.filter(propEq("userId", userId));
      },
      updateUrl(shortUrl, longUrl) {
        const url = db.findUrlById(shortUrl);
        if (!url) {
          throw new Error("URL does not exist");
        }
        if (url.userId !== userId) {
          throw new Error("You are not the owner");
        }

        url.longUrl = longUrl;
        url.clicks = 0;
        url.lastClick = null;
      },
    };
  },
};

module.exports = db;

db.register("user@example.com", "password", "testuser");
db.scoped("testuser").createUrl("https://google.com", "goog");
db.scoped("testuser").createUrl("https://microsoft.com", "msft");
