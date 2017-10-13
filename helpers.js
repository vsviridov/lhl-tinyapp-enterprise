module.exports = {
  render(view, locals = {}) {
    return (req, res) => res.render(view, locals);
  },
  redirect(location = "/", status = 302) {
    return (req, res) => res.redirect(status, location);
  },
};
