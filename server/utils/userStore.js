const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const memoryUsers = [];

function isMongoAvailable() {
  return Boolean(process.env.MONGO_URI) && mongoose.connection.readyState === 1;
}

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id || user.id,
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt || new Date(),
  };
}

async function findByEmail(email) {
  if (isMongoAvailable()) {
    return User.findOne({ email: email.toLowerCase() });
  }

  return memoryUsers.find((user) => user.email === email.toLowerCase()) || null;
}

async function findById(id) {
  if (isMongoAvailable()) {
    return User.findById(id);
  }

  return memoryUsers.find((user) => user._id === id) || null;
}

async function createUser({ name, email, password }) {
  if (isMongoAvailable()) {
    const user = new User({ name, email: email.toLowerCase(), password });
    await user.save();
    return user;
  }

  const user = {
    _id: crypto.randomUUID(),
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password,
    createdAt: new Date(),
  };

  memoryUsers.push(user);
  return user;
}

async function ensureDemoUser() {
  const demoEmail = 'demo@assistant.local';
  const demoPassword = 'Password123!';

  const existingUser = await findByEmail(demoEmail);
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(demoPassword, 12);
    const createdUser = await createUser({
      name: 'Demo User',
      email: demoEmail,
      password: hashedPassword,
    });
    console.log(`Seeded demo user: ${demoEmail} / ${demoPassword}`);
    return createdUser;
  }

  console.log('Demo user already exists:', demoEmail);
  return existingUser;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  ensureDemoUser,
  toSafeUser,
};
