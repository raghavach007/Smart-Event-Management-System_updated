import React, { useState } from 'react';
import { Sparkles, Calendar, Ticket, Shield, Bell, LogOut } from 'lucide-react';
import styles from '../pages/StudentHub.module.css';
import IntelFeed from './IntelFeed';

const Navbar = ({ activeTab, setActiveTab }) => {
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.brand}><Sparkles size={28} /> Cultra.</div>
        
        <div className={styles.navCenter}>
          <button 
            className={`${styles.navBtn} ${activeTab === 'discover' ? styles.activeTab : ''}`} 
            onClick={() => setActiveTab('discover')}
          >
            <Calendar size={18} /> Discover
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'tickets' ? styles.activeTab : ''}`} 
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={18} /> Wallet
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'vault' ? styles.activeTab : ''}`} 
            onClick={() => setActiveTab('vault')}
          >
            <Shield size={18} /> Vault
          </button>
        </div>

        <div className={styles.navRight}>
          <div 
            className={styles.bellWrapper} 
            onClick={() => {
              setIsIntelOpen(true);
              setHasUpdates(false); // Clear the red dot once clicked
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <Bell size={24} color="var(--text-primary)" />
            
            {/* Bonus UX: The Red Dot Badge */}
            {hasUpdates && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                backgroundColor: '#ff4d4d',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            )}
          </div>

          <button 
            onClick={() => { localStorage.clear(); window.location.href='/'; }} 
            className={styles.navBtn} 
            style={{ border: '1px solid var(--text-primary)', marginLeft: '15px' }}
          >
            <LogOut size={18} /> Leave
          </button>
        </div>
      </nav>

      {/* The side panel drawer */}
      <IntelFeed 
        isOpen={isIntelOpen} 
        onClose={() => setIsIntelOpen(false)} 
        onDataReceived={(hasData) => setHasUpdates(hasData)}
      />
    </>
  );
};

export default Navbar;