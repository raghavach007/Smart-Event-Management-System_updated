import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnnouncementsList = ({ eventId }) => {
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                // If eventId is provided, get for one event; otherwise get all for student
                const url = eventId 
                    ? `http://localhost:5000/api/student/announcements/${eventId}`
                    : `http://localhost:5000/api/student/announcements/all`;
                
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAnnouncements(res.data);
            } catch (err) {
                console.error("Error fetching updates", err);
            }
        };
        fetchAnnouncements();
    }, [eventId]);

    return (
        <div className="announcements-container">
            {announcements.map((ann, index) => (
                <div key={index} style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                    <h4 style={{ margin: 0, color: '#d9534f' }}>{ann.title}</h4>
                    <p style={{ fontSize: '0.9rem' }}>{ann.content}</p>
                    <small>{new Date(ann.created_at).toLocaleString()}</small>
                </div>
            ))}
            {announcements.length === 0 && <p>No new updates for this event.</p>}
        </div>
    );
};

export default AnnouncementsList;