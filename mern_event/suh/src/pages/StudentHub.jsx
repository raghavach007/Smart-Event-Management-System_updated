import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Search, Calendar, Ticket, Shield, Sparkles, Bell, X, 
  Share2, LogOut, Terminal, Check, Trash2 
} from 'lucide-react';
import styles from './StudentHub.module.css';

export default function StudentHub() {
  const [activeTab, setActiveTab] = useState('discover');
  const [allEvents, setAllEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // 1. UNIFIED HUB SYNC
  const fetchHubData = useCallback(async () => {
    try {
      const eventsRes = await axios.get('/api/events');
      setAllEvents(eventsRes.data || []);

      if (token) {
        try {
          const [ticketsRes, requestsRes] = await Promise.all([
            axios.get('/api/student/tickets', authConfig),
            axios.get('/api/student/team-requests', authConfig)
          ]);
          setMyTickets(ticketsRes.data || []);
          setTeamRequests(requestsRes.data || []);
        } catch (innerErr) {
          console.error("Personal Data Sync Delayed:", innerErr.message);
        }
      }
    } catch (err) {
      console.error("Master Hub Sync Error:", err);
    } finally {
      setTimeout(() => setIsBooting(false), 500);
    }
  }, [token]);

  // 2. CINEMATIC BOOT
  useEffect(() => {
    const logs = [
      "Initializing Cultra.Client...",
      "Handshaking with smart_events database...",
      "Syncing Experience Manifest...",
      `${user?.name?.split(' ')[0] || 'Member'}.Profile Verified.`,
      "Cultra Core Online."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < logs.length) setBootLogs(prev => [...prev, logs[idx++]]);
      else clearInterval(interval);
    }, 350);
    fetchHubData();
    return () => clearInterval(interval);
  }, [fetchHubData, user?.name]);

  // 3. ACTIONS
  const handleRegister = async (event) => {
    try {
      let teamName = null;
      if (event.is_team_event) {
        teamName = prompt("Experience Architect: Name your new Team (you will be the leader):");
        if (!teamName) return;
      }
      await axios.post(`/api/student/events/${event.id}/register`, { teamName }, authConfig);
      await fetchHubData(); 
      setActiveTab('tickets');
    } catch (e) { alert(e.response?.data?.message || "Registration sequence failed."); }
  };

  const respondToInvite = async (requestId, status) => {
    try {
      await axios.put(`/api/student/team-requests/${requestId}`, { status }, authConfig);
      await fetchHubData();
    } catch (e) { alert("Action failed."); }
  };

  // NEW FEATURE: Share Event
  const shareEvent = (event) => {
    const message = `Hey! I just claimed my ticket for ${event.title} on Cultra! 🚀 Let's go together. Details: ${event.description}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // NEW FEATURE: Image Posters
  const getPosterUrl = (eventId) => `https://picsum.photos/seed/${eventId * 42}/600/300`;

  // 4. FILTERING
  const ticketIds = useMemo(() => new Set(myTickets.map(t => Number(t.event_id || t.id))), [myTickets]);
  
  const discoverEvents = allEvents.filter(e => 
    !ticketIds.has(Number(e.id)) && 
    (e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const upcoming = myTickets.filter(t => Number(t.checked_in) === 0);
  const vault = myTickets.filter(t => Number(t.checked_in) === 1);

  if (isBooting) return (
    <div className={styles.bootScreen}>
      <div className={styles.bootTerminal}>
        <div className={styles.bootHeader}><Terminal size={20} color="var(--accent-color)" /><span>CULTRA_CORE v4.9</span></div>
        {bootLogs.map((log, i) => <p key={i} className={styles.bootLogText}> {log}</p>)}
        <div className={styles.bootProgress}><div className={styles.bootProgressBar}></div></div>
      </div>
    </div>
  );

  return (
    <div className={styles.masterContainer}>
      <div className={styles.ambientOrb1} /><div className={styles.ambientOrb2} />

      <nav className={styles.navbar}>
        <div className={styles.brand}><Sparkles size={28} /> Cultra.</div>
        <div className={styles.navCenter}>
          <button className={`${styles.navBtn} ${activeTab === 'discover' ? styles.activeTab : ''}`} onClick={() => setActiveTab('discover')}><Calendar size={18} /> Discover</button>
          <button className={`${styles.navBtn} ${activeTab === 'tickets' ? styles.activeTab : ''}`} onClick={() => setActiveTab('tickets')}><Ticket size={18} /> Wallet</button>
          <button className={`${styles.navBtn} ${activeTab === 'vault' ? styles.activeTab : ''}`} onClick={() => setActiveTab('vault')}><Shield size={18} /> Vault</button>
        </div>
        <div className={styles.navRight}>
          <div className={styles.bellWrapper} onClick={() => setShowNotifications(true)}>
            <Bell size={24} color="var(--text-primary)" />
            {teamRequests.length > 0 && <div className={styles.notificationDot} />}
          </div>
          <button onClick={() => {localStorage.clear(); window.location.href='/';}} className={styles.navBtn} style={{ border: '1px solid var(--text-primary)' }}><LogOut size={18} /> Leave</button>
        </div>
      </nav>

      {showNotifications && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setShowNotifications(false)} />
          <div className={styles.drawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Intel Feed</h2><X onClick={() => setShowNotifications(false)} style={{ cursor: 'pointer' }} />
            </div>
            {teamRequests.length === 0 ? <p>No active recruitment pings.</p> : teamRequests.map(req => (
              <div key={req.id} className={styles.notificationCard}>
                <p><strong>{req.sender_name}</strong> invited you to join <strong>{req.team_name}</strong> for {req.event_title}.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => respondToInvite(req.id, 'accepted')} className={styles.registerBtn} style={{ background: '#065F46', padding: '0.5rem' }}><Check size={14}/> Join</button>
                  <button onClick={() => respondToInvite(req.id, 'rejected')} className={styles.registerBtn} style={{ background: '#991B1B', padding: '0.5rem' }}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <main className={styles.contentArea}>
        <h1 className={styles.greeting}>Hub, {user?.name?.split(' ')[0] || 'Member'}.</h1>

        {activeTab === 'discover' && (
          <>
            <div className={styles.searchWrapper}>
              <div className={styles.searchBar}>
                <Search size={20} color="var(--text-secondary)" /><input type="text" placeholder="Search experiences..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className={styles.grid}>
              {discoverEvents.map((event, i) => (
                <div key={event.id} className={styles.card} style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* NEW FEATURE: Card Images */}
                  <div className={styles.cardImageWrapper}>
                    <img src={getPosterUrl(event.id)} className={styles.cardImage} alt="Event" />
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.eventDesc}>{event.description}</p>
                    <div style={{ marginBottom: '1rem' }}>
                      <span className={styles.badge} style={{ background: 'var(--peach)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '5px', fontSize: '0.8rem' }}>
                        {event.is_team_event ? `👥 Team (${event.min_team_size}-${event.max_team_size})` : "👤 Solo Performance"}
                      </span>
                    </div>
                    {/* NEW FEATURE: Share Button Layout */}
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto' }}>
                      <button onClick={() => handleRegister(event)} className={styles.registerBtn} style={{ flex: 3 }}>Claim Pass</button>
                      <button onClick={() => shareEvent(event)} className={styles.registerBtn} style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'tickets' && (
          <div className={styles.grid}>
            {upcoming.length === 0 ? <p>Wallet empty. Secure a pass in Discover.</p> : upcoming.map((ticket, i) => (
              <div key={ticket.event_id || ticket.id} className={styles.card} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.cardContent}>
                  <h3 className={styles.eventTitle}>{ticket.title}</h3>
                  {ticket.team_name && <p style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>Team: {ticket.team_name}</p>}
                  
                  {/* NEW FEATURE: Vintage Stub Layout */}
                  <div className={styles.vintageStub}>
                    <div className={styles.cutoutRight}></div>
                    <div className={styles.ticketTop}>
                      <span className={styles.badge} style={{ background: 'var(--peach)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>Official Pass</span>
                    </div>
                    <div className={styles.ticketBottom}>
                      <div className={styles.qrContainer}>
                        <QRCodeCanvas value={ticket.qr_token} size={130} level="H" />
                      </div>
                      <span className={styles.tokenText}>{ticket.qr_token.slice(0, 16)}</span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vault' && (
          <div className={styles.grid}>
            {vault.length === 0 ? <p>Check-in to an event to unlock the Vault.</p> : vault.map((v, i) => (
              <div key={v.event_id || v.id} className={styles.card} style={{ animationDelay: `${i * 0.05}s` }}>
                {/* NEW FEATURE: Sepia Filter Image & Stamp */}
                <div className={styles.cardImageWrapper} style={{ filter: 'sepia(40%) contrast(1.1)' }}>
                  <img src={getPosterUrl(v.event_id || v.id)} className={styles.cardImage} alt="Attended" />
                  <div className={styles.stamp}>VERIFIED</div>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.eventTitle}>{v.title}</h3>
                  <p>Completed on {new Date(v.registration_time || v.event_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}