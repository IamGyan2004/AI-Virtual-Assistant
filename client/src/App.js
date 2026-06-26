import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');
  const messageRef = useRef('');

  useEffect(() => {
    if (!recognition) {
      setStatus('Browser does not support speech recognition.');
      return;
    }
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setListening(false);
      handleSend(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setStatus('Speech recognition error.');
    };
    recognition.onend = () => {
      setListening(false);
    };
  }, []);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const apiBase = process.env.REACT_APP_API_BASE_URL || '';

  const handleAuth = async () => {
    try {
      const url = `${apiBase}/api/auth/${authMode}`;
      const payload = authMode === 'login' ? { email, password } : { name, email, password };
      const response = await axios.post(url, payload);
      const authToken = response.data.token;
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setStatus('Successfully authenticated.');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Authentication failed.');
    }
  };

  const handleSend = async (text) => {
    if (!text || !token) return;
    const newLogItem = { role: 'user', text };
    setChatLog((prev) => [...prev, newLogItem]);

    try {
      const response = await axios.post(
        `${apiBase}/api/assistant/query`,
        { prompt: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantResponse = response.data.answer;
      setChatLog((prev) => [...prev, { role: 'assistant', text: assistantResponse }]);
      setStatus('Assistant responded.');
      speakText(assistantResponse);

      if (assistantResponse.toLowerCase().includes('open')) {
        setStatus('Action detected: open browser tab command.');
      }
    } catch (error) {
      setStatus(error.response?.data?.message || 'Assistant request failed.');
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (!recognition) return;
    setListening(true);
    setStatus('Listening...');
    recognition.start();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setChatLog([]);
    setEmail('');
    setPassword('');
    setName('');
    setStatus('Logged out.');
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Voice Assistant</h1>
        <p>Real-time voice commands powered by Gemini AI.</p>
      </header>

      {!token ? (
        <div className="auth-panel">
          {authMode === 'register' && (
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleAuth}>{authMode === 'login' ? 'Login' : 'Register'}</button>
          <button className="mode-toggle" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'Switch to Register' : 'Switch to Login'}
          </button>
        </div>
      ) : (
        <div className="assistant-panel">
          <button onClick={startListening} disabled={listening}>
            {listening ? 'Listening…' : 'Speak Now'}
          </button>
          <button onClick={() => handleSend(messageRef.current)} disabled={!messageRef.current}>
            Send Text
          </button>
          <button className="logout" onClick={logout}>Logout</button>

          <div className="chat-log">
            {chatLog.map((item, index) => (
              <div key={index} className={`chat-item ${item.role}`}>
                <strong>{item.role === 'user' ? 'You' : 'Assistant'}:</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer>{status}</footer>
    </div>
  );
}

export default App;
