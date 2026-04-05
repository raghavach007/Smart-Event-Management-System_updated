// File: suh/src/App.jsx

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentHub from './pages/StudentHub';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventDetails from './pages/EventDetails';

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Session corrupted");
        localStorage.clear();
      }
    }
    setIsInitializing(false); 
  }, []);

  if (isInitializing) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: '#EBE5D9', fontFamily: 'serif' 
      }}>
        <h2 style={{ letterSpacing: '2px' }}>Syncing Cultra...</h2>
      </div>
    );
  }

  const currentRole = user?.role;

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Routes */}
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        
        {/* 2. Event Details (Accessible to logged-in users) */}
        <Route 
          path="/event/:id" 
          element={user ? <EventDetails /> : <Navigate to="/" />} 
        />

        {/* 3. Student Routes */}
        <Route path="/events" element={
          currentRole === 'student' || currentRole === 'admin' 
            ? <StudentHub /> : <Navigate to="/" /> 
        } />
        
        {/* 4. Organizer Routes */}
        <Route path="/organizer" element={
          currentRole === 'organizer' || currentRole === 'admin' 
            ? <OrganizerDashboard /> : <Navigate to="/" />
        } />
        
        {/* 5. Admin Routes */}
        <Route path="/admin" element={
          currentRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
        } />
        
        {/* 6. Catch-all: Redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}