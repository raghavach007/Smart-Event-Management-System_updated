import React from 'react';
import { useParams } from 'react-router-dom';
import CreateAnnouncement from '../components/CreateAnnouncement'; 
// Assuming you saved the form in a components folder

const EventDetails = () => {
    // 1. Grab the ID from the URL (e.g., /event/5)
    const { id } = useParams(); 

    return (
        <div style={{ padding: '20px' }}>
            <h1>Manage Event #{id}</h1>
            <p>Use the form below to send updates to students registered for this event.</p>
            
            <hr style={{ margin: '20px 0' }} />

            {/* 2. Pass the ID into your announcement component */}
            <CreateAnnouncement eventId={id} />
        </div>
    );
};

export default EventDetails;