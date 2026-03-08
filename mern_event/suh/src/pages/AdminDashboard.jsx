import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Users, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  Activity, 
  LogOut,
  Layers,
  Terminal,
  Database
} from 'lucide-react';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('oversight'); 
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState({ stats: {}, participation: [] });
  const [loading, setLoading] = useState(true);

  // Atomic Club Forge State
  const [clubForm, setClubForm] = useState({
    name: '', description: '', organizerName: '', organizerEmail: '', organizerPassword: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // 1. CULTRA BOOT SEQUENCE
  useEffect(() => {
    const logs = [
      "Initializing Cultra.Core system...",
      "Syncing with smart_events database...",
      "Verifying Admin cryptographic keys...",
      "Loading high-fidelity UI modules...",
      "Access Granted. System fully operational."
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
    }, 450);

    fetchData();
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, analyticsRes] = await Promise.all([
        axios.get('/api/admin/events', authConfig),
        axios.get('/api/admin/analytics', authConfig)
      ]);
      setEvents(eventsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Admin Core Sync Error:", error);
    }
  };

  const handleStatusUpdate = async (eventId, status) => {
    try {
      await axios.put(`/api/admin/events/${eventId}/status`, { status }, authConfig);
      fetchData();
    } catch (error) {
      alert("Status update failed.");
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/clubs', clubForm, authConfig);
      alert('Organization successfully forged in the Core.');
      setClubForm({ name: '', description: '', organizerName: '', organizerEmail: '', organizerPassword: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Forge process interrupted.');
    }
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
        <div className={styles.brand}><ShieldCheck size={28} /> Admin Oversight.</div>
        <div className={styles.navCenter}>
          <button className={`${styles.navBtn} ${activeTab === 'oversight' ? styles.activeTab : ''}`} onClick={() => setActiveTab('oversight')}>
            <Clock size={18} /> Queue
          </button>
          <button className={`${styles.navBtn} ${activeTab === 'analytics' ? styles.activeTab : ''}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={18} /> Intel
          </button>
          <button className={`${styles.navBtn} ${activeTab === 'forge' ? styles.activeTab : ''}`} onClick={() => setActiveTab('forge')}>
            <Layers size={18} /> Forge
          </button>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className={styles.navBtn} style={{ border: '1px solid var(--text-primary)' }}>
          <LogOut size={18} /> Leave
        </button>
      </nav>

      <header className={styles.heroSection}>
        <h1 className={styles.greeting}>Admin, {user?.name?.split(' ')[0]}.</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Strategic oversight of the Cultra.Core ecosystem.</p>
      </header>

      <main className={styles.contentArea}>
        
        {activeTab === 'oversight' && (
          <div className={styles.grid}>
            {events.length === 0 ? <p className={styles.emptyMsg}>Queue cleared. No pending actions.</p> : null}
            {events.map((event, i) => (
              <div key={event.id} className={styles.card} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  <div className={`${styles.badge} ${event.status === 'pending' ? styles.badgePending : styles.badgeApproved}`}>
                    {event.status.toUpperCase()}
                  </div>
                </div>
                
                <div className={styles.cardInfo}>
                  <p><strong>Source:</strong> {event.club_name}</p>
                  <p><strong>Timeline:</strong> {new Date(event.event_date).toLocaleString()}</p>
                </div>

                {/* Team Constraints Visibility */}
                <div className={styles.teamConstraintBox}>
                  {event.is_team_event ? (
                    <span className={styles.teamInfo}>👥 Team Model: {event.min_team_size} - {event.max_team_size} members</span>
                  ) : (
                    <span className={styles.soloInfo}>👤 Individual Model</span>
                  )}
                </div>

                {event.status === 'pending' && (
                  <div className={styles.actionButtons}>
                    <button onClick={() => handleStatusUpdate(event.id, 'approved')} className={styles.approveBtn}>
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(event.id, 'rejected')} className={styles.rejectBtn}>
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ animationDelay: '0s' }}>
                <Users size={32} color="var(--accent-color)" />
                <h4>Student Pop.</h4>
                <h2>{analytics.stats?.students || 0}</h2>
              </div>
              <div className={styles.statCard} style={{ animationDelay: '0.1s' }}>
                <Sparkles size={32} color="var(--accent-color)" />
                <h4>Live Experience</h4>
                <h2>{analytics.stats?.events || 0}</h2>
              </div>
              <div className={styles.statCard} style={{ animationDelay: '0.2s' }}>
                <Activity size={32} color="var(--accent-color)" />
                <h4>Verification Check</h4>
                <h2>{analytics.stats?.attendance || 0}</h2>
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: '3rem', overflowX: 'auto' }}>
              <h3 className={styles.tableTitle}>Participation Intel</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Experience</th>
                    <th>Audit</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.participation.map((p, i) => (
                    <tr key={i}>
                      <td>{p.student}</td>
                      <td>{p.event}</td>
                      <td><span className={p.checked_in ? styles.tableBadgeIn : styles.tableBadgeOut}>{p.checked_in ? 'Verified' : 'Waitlist'}</span></td>
                      <td>{new Date(p.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'forge' && (
          <div className={styles.forgeWrapper}>
            <div className={styles.card}>
              <h2 className={styles.forgeHeader}>Forge Organization</h2>
              <form onSubmit={handleCreateClub}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Identity Name</label>
                  <input type="text" className={styles.input} value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} required placeholder="e.g. Sreenidhi Cultra" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Organizational Mission</label>
                  <textarea className={styles.textarea} value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} required />
                </div>
                
                <div className={styles.securitySection}>
                  <h4 className={styles.securityHeader}>🔐 Primary Security Credentials</h4>
                  <div className={styles.formGroup}>
                    <input type="text" className={styles.input} placeholder="Full Legal Name" value={clubForm.organizerName} onChange={(e) => setClubForm({...clubForm, organizerName: e.target.value})} required />
                  </div>
                  <div className={styles.inputRow}>
                    <input type="email" className={styles.input} placeholder="Institutional Email" value={clubForm.organizerEmail} onChange={(e) => setClubForm({...clubForm, organizerEmail: e.target.value})} required />
                    <input type="password" className={styles.input} placeholder="Access Password" value={clubForm.organizerPassword} onChange={(e) => setClubForm({...clubForm, organizerPassword: e.target.value})} required />
                  </div>
                </div>
                
                <button type="submit" className={styles.submitBtn}>Forge Organization & Account</button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}