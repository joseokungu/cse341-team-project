import {
  createUser,
  findUserByEmail,
  verifyPassword
} from '../models/users.js';

export async function register(req, res, next) {
  const { name, email, password } = req.body;

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).render('register', {
      title: 'Create Account',
      error: 'Please provide your name, email, and password.'
    });
  }

  try {
    const existingUser = await findUserByEmail(email.trim());
    if (existingUser) {
      return res.status(409).render('register', {
        title: 'Create Account',
        error: 'An account with that email already exists.'
      });
    }

    await createUser({
      name: name.trim(),
      email: email.trim(),
      password
    });

    return res.redirect('/login');
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).render('register', {
        title: 'Create Account',
        error: 'An account with that email already exists.'
      });
    }

    return next(error);
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).render('login', {
      title: 'Log In',
      error: 'Please enter your email and password.'
    });
  }

  try {
    const user = await findUserByEmail(email.trim());
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render('login', {
        title: 'Log In',
        error: 'Invalid email or password.'
      });
    }

    return req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }

      req.session.userId = user._id.toString();
      req.session.username = user.name;
      req.session.role = user.role.name;

      return req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        return res.redirect('/');
      });
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res, next) {
  return req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}
