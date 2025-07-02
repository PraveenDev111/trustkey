import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL, ADMIN_ADDRESS } from '../config';
import '../styles/AdminDashboard.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';

// Log Stats Section Component (mock data)
const LogStatsSection = () => {
  // Performance logs mock
  const perfRequestsPerMin = [
    { time: '10:00', count: 120 }, { time: '10:01', count: 130 }, { time: '10:02', count: 110 }, { time: '10:03', count: 140 }, { time: '10:04', count: 90 }
  ];
  const perfTopEndpoints = [
    { endpoint: '/api/auth/login', count: 200 },
    { endpoint: '/api/certificates', count: 150 },
    { endpoint: '/api/auth/user', count: 120 },
    { endpoint: '/api/admin/logs', count: 80 }
  ];

  // Auth logs mock
  const authAttemptsOverTime = [
    { time: '10:00', success: 20, fail: 5 },
    { time: '10:05', success: 24, fail: 2 },
    { time: '10:10', success: 18, fail: 7 },
    { time: '10:15', success: 30, fail: 1 },
    { time: '10:20', success: 25, fail: 3 }
  ];
  const authOutcomePie = [
    { name: 'Success', value: 117 },
    { name: 'Failure', value: 18 },
    { name: 'Locked Out', value: 3 }
  ];

  return (
    <div style={{padding:'2rem', maxHeight:'80vh', overflowY:'auto'}}>
      <h1 style={{fontWeight:700, fontSize:'2rem', marginBottom:'2rem', letterSpacing:'-1px', color:'#222'}}>Log Stats</h1>
      <div style={{display:'flex', gap:'2.5rem', flexWrap:'wrap', marginBottom:'2.5rem'}}>
        {/* Performance Log Charts */}
        <div style={{flex:1, minWidth:340, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Requests Per Minute</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={perfRequestsPerMin} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={3} dot={{r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1, minWidth:340, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Top Endpoints</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={perfTopEndpoints} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="endpoint" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'flex', gap:'2.5rem', flexWrap:'wrap'}}>
        {/* Auth Log Charts */}
        <div style={{flex:1, minWidth:340, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Login Attempts Over Time</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={authAttemptsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="success" stackId="1" stroke="#4caf50" fill="#c8e6c9" name="Success" />
              <Area type="monotone" dataKey="fail" stackId="1" stroke="#f44336" fill="#ffcdd2" name="Failure" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1, minWidth:340, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Login Outcome Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={authOutcomePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {authOutcomePie.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Overview Section Component
const COLORS = ['#4caf50', '#f44336', '#9e9e9e'];
const OverviewSection = ({ users, certificates, publicKeys, userStats }) => {
  // Calculate summary numbers
  const totalUsers = users.length;
  const activeCerts = certificates.filter(c => c && !c.isRevoked).length;
  const revokedCerts = certificates.filter(c => c && c.isRevoked).length;
  const totalCerts = certificates.filter(c => c).length;
  const totalKeys = publicKeys.length;

  // Pie chart data
  const certPieData = [
    { name: 'Issued', value: activeCerts },
    { name: 'Revoked', value: revokedCerts },
    { name: 'Not Issued', value: totalUsers - totalCerts }
  ];

  // Line chart data (recent registrations, mock for now)
  const regLineData = userStats && userStats.recentRegistrations
    ? userStats.recentRegistrations
    : [
      { date: '2025-06-25', count: 2 },
      { date: '2025-06-26', count: 4 },
      { date: '2025-06-27', count: 3 },
      { date: '2025-06-28', count: 5 },
      { date: '2025-06-29', count: 1 },
      { date: '2025-06-30', count: 6 },
      { date: '2025-07-01', count: 2 },
    ];

  return (
    <div className="overview-section" style={{padding:'5px', maxHeight:'80vh', overflowY:'auto'}}>
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        padding: '2px',
        flexWrap: 'wrap',
        overflowX: 'none',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        minWidth: 0
      }}>
        <div className="overview-card" style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem', minWidth:220, flex:1}}>
          <div style={{fontSize:'1.1rem', color:'#888'}}>Total Users</div>
          <div style={{fontSize:'2.5rem', fontWeight:700, color:'#1976d2'}}>{totalUsers}</div>
        </div>
        <div className="overview-card" style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem', minWidth:220, flex:1}}>
          <div style={{fontSize:'1.1rem', color:'#888'}}>Active Certificates</div>
          <div style={{fontSize:'2.5rem', fontWeight:700, color:'#4caf50'}}>{activeCerts}</div>
        </div>
        <div className="overview-card" style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem', minWidth:220, flex:1}}>
          <div style={{fontSize:'1.1rem', color:'#888'}}>Revoked Certificates</div>
          <div style={{fontSize:'2.5rem', fontWeight:700, color:'#f44336'}}>{revokedCerts}</div>
        </div>
        <div className="overview-card" style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem', minWidth:220, flex:1}}>
          <div style={{fontSize:'1.1rem', color:'#888'}}>Total Public Keys</div>
          <div style={{fontSize:'2.5rem', fontWeight:700, color:'#222'}}>{totalKeys}</div>
        </div>
      </div>
      <div style={{display:'flex', gap:'2.5rem', flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:320, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Certificate Status Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={certPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {certPieData.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:2, minWidth:400, background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #e0e0e0', padding:'2rem'}}>
          <div style={{fontWeight:600, marginBottom:'1.2rem', color:'#444'}}>Recent User Registrations</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={regLineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [showUsersMenu, setShowUsersMenu] = useState(false);
  const [showLogsMenu, setShowLogsMenu] = useState(false);

  // Helper: Export users as CSV
  const exportUsersCSV = () => {
    if (!users || users.length === 0) {
      toast.info('No users to export');
      return;
    }
    const header = ['Address','Username','Email','Public Key','Registered'];
    const rows = users.map(u => [
      u.address,
      u.username || '',
      u.email || '',
      u.publicKey || '',
      u.isRegistered ? 'Yes' : 'No'
    ]);
    const csv = [header, ...rows].map(r => r.map(x => '"' + (x||'').replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Helper: Export logs as CSV
  const exportLogsCSV = () => {
    if (!logFiles || logFiles.length === 0) {
      toast.info('No logs to export');
      return;
    }
    const header = ['File Name','Size (bytes)','Last Modified'];
    const rows = logFiles.map(l => [
      l.name,
      l.size,
      l.modified ? new Date(l.modified).toLocaleString() : ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x => '"' + (x||'').replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Hide dropdowns on click outside
  useEffect(() => {
    if (!showUsersMenu && !showLogsMenu) return;
    const handler = () => {
      setShowUsersMenu(false);
      setShowLogsMenu(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [showUsersMenu, showLogsMenu]);
  const [activeTab, setActiveTab] = useState('logs');
  const [logFiles, setLogFiles] = useState([]);
  const [logContent, setLogContent] = useState(null);
  const [currentFile, setCurrentFile] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [overviewCertificates, setOverviewCertificates] = useState([]); // for overview
  const [overviewPublicKeys, setOverviewPublicKeys] = useState([]); // for overview
  const [overviewUserStats, setOverviewUserStats] = useState(null); // for overview
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userCertificate, setUserCertificate] = useState(null);
  const [userKeys, setUserKeys] = useState([]);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user is admin
    const userAddress = localStorage.getItem('userAddress');
    if (userAddress?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      toast.error('Unauthorized: Admin access required');
      navigate('/dashboard');
      return;
    }
    
    fetchLogFiles();
    fetchSystemStats();
    fetchUsers();
    fetchOverviewData();
  }, [navigate]);

  const fetchLogFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch log files');
      
      const data = await response.json();
      setLogFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching log files:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogContent = async (filename) => {
    try {
      setIsLoading(true);
      setCurrentFile(filename);
      const response = await fetch(`${API_BASE_URL}/admin/logs/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch log content');
      
      const data = await response.json();
      setLogContent(data);
    } catch (error) {
      console.error('Error fetching log content:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setSelectedUser(null);
    setUserDetails(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDetails = async (address) => {
    setUserDetails(null);
    setUserCertificate(null);
    setUserKeys([]);
    setUserDetailsLoading(true);
    setUserDetailsError('');
    try {
      // Fetch user profile
      const userRes = await fetch(`${API_BASE_URL}/auth/user/${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!userRes.ok) throw new Error('Failed to fetch user details');
      const userData = await userRes.json();
      setUserDetails(userData.user || userData);

      // Fetch certificate info
      const certRes = await fetch(`${API_BASE_URL}/certificates/${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (certRes.ok) {
        const certData = await certRes.json();
        if (certData.success && certData.hasCertificate && certData.data) {
          setUserCertificate(certData.data);
        } else {
          setUserCertificate(null);
        }
      } else {
        setUserCertificate(null);
      }

      // Fetch all public keys
      const keysRes = await fetch(`${API_BASE_URL}/certificates/keys/${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        if (keysData.success && Array.isArray(keysData.publicKeys)) {
          setUserKeys(keysData.publicKeys);
        } else {
          setUserKeys([]);
        }
      } else {
        setUserKeys([]);
      }
    } catch (error) {
      setUserDetailsError(error.message || 'Failed to fetch user details');
      setUserDetails(null);
      setUserCertificate(null);
      setUserKeys([]);
      toast.error(error.message || 'Failed to fetch user details/certificate/keys');
    } finally {
      setUserDetailsLoading(false);
    }
  };


  // Fetch all data needed for overview section
  const fetchOverviewData = async () => {
    try {
      // Users
      const usersRes = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const usersData = usersRes.ok ? await usersRes.json() : [];
      setUsers(usersData);

      // Certificates (for all users)
      const certs = await Promise.all(
        (usersData || []).map(async (u) => {
          try {
            const res = await fetch(`${API_BASE_URL}/certificates/${u.address}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data && data.success && data.hasCertificate && data.data ? data.data : null;
          } catch {
            return null;
          }
        })
      );
      setOverviewCertificates(certs);

      // All public keys (flattened)
      let allKeys = [];
      for (const u of usersData || []) {
        try {
          const res = await fetch(`${API_BASE_URL}/certificates/keys/${u.address}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (data && data.success && Array.isArray(data.publicKeys)) {
            allKeys = allKeys.concat(data.publicKeys);
          }
        } catch {}
      }
      setOverviewPublicKeys(allKeys);

      // User stats (recent registrations, etc.)
      // This is a placeholder; you can enhance it to fetch from backend if available
      setOverviewUserStats(null);
    } catch (err) {
      // fail silently for overview
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system stats');
      
      const data = await response.json();
      setSystemStats(data.stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderLogContent = () => {
    if (!logContent) return <div className="no-content">Select a log file to view its content</div>;
    
    if (isLoading) return <div className="loading">Loading...</div>;
    
    if (logContent.isJson) {
      return (
        <div className="json-viewer">
          <pre>{JSON.stringify(logContent.content, null, 2)}</pre>
        </div>
      );
    }
    
    return (
      <div className="log-content">
        <pre>{logContent.content}</pre>
      </div>
    );
  };

  const renderSystemStats = () => {
    if (!systemStats) return <div className="loading">Loading system stats...</div>;
    
    return (
      <div className="system-stats">
        <div className="stat-card">
          <h3>Node.js Version</h3>
          <p>{systemStats.nodeVersion}</p>
        </div>
        <div className="stat-card">
          <h3>Platform</h3>
          <p>{systemStats.platform}</p>
        </div>
        <div className="stat-card">
          <h3>Environment</h3>
          <p>{systemStats.env}</p>
        </div>
        <div className="stat-card">
          <h3>Uptime</h3>
          <p>{Math.floor(systemStats.uptime / 60)} minutes</p>
        </div>
        <div className="stat-card">
          <h3>Memory Usage</h3>
          <p>RSS: {formatBytes(systemStats.memoryUsage.rss)}</p>
          <p>Heap Total: {formatBytes(systemStats.memoryUsage.heapTotal)}</p>
          <p>Heap Used: {formatBytes(systemStats.memoryUsage.heapUsed)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button 
          className="btn btn-logout"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userAddress');
            navigate('/');
          }}
        >
          Logout
        </button>
      </header>
      
      <div className="admin-container">
        <nav className="admin-sidebar">
          <button 
            className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'logstats' ? 'active' : ''}`}
            onClick={() => setActiveTab('logstats')}
          >
            Log Stats
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            System Stats
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </nav>
        
        <main className="admin-main" style={{overflow:'hidden', height:'100%'}}>
          {activeTab === 'overview' ? (
            <OverviewSection
              users={users}
              certificates={overviewCertificates}
              publicKeys={overviewPublicKeys}
              userStats={overviewUserStats}
            />
          ) : activeTab === 'logstats' ? (
            <LogStatsSection />
          ) : activeTab === 'logs' ? (
            <div className="logs-container">
              <div className="log-files">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <h2 style={{margin:0}}>Log Files</h2>
                  <div style={{position:'relative'}}>
                    <button
                      className="three-dots-btn"
                      style={{
                        width: 'fit-content',background:'none', border:'none', cursor:'pointer', fontSize:'1.6em', padding:'0 8px', lineHeight:1, color:'black', borderRadius:'50%'
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setShowLogsMenu(v => !v);
                      }}
                      aria-label="More options"
                    >
                      &#x22EE;
                    </button>
                    {showLogsMenu && (
                      <div
                        style={{
                          position:'absolute', right:0,marginRight:10, top:'110%', background:'#fff', border:'none', borderRadius:6, boxShadow:'0 2px 8px rgba(0,0,0,0.20)', zIndex:2, minWidth:150
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          style={{
                            width:'100%', background:'#fff', color:'black', border:'none', textAlign:'left', padding:'10px 16px', cursor:'pointer', fontSize:'1em'
                          }}
                          onClick={() => {
                            exportLogsCSV();
                            setShowLogsMenu(false);
                          }}
                        >Export all logs</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="file-list">
                  {logFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className={`file-item ${currentFile === file.name ? 'active' : ''}`}
                      onClick={() => fetchLogContent(file.name)}
                    >
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatBytes(file.size)}</span>
                      <span className="file-modified">{formatDate(file.modified)}</span>
                    </div>
                  ))}
                  {logFiles.length === 0 && !isLoading && (
                    <div className="no-files">No log files found</div>
                  )}
                </div>
              </div>
              <div className="log-viewer">
                <h2>{currentFile || 'Select a log file'}</h2>
                {renderLogContent()}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="logs-container">
              <div className="log-files">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <h2 style={{margin:0}}>Users</h2>
                  <div style={{position:'relative'}}>
                    <button
                      className="three-dots-btn"
                      style={{
                        width: 'fit-content',background:'none', border:'none', cursor:'pointer', fontSize:'1.6em', padding:'0 8px', lineHeight:1, color:'black', borderRadius:'50%'
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setShowUsersMenu(v => !v);
                      }}
                      aria-label="More options"
                    >
                      &#x22EE;
                    </button>
                    {showUsersMenu && (
                      <div
                        style={{
                          position:'absolute', right:0,marginRight:10, top:'110%', background:'#fff', border:'none', borderRadius:6, boxShadow:'0 2px 8px rgba(0,0,0,0.20)', zIndex:2, minWidth:150
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          style={{
                            width:'100%', background:'#fff', color:'black', border:'none', textAlign:'left', padding:'10px 16px', cursor:'pointer', fontSize:'1em'
                          }}
                          onClick={() => {
                            exportUsersCSV();
                            setShowUsersMenu(false);
                          }}
                        >Export all users</button>
                      </div>
                    )}
                  </div>
                </div>
                {usersLoading ? (
                  <div className="loading">Loading users...</div>
                ) : users && users.length > 0 ? (
                  <div className="file-list">
                    {users.map((user, idx) => (
                      <div
                        key={user.address}
                        className={`file-item${selectedUser === user.address ? ' active' : ''}`}
                        style={{ cursor: 'pointer', marginBottom: '0.5rem', padding: '0.75rem', borderRadius: '6px', background: selectedUser === user.address ? '#f3f4f6' : 'transparent' }}
                        onClick={() => {
                          setSelectedUser(user.address);
                          fetchUserDetails(user.address);
                        }}
                      >
                        <span className="file-name" style={{ fontWeight: 500 }}>{user.username || 'N/A'}</span>
                        <span className="file-size" style={{ fontSize: '0.85em', color: '#888', marginLeft: 8 }}>{user.email || 'N/A'}</span>
                        <span className="file-modified" style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.85em', color: '#666' }}>{user.address}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">No users found</div>
                )}
              </div>
              <div className="user-details-panel">
                {selectedUser ? (
                  userDetailsLoading ? (
                    <div className="loading">Loading user details...</div>
                  ) : userDetailsError ? (
                    <div className="error-message">{userDetailsError}</div>
                  ) : userDetails ? (
                    <>
                      <h2>User Details</h2>
                      <table className="user-details-table">
                        <tbody>
                          <tr>
                            <th>Username</th>
                            <td>{userDetails.username || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Email</th>
                            <td>{userDetails.email || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Address</th>
                            <td style={{fontFamily: 'monospace'}}>{userDetails.address}</td>
                          </tr>
                          <tr>
                            <th>Registered</th>
                            <td>{userDetails.isRegistered ? 'Yes' : 'No'}</td>
                          </tr>
                          <tr>
                            <th>Certificate Status</th>
                            <td>
                              {userCertificate ? (
                                <span className={`badge badge-${userCertificate.isRevoked ? 'revoked' : 'issued'}`}>{userCertificate.isRevoked ? 'Revoked' : 'Issued'}</span>
                              ) : (
                                <span className="badge badge-notissued">Not Issued</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Certificate Details */}
                      <h3 style={{marginTop: '1.5rem'}}>Certificate Details</h3>
                      {userCertificate ? (
                        <table className="user-details-table certificate-table">
                          <tbody>
                            <tr>
                              <th>Serial Number</th>
                              <td>{userCertificate.serialNumber || 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Common Name</th>
                              <td>{userCertificate.commonName || 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Organization</th>
                              <td>{userCertificate.organization || 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Valid From</th>
                              <td>{userCertificate.validFrom ? new Date(userCertificate.validFrom *1000).toLocaleString() : 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Valid To</th>
                              <td>{userCertificate.validTo ? new Date(userCertificate.validTo *1000).toLocaleString() : 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Revoked</th>
                              <td>{userCertificate.isRevoked ? 'Yes' : 'No'}</td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-content">No certificate issued.</div>
                      )}

                      {/* Public Keys */}
                      <h3 style={{marginTop: '1.5rem'}}>Public Keys</h3>
                      {userKeys && userKeys.length > 0 ? (
                        <table className="user-details-table keys-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Key Data</th>
                              <th>Status</th>
                              <th>Added At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userKeys.map((key, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td style={{fontFamily:'monospace', fontSize:'0.92em', wordBreak:'break-all'}}>{key.keyData || 'N/A'}</td>
                                <td>{key.isActive ? 'Active' : 'Inactive'}</td>
                                <td>{key.addedAt ? new Date(key.addedAt).toLocaleString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-content">No public keys found.</div>
                      )}

                      <button className="btn btn-close-details" style={{ width: 'fit-content', marginTop: '1.5rem' }} onClick={() => {
                        setSelectedUser(null);
                        setUserDetails(null);
                        setUserCertificate(null);
                        setUserKeys([]);
                        setUserDetailsError('');
                      }}>Close</button>
                    </>
                  ) : (
                    <div className="no-content">Select a user to view details</div>
                  )
                ) : (
                  <div className="no-content">Select a user to view details</div>
                )}
              </div>
            </div>
          ) : (
            <div className="stats-container">
              <h2>System Statistics</h2>
              {renderSystemStats()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
