// File: suh/src/pages/StudentFeed.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react'; // Imports the new QR generator
import styles from './StudentFeed.module.css';

export default function StudentFeed() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({}); // Stores event_id -> qr_token
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const authConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch all approved events
        const eventsRes = await axios.get('/api/events');
        setEvents(eventsRes.data);

        // 2. Fetch the student's personal registrations
        if (user && token) {
          const regRes = await axios.get('/api/student/registrations', authConfig);
          
          // Convert array to an object map: { event_id: qr_token } for super fast lookups
          const regMap = {};
          regRes.data.forEach(reg => { regMap[reg.event_id] = reg.qr_token; });
          setRegistrations(regMap);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRegister = async (eventId) => {
    try {
      const res = await axios.post(`/api/student/events/${eventId}/register`, {}, authConfig);
      
      // Update local UI immediately so the QR code appears without a page refresh
      setRegistrations(prev => ({ ...prev, [eventId]: res.data.qr_token }));
      alert('Registration successful! Your ticket is ready.');
      
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading) return <div className={styles.container}><h2>Loading upcoming events...</h2></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Campus Events</h1>
        <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
      </header>

      {events.length === 0 ? (
        <div className={styles.emptyState}>No approved events available right now.</div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => {
            const isRegistered = registrations[event.id]; // Checks if they already have a ticket
            
            return (
              <div key={event.id} className={styles.card}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                
                <div className={styles.eventDate}>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                
                <p className={styles.eventDesc}>{event.description}</p>
                
                {/* Conditional Rendering: Show QR Code IF registered, ELSE show button */}
                {isRegistered ? (
                  <div className={styles.ticketContainer}>
                    <span className={styles.ticketText}>Digital Ticket</span>
                    <div className={styles.qrCode}>
                      {/* Generates the actual barcode visual from the unique token */}
                      <QRCodeCanvas value={registrations[event.id]} size={120} />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleRegister(event.id)} 
                    className={styles.registerBtn}
                    style={{ marginTop: 'auto' }}
                  >
                    Register Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}