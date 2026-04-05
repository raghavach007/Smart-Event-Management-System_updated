import React, { useState } from 'react';
import axios from 'axios';

const CreateAnnouncement = ({ eventId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' }); // Improved message handling
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Validation check
        if (!eventId) {
            setStatus({ type: 'error', msg: 'No Event ID selected.' });
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token'); 

        try {
            // 2. API Call matching your organizerRoutes.js
            const response = await axios.post('http://localhost:5000/api/organizer/announce', 
                { 
                    event_id: eventId, 
                    title: title, 
                    content: content 
                },
                { 
                    headers: { Authorization: `Bearer ${token}` } 
                }
            );

            // 3. Success Handling
            setStatus({ type: 'success', msg: response.data.message });
            setTitle('');
            setContent('');
            
            // Clear success message after 3 seconds
            setTimeout(() => setStatus({ type: '', msg: '' }), 3000);

        } catch (err) {
            // 4. Error Handling
            const errorMsg = err.response?.data?.message || "Failed to post announcement.";
            setStatus({ type: 'error', msg: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="announcement-form-container" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>📢 Post Event Update</h3>
            
            {status.msg && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '10px', 
                    borderRadius: '4px',
                    backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: status.type === 'success' ? '#155724' : '#721c24'
                }}>
                    {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Headline (e.g., Venue Change, New Speaker)" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                
                <textarea 
                    placeholder="Details about the update..." 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    required 
                    rows="4"
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        padding: '10px', 
                        backgroundColor: loading ? '#ccc' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Posting...' : 'Post Announcement'}
                </button>
            </form>
        </div>
    );
};

export default CreateAnnouncement;