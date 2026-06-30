const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db     = require('../config/db');

const BCRYPT_ROUNDS = 12;

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10) || 900 }
  );
}


async function registerUser({ email, password, role, firstName, lastName }) {
  const existing = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    const err = new Error('A user with this email address already exists.');
    err.code   = 'EMAIL_TAKEN';
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId       = `USR-${uuidv4().slice(0, 8).toUpperCase()}`;

  await db.query(
    `INSERT INTO users (user_id, email, password_hash, role, first_name, last_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, email, passwordHash, role, firstName, lastName]
  );

  return { userId, email, role, firstName, lastName };
}

async function loginUser({ email, password }) {
  const rows = await db.query(
    'SELECT user_id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = ?',
    [email]
  );

  const GENERIC = new Error('Invalid email or password.');
  GENERIC.code   = 'INVALID_CREDENTIALS';
  GENERIC.status = 401;

  if (rows.length === 0) throw GENERIC;

  const user = rows[0];

  if (!user.is_active) {
    const err = new Error('This account has been deactivated. Contact an administrator.');
    err.code   = 'ACCOUNT_INACTIVE';
    err.status = 403;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw GENERIC;

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10) || 900,
    user: {
      userId:    user.user_id,
      email:     user.email,
      role:      user.role,
      firstName: user.first_name,
      lastName:  user.last_name,
    },
  };
}

module.exports = { registerUser, loginUser };
