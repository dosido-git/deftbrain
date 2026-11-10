// The production server resolves /about to about.html. Mirror that route
// in the React development server so the shared navigation works in preview.
module.exports = function setupProxy(app) {
  const { renderEmbedBadge } = require('./seo/embedBadge');
  app.get('/embeds/:id/:theme.svg', (req, res) => {
    const badge = renderEmbedBadge(req.params.id, req.params.theme);
    return badge ? res.type('image/svg+xml').send(badge) : res.sendStatus(404);
  });
  app.get('/about', (req, res) => {
    const query = req.url.slice(req.path.length);
    res.redirect(302, '/about.html' + query);
  });
};
