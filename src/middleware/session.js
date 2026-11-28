// Session setup and the middleware that exposes the signed-in user.
//
// The session cookie holds only a session id. The user's details live on the server
// in req.session.user as { id, name, username, email, role }, where `role` is the
// role name ("customer" or "admin").
import session from "express-session";

const NODE_ENV = (process.env.NODE_ENV || "production").toLowerCase();

// SESSION_SECRET signs the session cookie. It must be long, private, kept in .env and
// in the hosting environment settings, and never committed. Only the test run may
// fall back to a fixed value.
const secret =
  process.env.SESSION_SECRET || (NODE_ENV === "test" ? "test-only-session-secret" : undefined);

if (!secret) {
  throw new Error(
    "SESSION_SECRET is required. Add it to your .env file and to the hosting environment settings."
  );
}

export const sessionMiddleware = session({
  secret,
  // Do not rewrite unchanged sessions, and do not create a session (or send a cookie)
  // for visitors who never sign in.
  resave: false,
  saveUninitialized: false,
  cookie: {
    // The cookie cannot be read by browser JavaScript.
    httpOnly: true,
    // Not sent with requests that other sites trigger (basic protection against CSRF).
    sameSite: "lax",
    // Secure on HTTPS (Render), and still works on http://localhost. This relies on
    // app.set("trust proxy", 1) in app.js when running behind Render's proxy.
    secure: "auto",
    maxAge: 1000 * 60 * 60 * 24,
  },
});

// Copies the session's user to req.user (for controllers) and res.locals.user (for
// EJS templates). It is always defined, and null when nobody is signed in, so
// templates can safely check `user`.
export const loadSessionUser = (req, res, next) => {
  req.user = req.session?.user ?? null;
  res.locals.user = req.user;
  next();
};