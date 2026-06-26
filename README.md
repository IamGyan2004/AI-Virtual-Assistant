# AI-Virtual-Assistant

A full-stack AI voice-enabled assistant built with the MERN stack, Web Speech API, and Gemini AI.

## Features

- React frontend with voice capture and speech synthesis
- Node.js + Express backend with secure JWT authentication
- MongoDB user storage with bcrypt password hashing
- Gemini AI integration for intelligent voice-driven responses
- Voice-enabled assistant capable of real-time spoken conversation

## Setup

### Backend

1. Create `.env` in `/server` (or copy `.env.example`):

```text
MONGO_URI=mongodb://127.0.0.1:27017/aiassistant
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_openai_api_key_or_gemini_api_key
PORT=5000
```

2. Install dependencies:

```bash
cd /workspaces/AI-Virtual-Assistant/server
npm install
```

3. Start the backend:

```bash
npm run dev
```

### Frontend

1. Install dependencies:

```bash
cd /workspaces/AI-Virtual-Assistant/client
npm install
```

2. Start the frontend:

```bash
npm start
```

## Usage

- Register or login with email/password
- Click `Speak Now` and speak a command
- The assistant will respond using Gemini AI and browser speech synthesis
- Use the chat log to review spoken interactions

### Demo login

Use the seeded demo account:

- Email: `demo@assistant.local`
- Password: `Password123!`

## Notes

- This app relies on browser speech recognition support
- Gemini AI requests require a valid API key
