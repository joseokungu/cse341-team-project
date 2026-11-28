// Input checks for the register and login forms. Only strings are accepted, so an
// object or array sent in a form field (for example email[$ne]=x) counts as missing
// instead of reaching a database query.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected.
const MAX_PASSWORD_BYTES = 72;

const asText = (value) => {
  return typeof value === "string" ? value : "";
};

// The form body, or an empty object if the request had none.
export const getBody = (req) => {
  const { body } = req;

  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
};

export function validateRegistration(body) {
  const displayName = asText(body.displayName).trim();
  const username = asText(body.username).trim().toLowerCase();
  const email = asText(body.email).trim().toLowerCase();
  const password = asText(body.password);
  const confirmPassword = asText(body.confirmPassword);

  const errors = [];

  if (displayName.length < 1 || displayName.length > 100) {
    errors.push("Display name must be 1 to 100 characters.");
  }

  if (!USERNAME_PATTERN.test(username)) {
    errors.push("Username must be 3 to 30 characters: lowercase letters, digits, and underscores.");
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.push("Enter a valid email address.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  } else if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    errors.push(`Password must be at most ${MAX_PASSWORD_BYTES} bytes.`);
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  // `values` includes the password so the caller can create the user. The controller
  // never passes the password back to the page.
  return { errors, values: { displayName, username, email, password } };
}

export function validateLogin(body) {
  const email = asText(body.email).trim().toLowerCase();
  const password = asText(body.password);

  const errors = [];

  if (email === "" || password === "") {
    errors.push("Enter your email and password.");
  }

  return { errors, values: { email, password } };
}