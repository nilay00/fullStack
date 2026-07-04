function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongEnoughPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

function validateRegisterInput(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push("Name must be at least 2 characters.");
  if (!body.email || !isValidEmail(body.email)) errors.push("A valid email is required.");
  if (!body.password || !isStrongEnoughPassword(body.password)) errors.push("Password must be at least 6 characters.");
  if (!body.gender || !["male", "female"].includes(body.gender)) errors.push("Gender must be male or female.");
  if (!body.dob) errors.push("Date of birth is required.");
  return errors;
}

module.exports = { isValidEmail, isStrongEnoughPassword, validateRegisterInput };
