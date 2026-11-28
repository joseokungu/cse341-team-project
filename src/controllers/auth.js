// EJS controllers for registering, signing in, and signing out.
import {
  getBody,
  validateLogin,
  validateRegistration,
} from "../includes/auth-validation.js";
import {
  createUser,
  findExistingUser,
  findUserByEmail,
  verifyPassword,
} from "../models/users.js";

const DUPLICATE_KEY_ERROR = 11000;

// The same message for a wrong password and an unknown email, so the page never
// reveals which accounts exist.
const INVALID_LOGIN_MESSAGE = "Invalid email or password.";
const DUPLICATE_USER_MESSAGE = "An account with that email or username already exists.";

// express-session's methods use callbacks. These wrap them so they can be awaited.
const regenerateSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
};

const saveSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
};

const destroySession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
};

// Sign a user in. A brand new session id is issued first, so a session id that an
// attacker planted before login cannot be reused afterwards (session fixation).
const signIn = async (req, sessionUser) => {
  await regenerateSession(req);
  req.session.user = sessionUser;
  await saveSession(req);
};

// Where a signed-in user goes. Admins have their own dashboard.
const homeFor = (user) => {
  return user.role === "admin" ? "/admin-dashboard" : "/dashboard";
};

// The passwords are never passed back to the page.
const renderRegister = (res, status, errors, values = {}) => {
  const { displayName, username, email } = values;

  return res.status(status).render("register", {
    title: "Register",
    errors,
    values: { displayName, username, email },
  });
};

const renderLogin = (res, status, errors, values = {}) => {
  return res.status(status).render("login", {
    title: "Log In",
    errors,
    values: { email: values.email },
  });
};

export function registerPage(req, res) {
  if (req.user) {
    return res.redirect(homeFor(req.user));
  }

  return renderRegister(res, 200, []);
}

export async function registerUser(req, res, next) {
  try {
    const { errors, values } = validateRegistration(getBody(req));

    if (errors.length > 0) {
      return renderRegister(res, 400, errors, values);
    }

    if (await findExistingUser(values.email, values.username)) {
      return renderRegister(res, 409, [DUPLICATE_USER_MESSAGE], values);
    }

    // Only the validated fields are passed on. A submitted "role" is never read, so
    // every new account is a customer.
    const user = await createUser(values);

    await signIn(req, user);

    return res.redirect(homeFor(user));
  } catch (error) {
    // Two requests can both pass the check above. The unique indexes catch the second.
    if (error.code === DUPLICATE_KEY_ERROR) {
      return renderRegister(res, 409, [DUPLICATE_USER_MESSAGE], validateRegistration(getBody(req)).values);
    }

    if (error.name === "ValidationError") {
      return renderRegister(
        res,
        400,
        ["Please check the details you entered."],
        validateRegistration(getBody(req)).values
      );
    }

    return next(error);
  }
}

export function loginPage(req, res) {
  if (req.user) {
    return res.redirect(homeFor(req.user));
  }

  return renderLogin(res, 200, []);
}

export async function loginUser(req, res, next) {
  try {
    const { errors, values } = validateLogin(getBody(req));

    if (errors.length > 0) {
      return renderLogin(res, 400, errors, values);
    }

    const found = await findUserByEmail(values.email);

    // Check the password even when the user was not found (see verifyPassword).
    const passwordMatches = await verifyPassword(values.password, found?.passwordHash);

    if (!found || !passwordMatches) {
      return renderLogin(res, 401, [INVALID_LOGIN_MESSAGE], values);
    }

    const user = {
      id: String(found._id),
      name: found.displayName,
      username: found.username,
      email: found.email,
      // If a role is somehow missing, fall back to the least privileged one.
      role: found.role?.name ?? "customer",
    };

    await signIn(req, user);

    return res.redirect(homeFor(user));
  } catch (error) {
    return next(error);
  }
}

export async function logoutUser(req, res, next) {
  try {
    await destroySession(req);
    res.clearCookie("connect.sid");

    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
}