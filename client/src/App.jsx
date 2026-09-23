import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [collegeName, setCollegeName] = useState('RK Institution');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState('Principal');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Settings & UI State
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regCollege, setRegCollege] = useState('');

  // --- DATA PERSISTENCE (Connected to SQL Server) ---
  const fetchData = async () => {
    try {
      const uRes = await fetch(`${API_URL}/users`);
      setUsers(await uRes.json());
      
      const aRes = await fetch(`${API_URL}/attendance`);
      setAttendanceRecords(await aRes.json());
    } catch (err) {
      console.error("Failed to fetch data from database", err);
    }
  };

  // Load data from DB when user logs in
  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  // Keep College Name in local storage just for UI persistence
  useEffect(() => {
    const savedCollege = localStorage.getItem('rk_collegeName');
    if (savedCollege) setCollegeName(savedCollege);
  }, []);

  useEffect(() => {
    localStorage.setItem('rk_collegeName', collegeName);
  }, [collegeName]);

  // --- AUTHENTICATION LOGIC ---
  const handleRegisterPrincipal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, username, password, role: 'Principal' })
      });
      
      if (res.ok) {
        if (regCollege) setCollegeName(regCollege);
        alert("Principal Registered Successfully! You can now log in.");
        setIsRegistering(false);
        setUsername('');
        setPassword('');
      } else {
        alert("Username already exists!");
      }
    } catch (err) {
      alert("Server error - is Node running?");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: activeRole })
      });
      
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setUsername('');
        setPassword('');
        setFilterText('');
      } else {
        alert("Unauthorized Access: Invalid Credentials or Wrong Role Portal.");
      }
    } catch (err) {
      alert("Cannot connect to server.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowSettings(false);
  };

  // --- DATA MANAGEMENT FUNCTIONS ---
  const addUser = async (e, role) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newUser = {
      name: fd.get('name'),
      username: fd.get('username'),
      password: fd.get('password'),
      role: role,
      department: fd.get('department') || currentUser.department || 'General',
      year: fd.get('year') || 'N/A'
    };

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (res.ok) {
        fetchData(); // Refresh list from DB
        e.target.reset();
      } else {
        alert("Username already taken!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeUser = async (id) => {
    if (window.confirm("Are you sure you want to remove this member and their data?")) {
      await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      fetchData(); // Refresh UI
    }
  };

  const markAttendance = async (studentId, status, date, hour) => {
    await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, status, date, hour })
    });
    fetchData(); // Refresh UI with new data
  };

  // --- PERCENTAGE CALCULATOR (Your exact logic) ---
  const getPercentages = (studentId) => {
    const studentRecords = attendanceRecords.filter(a => String(a.studentId) === String(studentId));
    if (studentRecords.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const today = new Date().toISOString().split('T')[0];
    const presentCount = (records) => records.filter(r => r.status === 'Present').length;
    const calc = (records) => records.length === 0 ? 0 : Math.round((presentCount(records) / records.length) * 100);

    const dailyRecords = studentRecords.filter(r => {
      // Safely check dates in case DB returns ISO format
      return new Date(r.date).toISOString().split('T')[0] === today;
    });
    const weeklyRecords = studentRecords.slice(-35); 
    const monthlyRecords = studentRecords.slice(-150);

    return { daily: calc(dailyRecords), weekly: calc(weeklyRecords), monthly: calc(monthlyRecords) };
  };

  // --- STYLES (Dynamic for Dark Mode) ---
  const theme = {
    bg: darkMode ? '#121212' : '#f8f9fa',
    card: darkMode ? '#1e1e1e' : '#fff',
    text: darkMode ? '#f1f1f1' : '#333',
    subText: darkMode ? '#aaa' : '#6c757d',
    border: darkMode ? '#333' : '#ddd',
    blue: '#0d6efd',
    danger: '#dc3545',
    inputBg: darkMode ? '#2d2d2d' : '#fff',
  };

  const s = {
    container: { backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}` },
    btn: { padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#fff' },
    blueBtn: { backgroundColor: theme.blue, color: '#fff', padding: '12px', width: '100%', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    input: { padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box', borderRadius: '5px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text },
    card: { backgroundColor: theme.card, padding: '20px', margin: '20px auto', maxWidth: '800px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: `1px solid ${theme.border}` },
    settingsMenu: { position: 'absolute', right: '20px', top: '60px', backgroundColor: theme.card, padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '5px', zIndex: 10 },
  };

  // --- RENDER HELPERS ---
  const renderUserList = (roleFilter, deptFilter = null) => {
    let filteredUsers = users.filter(u => u.role === roleFilter);
    if (deptFilter) filteredUsers = filteredUsers.filter(u => u.department === deptFilter);
    if (filterText) filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(filterText.toLowerCase()));

    return (
      <div>
        <h3 style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>{roleFilter} List</h3>
        {filteredUsers.length === 0 ? <p style={{ color: theme.subText }}>No {roleFilter}s added yet.</p> : null}
        
        {filteredUsers.map(u => (
          <div key={u.id} style={s.listItem}>
            <div>
              <strong>{u.name}</strong> ({u.department})
              {roleFilter === 'Student' && (
                <div style={{ fontSize: '12px', color: theme.subText, marginTop: '4px' }}>
                  Attendance: Daily {getPercentages(u.id).daily}% | Weekly {getPercentages(u.id).weekly}% | Monthly {getPercentages(u.id).monthly}%
                </div>
              )}
            </div>
            <button onClick={() => removeUser(u.id)} style={{ ...s.btn, backgroundColor: theme.danger, padding: '5px 10px' }}>Remove</button>
          </div>
        ))}
      </div>
    );
  };

  const renderAddForm = (role) => (
    <form onSubmit={(e) => addUser(e, role)} style={{ marginBottom: '30px', padding: '15px', backgroundColor: darkMode ? '#252525' : '#f1f3f5', borderRadius: '5px' }}>
      <h4>Add New {role}</h4>
      <input name="name" placeholder="Full Name" required style={s.input} />
      <input name="username" placeholder="Login Username" required style={s.input} />
      <input name="password" type="password" placeholder="Login Password" required style={s.input} />
      {(activeRole === 'Principal' && role !== 'Student') && <input name="department" placeholder="Department (e.g., CS)" required style={s.input} />}
      {role === 'Student' && <input name="year" placeholder="Year (e.g., 1st Year)" required style={s.input} />}
      <button type="submit" style={{ ...s.blueBtn, marginTop: '10px' }}>Add {role}</button>
    </form>
  );

  // ==========================================
  //                MAIN UI
  // ==========================================
  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <h2 style={{ margin: 0 }}>{collegeName}</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          {currentUser && <span style={{ padding: '5px' }}>Hi, {currentUser.name}</span>}
          <button onClick={() => setShowSettings(!showSettings)} style={{ ...s.btn, backgroundColor: theme.subText }}>⚙️ Settings</button>
          {currentUser && <button onClick={handleLogout} style={{ ...s.btn, backgroundColor: theme.danger }}>Logout</button>}
        </div>
      </header>

      {/* SETTINGS DROPDOWN */}
      {showSettings && (
        <div style={s.settingsMenu}>
          <h4>Settings</h4>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} /> Dark Mode
          </label>
          {currentUser && (
            <div>
              <label style={{ fontSize: '14px' }}>Filter Current Page:</label>
              <input 
                placeholder="Search names..." 
                value={filterText} 
                onChange={(e) => setFilterText(e.target.value)} 
                style={s.input} 
              />
            </div>
          )}
        </div>
      )}

      {/* --- DASHBOARDS --- */}
      {currentUser ? (
        <div style={s.card}>
          <h2>{currentUser.role} Dashboard</h2>
          
          {/* PRINCIPAL VIEW */}
          {currentUser.role === 'Principal' && (
            <div>
              {renderAddForm('HOD')}
              {renderAddForm('Faculty')}
              {renderAddForm('Student')}
              <hr style={{ borderColor: theme.border, margin: '20px 0' }}/>
              {renderUserList('HOD')}
              {renderUserList('Faculty')}
              {renderUserList('Student')}
            </div>
          )}

          {/* HOD VIEW */}
          {currentUser.role === 'HOD' && (
            <div>
              <p style={{ color: theme.subText }}>Managing Department: {currentUser.department}</p>
              {renderAddForm('Faculty')}
              {renderAddForm('Student')}
              <hr style={{ borderColor: theme.border, margin: '20px 0' }}/>
              {renderUserList('Faculty', currentUser.department)}
              {renderUserList('Student', currentUser.department)}
            </div>
          )}

          {/* FACULTY VIEW */}
          {currentUser.role === 'Faculty' && (
            <div>
              <p style={{ color: theme.subText }}>Department: {currentUser.department}</p>
              {renderAddForm('Student')}
              
              <hr style={{ borderColor: theme.border, margin: '20px 0' }}/>
              <h3>Mark Attendance</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input type="date" id="attDate" defaultValue={new Date().toISOString().split('T')[0]} style={{...s.input, width: 'auto'}} />
                <select id="attHour" style={{...s.input, width: 'auto'}}>
                  {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>Hour {h}</option>)}
                </select>
              </div>

              {users.filter(u => u.role === 'Student' && u.department === currentUser.department).map(student => (
                <div key={student.id} style={s.listItem}>
                  <div>
                    <strong>{student.name}</strong> ({student.year})
                    <div style={{ fontSize: '12px', color: theme.subText }}>
                      Daily {getPercentages(student.id).daily}% | Wk {getPercentages(student.id).weekly}% | Mo {getPercentages(student.id).monthly}%
                    </div>
                  </div>
                  <div>
                    <button onClick={() => markAttendance(student.id, 'Present', document.getElementById('attDate').value, document.getElementById('attHour').value)} style={{ ...s.btn, backgroundColor: '#198754', marginRight: '5px' }}>P</button>
                    <button onClick={() => markAttendance(student.id, 'Absent', document.getElementById('attDate').value, document.getElementById('attHour').value)} style={{ ...s.btn, backgroundColor: '#dc3545' }}>A</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* --- LOGIN & REGISTRATION --- */
        <div style={{ ...s.card, maxWidth: '400px', marginTop: '50px' }}>
          
          <div style={{ display: 'flex', marginBottom: '20px', borderBottom: `2px solid ${theme.border}` }}>
            {['Principal', 'HOD', 'Faculty'].map(role => (
              <button 
                key={role} 
                onClick={() => { setActiveRole(role); setIsRegistering(false); }}
                style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: activeRole === role ? theme.blue : theme.subText, borderBottom: activeRole === role ? `3px solid ${theme.blue}` : 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {role}
              </button>
            ))}
          </div>

          {isRegistering && activeRole === 'Principal' ? (
            <form onSubmit={handleRegisterPrincipal}>
              <h3 style={{ textAlign: 'center' }}>Principal Setup</h3>
              <input placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} required style={s.input} />
              <input placeholder="College Name (Optional)" value={regCollege} onChange={e => setRegCollege(e.target.value)} style={s.input} />
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={s.input} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={s.input} />
              <button type="submit" style={s.blueBtn}>Register Now</button>
              <button type="button" onClick={() => setIsRegistering(false)} style={{ ...s.btn, background: 'none', color: theme.blue, width: '100%', marginTop: '10px' }}>Back to Login</button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <h3 style={{ textAlign: 'center' }}>{activeRole} Login</h3>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={s.input} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={s.input} />
              <button type="submit" style={s.blueBtn}>Login</button>
              
              {activeRole === 'Principal' && (
                <button type="button" onClick={() => setIsRegistering(true)} style={{ ...s.btn, background: 'none', color: theme.blue, width: '100%', marginTop: '10px' }}>
                  New Registration
                </button>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}