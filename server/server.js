const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const assistantRoutes = require('./routes/assistant');

dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-key') {
  console.warn('Warning: JWT_SECRET is not configured in .env. Using development fallback secret.');
}
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/assistant', assistantRoutes);

const clientBuildPath = path.join(__dirname, '../client/build');
if (process.env.NODE_ENV === 'production' || true) {
  app.use(express.static(clientBuildPath));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Virtual Assistant backend is running' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }

  if (process.env.NODE_ENV === 'production') {
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  }

  res.send('AI Virtual Assistant backend is running. Use /api/health for JSON status.');
});

async function createMemoryMongoUri() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('Started in-memory MongoDB instance');
  return uri;
}

async function startServer() {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
      } catch (error) {
        console.warn('Failed to connect to configured MongoDB URI:', error.message);
        mongoUri = await createMemoryMongoUri();
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('Connected to fallback in-memory MongoDB');
      }
    } else {
      mongoUri = await createMemoryMongoUri();
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to in-memory MongoDB');
    }

    await ensureDemoUser();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function ensureDemoUser() {
  try {
    const demoEmail = 'demo@assistant.local';
    const demoPassword = 'Password123!';
    const existingUser = await User.findOne({ email: demoEmail });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      await User.create({ name: 'Demo User', email: demoEmail, password: hashedPassword });
      console.log(`Seeded demo user: ${demoEmail} / ${demoPassword}`);
    } else {
      console.log('Demo user already exists:', demoEmail);
    }
  } catch (error) {
    console.error('Seed user error:', error.message);
  }
}

startServer();
