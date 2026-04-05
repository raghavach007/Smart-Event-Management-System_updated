// File: suh/src/pages/StudentFeed.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react'; 
import styles from './StudentFeed.module.css';

export default function StudentFeed() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({}); 
  const [announcements, setAnnouncements] = useState({}); // New state: { event_id: [list] }
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
        const fetchedEvents = eventsRes.data;
        setEvents(fetchedEvents);

        // 2. Fetch the student's personal registrations
        if (user && token) {
          const regRes = await axios.get('/api/student/registrations', authConfig);
          const regMap = {};
          regRes.data.forEach(reg => { regMap[reg.event_id] = reg.qr_token; });
          setRegistrations(regMap);

          // 3. Fetch announcements for ALL events
          // We loop through each event and get its updates
          const announcementMap = {};
          await Promise.all(fetchedEvents.map(async (event) => {
            try {
              const annRes = await axios.get(`/api/student/announcements/${event.id}`, authConfig);
              announcementMap[event.id] = annRes.data;
            } catch (err) {
              announcementMap[event.id] = []; // Fallback if no announcements or error
            }
          }));
          setAnnouncements(announcementMap);
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
            const isRegistered = registrations[event.id];
            const eventAnnouncements = announcements[event.id] || [];
            
            return (
              <div key={event.id} className={styles.card}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                
                <div className={styles.eventDate}>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                
                <p className={styles.eventDesc}>{event.description}</p>

                {/* --- NEW: ANNOUNCEMENTS SECTION --- */}
                <div className={styles.announcementSection} style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                   <h4 style={{ fontSize: '0.9rem', color: '#555', marginBottom: '5px' }}>Latest Updates:</h4>
                   {eventAnnouncements.length > 0 ? (
                      eventAnnouncements.slice(0, 2).map((ann) => ( // Only show last 2 for UI space
                        <div key={ann.id} style={{ fontSize: '0.8rem', background: '#fff9c4', padding: '5px', borderRadius: '4px', marginBottom: '5px' }}>
                           <strong>{ann.title}:</strong> {ann.content}
                        </div>
                      ))
                   ) : (
                     <p style={{ fontSize: '0.8rem', color: '#999' }}>No updates yet.</p>
                   )}
                </div>
                {/* --------------------------------- */}
                
                {isRegistered ? (
                  <div className={styles.ticketContainer}>
                    <span className={styles.ticketText}>Digital Ticket</span>
                    <div className={styles.qrCode}>
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