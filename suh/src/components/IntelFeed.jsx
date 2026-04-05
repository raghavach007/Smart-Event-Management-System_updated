import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, X } from 'lucide-react';
import styles from '../pages/StudentHub.module.css';

const IntelFeed = ({ isOpen, onClose, onDataReceived }) => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/student/announcements/all', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAnnouncements(res.data);
        
        // Bonus UX: Tell the Navbar if we have announcements for the red dot
        if (onDataReceived) {
          onDataReceived(res.data.length > 0);
        }
      } catch (err) {
        console.error("Error fetching Intel Feed:", err);
      }
    };

    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen, onDataReceived]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={22} /> Intel Feed
          </h2>
          <X onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>

        <div className="intel-feed-content">
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-color)', marginBottom: '1rem' }}>
            Live Updates
          </h4>
          {announcements.length > 0 ? (
            announcements.map((ann, index) => (
              <div key={index} style={{ 
                padding: '15px', 
                borderBottom: '1px solid #eee', 
                backgroundColor: '#fff9f9',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#8b0000' }}>{ann.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{ann.content}</p>
                <small style={{ color: '#999' }}>{new Date(ann.created_at).toLocaleTimeString()}</small>
              </div>
            ))
          ) : (
            <p style={{ opacity: 0.6 }}>No active updates at the moment.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default IntelFeed;