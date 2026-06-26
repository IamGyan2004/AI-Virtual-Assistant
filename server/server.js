const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const assistantRoutes = require('./routes/assistant');
const userStore = require('./utils/userStore');

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

async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      try {
        await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
      } catch (error) {
        console.warn('Failed to connect to configured MongoDB URI:', error.message);
        console.log('Falling back to in-memory user store');
      }
    }

    await userStore.ensureDemoUser();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
