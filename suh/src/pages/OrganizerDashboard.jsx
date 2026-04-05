import { useState, useEffect } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  PlusCircle, 
  ScanLine, 
  LayoutDashboard, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Users, 
  User, 
  LogOut,
  Terminal,
  Megaphone // Added for a nice announcement icon
} from 'lucide-react';
import styles from './OrganizerDashboard.module.css';
import CreateAnnouncement from '../components/CreateAnnouncement'; 

export default function OrganizerDashboard() {
  // 1. COMPONENT STATE
  const [activeTab, setActiveTab] = useState('scan'); 
  const [events, setEvents] = useState([]);
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    event_date: '', 
    capacity: '',
    is_team_event: 0, 
    min_team_size: 1, 
    max_team_size: 1 
  });
  
  const [scanToken, setScanToken] = useState('');
  const [scanMessage, setScanMessage] = useState(null);
  const [isScanError, setIsScanError] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // 2. CULTRA BOOT SEQUENCE
  useEffect(() => {
    const logs = [
      "Initializing Cultra.Studio...",
      "Syncing secure handshake with smart_events...",
      "Verifying user authorization layer...",
      "Loading high-fidelity experience modules...",
      "System Ready. Welcome to Cultra."
    ];
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setBootLogs(prev => [...prev, logs[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await axios.get('/api/organizer/all-events', authConfig);
      setEvents(res.data);
    } catch (error) { 
      console.error("Fetch Error:", error); 
    }
  };

  useEffect(() => { fetchMyEvents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        is_team_event: parseInt(formData.is_team_event),
        min_team_size: parseInt(formData.min_team_size),
        max_team_size: parseInt(formData.max_team_size),
        capacity: parseInt(formData.capacity)
      };

      await axios.post('/api/organizer/events', submissionData, authConfig);
      alert('Experience architecture submitted for Admin approval!');
      
      setFormData({ 
        title: '', description: '', event_date: '', capacity: '', 
        is_team_event: 0, min_team_size: 1, max_team_size: 1 
      });
      fetchMyEvents();
      setActiveTab('manage');
    } catch (error) { 
      alert(error.response?.data?.error || 'Failed to submit proposal.'); 
    }
  };

  const processCheckIn = async (tokenString) => {
    setScanMessage(null);
    if (!tokenString) return;
    try {
      const res = await axios.post('/api/organizer/checkin', { qr_token: tokenString }, authConfig);
      setScanMessage(res.data.message);
      setIsScanError(false);
      setIsCameraOpen(false);
    } catch (error) {
      setScanMessage(error.response?.data?.message || 'Error processing ticket.');
      setIsScanError(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (isBooting) {
    return (
      <div className={styles.bootScreen}>
        <div className={styles.bootTerminal}>
          <div className={styles.bootHeader}>
            <Terminal size={20} color="var(--accent-color)" />
            <span>CULTRA.BOOT v3.1</span>
          </div>
          <div className={styles.bootLogContainer}>
            {bootLogs.map((log, i) => (
              <p key={i} className={styles.bootLogText}> {log}</p>
            ))}
          </div>
          <div className={styles.bootProgress}>
            <div className={styles.bootProgressBar}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.masterContainer}>
      <div className={styles.ambientOrb1}></div>
      <div className={styles.ambientOrb2}></div>

      <nav className={styles.navbar}>
        <div className={styles.brand}><Sparkles size={28} /> Cultra Studio.</div>
        <div className={styles.navCenter}>
          <button className={`${styles.navBtn} ${activeTab === 'scan' ? styles.activeTab : ''}`} onClick={() => setActiveTab('scan')}>
            <ScanLine size={18} /> Access
          </button>
          <button className={`${styles.navBtn} ${activeTab === 'create' ? styles.activeTab : ''}`} onClick={() => setActiveTab('create')}>
            <PlusCircle size={18} /> Architect
          </button>
          <button className={`${styles.navBtn} ${activeTab === 'manage' ? styles.activeTab : ''}`} onClick={() => setActiveTab('manage')}>
            <LayoutDashboard size={18} /> Oversight
          </button>
        </div>
        <button onClick={handleLogout} className={styles.navBtn} style={{ border: '1px solid var(--text-primary)' }}>
          <LogOut size={18} /> Leave
        </button>
      </nav>

      <header className={styles.heroSection}>
        <h1 className={styles.greeting}>Studio, {user?.name?.split(' ')[0]}.</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage event lifecycles and verify participant credentials.</p>
      </header>

      <main className={styles.contentArea} style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {activeTab === 'scan' && (
          <div className={styles.card} style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '1.5rem' }}>Credential Verification</h2>
            
            {!isCameraOpen ? (
              <button onClick={() => setIsCameraOpen(true)} className={styles.submitBtn} style={{ background: 'var(--text-primary)', marginBottom: '2rem' }}>
                <Camera size={20} /> Activate Lens
              </button>
            ) : (
              <div className={styles.scannerBox} style={{ borderRadius: '24px', overflow: 'hidden', border: '4px solid var(--accent-color)' }}>
                <Scanner onScan={(result) => { if (result && result.length > 0) processCheckIn(result[0].rawValue); }} />
                <button onClick={() => setIsCameraOpen(false)} className={styles.submitBtn} style={{ borderRadius: '0', background: 'var(--accent-color)' }}>Deactivate Lens</button>
              </div>
            )}

            <div style={{ margin: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>— Manual Verification —</div>

            <form onSubmit={(e) => { e.preventDefault(); processCheckIn(scanToken.trim()); setScanToken(''); }} style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" className={styles.input} placeholder="Input unique token..." value={scanToken} onChange={(e) => setScanToken(e.target.value)} />
              <button type="submit" className={styles.submitBtn} style={{ width: 'auto', padding: '0 2rem' }}>Verify</button>
            </form>

            {scanMessage && (
              <div className={`${styles.scanResult} ${isScanError ? styles.scanError : styles.scanSuccess}`} style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: isScanError ? '#FEE2E2' : '#D1FAE5', color: isScanError ? '#991B1B' : '#065F46' }}>
                {isScanError ? '⚠️ ' : '✅ '}{scanMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className={styles.card}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', marginBottom: '2rem' }}>Propose Experience</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Experience Title</label>
                <input type="text" className={styles.input} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Build-A-Thon 2026" />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Abstract / Description</label>
                <textarea className={styles.textarea} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required placeholder="Describe the mission..." />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label className={styles.label}>Participation Model</label>
                  <select 
                    className={styles.input} 
                    value={formData.is_team_event} 
                    onChange={(e) => setFormData({...formData, is_team_event: e.target.value})}
                  >
                    <option value={0}>Solo Performance</option>
                    <option value={1}>Team Collaboration</option>
                  </select>
                </div>

                {Number(formData.is_team_event) === 1 && (
                  <div style={{ flex: 2, display: 'flex', gap: '1rem', minWidth: '250px' }}>
                    <div style={{ flex: 1 }}>
                      <label className={styles.label}>Min Members</label>
                      <input type="number" min="2" className={styles.input} value={formData.min_team_size} onChange={(e) => setFormData({...formData, min_team_size: e.target.value})} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className={styles.label}>Max Members</label>
                      <input type="number" min={formData.min_team_size} className={styles.input} value={formData.max_team_size} onChange={(e) => setFormData({...formData, max_team_size: e.target.value})} required />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Scheduled Date</label>
                  <input type="datetime-local" className={styles.input} value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Total Headcount</label>
                  <input type="number" className={styles.input} value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} required placeholder="e.g. 150" />
                </div>
              </div>
              
              <button type="submit" className={styles.submitBtn}><PlusCircle size={20} /> Submit Proposal</button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className={styles.grid}>
            {events.map(event => (
              <div key={event.id} className={styles.card} style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", margin: 0 }}>{event.title}</h3>
                  {event.is_team_event ? <Users size={20} color="var(--accent-color)" /> : <User size={20} color="var(--text-secondary)" />}
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {new Date(event.event_date).toLocaleString()} <br />
                  Model: {event.is_team_event ? `Team (${event.min_team_size}-${event.max_team_size})` : 'Individual'}
                </p>

                <div className={`${styles.badge} ${event.status === 'pending' ? styles.badgePending : event.status === 'approved' ? styles.badgeApproved : styles.badgeRejected}`} style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                  {event.status === 'pending' ? <Clock size={14} /> : <CheckCircle size={14} />}
                  {event.status.toUpperCase()}
                </div>

                {/* --- UPDATE: ANNOUNCEMENT SECTION --- */}
                {event.status === 'approved' && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                       <Megaphone size={18} />
                       <span style={{ fontWeight: 'bold' }}>Push Update</span>
                    </div>
                    <CreateAnnouncement eventId={event.id} />
                  </div>
                )}
                {/* --- END UPDATE --- */}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}