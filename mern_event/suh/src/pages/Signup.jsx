// File: suh/src/pages/Signup.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css'; // Reusing your elegant login styles!

export default function Signup({ setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Call the new backend route
      const response = await axios.post('/api/auth/signup', formData);

      // Save token and auto-login
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
      navigate('/events'); // Instantly redirect to the student feed

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during signup.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create an Account</h2>
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSignup}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="name"
              className={styles.input} 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              name="email"
              className={styles.input} 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              name="password"
              className={styles.input} 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className={styles.button}>Sign Up</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}