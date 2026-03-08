// File: suh/src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Call your Node.js backend
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Save token and user data to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update global React state
      setUser(response.data.user);

      // Redirect based on role
      if (response.data.user.role === 'admin') navigate('/admin');
      else if (response.data.user.role === 'organizer') navigate('/organizer');
      else navigate('/events');

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome Back</h2>
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              className={styles.input} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className={styles.button}>Login</button>
        </form>

        {/* The Sign Up link goes right here! */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>New here? </span>
          <Link to="/signup" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}