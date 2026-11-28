export const loadSessionUser = async (req, res, next) => {
  req.user = req.session.user || null;
  res.locals.user = req.user;
  next();
};

const isLoggedIn = (req) => { return Boolean(req.user); };
const hasRole = (req, role) => { return req.user.role === role; };

export function requireApiLogin() {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    return next();
  };
}

export function requirePageLogin() {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.redirect('/login');
    }

    return next();
  };
}

export function requireApiRole(roleName) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.session.role !== roleName) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

export function requirePageRole(roleName) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.redirect('/login');
    }

    if (req.session.role !== roleName) {
      return res.status(403).render('errors/403', { title: 'Forbidden' });
    }

    return next();
  };
}
