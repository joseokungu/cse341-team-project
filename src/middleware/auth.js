export const loadSessionUser = async (req, res, next) => {
  req.user = req.session?.user || null;
  res.locals.user = req.user;
  next();
};

const isLoggedIn = (req) => Boolean(req.user || req.session?.user);
const hasRole = (req, role) => (req.user?.role || req.session?.user?.role) === role;

export function requireApiLogin() {
  return (req, res, next) => {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    return next();
  };
}

export function requirePageLogin() {
  return (req, res, next) => {
    if (!isLoggedIn(req)) {
      return res.redirect('/login');
    }

    return next();
  };
}

export function requireApiRole(roleName) {
  return (req, res, next) => {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasRole(req, roleName)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

export function requirePageRole(roleName) {
  return (req, res, next) => {
    if (!isLoggedIn(req)) {
      return res.redirect('/login');
    }

    if (!hasRole(req, roleName)) {
      return res.status(403).render('errors/403', { title: 'Forbidden' });
    }

    return next();
  };
}
