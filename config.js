module.exports = {
  get port() {
    return process.env.PORT || 8080;
  },
  get secret() {
    return process.env.SECRET || "do_not_actually_use_this";
  },
};
