const { useState, useEffect, useRef } = React;

/* ── Utility helpers ─────────────────────────────────────────────── */
function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString();
}

function formatNumber(raw) {
    const digits = raw.replace(/\D/g, '');
    if (raw.startsWith('+')) return raw.replace(/\s/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return raw;
}

/* ── Incoming call modal ─────────────────────────────────────────── */
function IncomingCallModal({ incomingCall, onAccept, onReject }) {
    return (
        <div className="modal-overlay">
            <div className="modal incoming-call">
                <div className="call-avatar">&#9742;</div>
                <p className="call-name">{incomingCall.fromName}</p>
                <p className="call-label">Incoming call...</p>
                <div className="call-actions">
                    <button className="btn-accept" onClick={onAccept}>Accept</button>
                    <button className="btn-reject" onClick={onReject}>Reject</button>
                </div>
            </div>
        </div>
    );
}

/* ── Contacts panel ──────────────────────────────────────────────── */
function ContactsPanel({ contacts, onCall, showAddContact, setShowAddContact, newContact, setNewContact, onAddContact, addContactError }) {
    return (
        <aside className="panel contacts-panel">
            <div className="panel-header">
                <h3>Contacts</h3>
                <button className="btn-add-contact" onClick={() => setShowAddContact(v => !v)}>
                    {showAddContact ? '✕' : '+'}
                </button>
            </div>

            {showAddContact && (
                <div className="add-contact-drawer">
                    <input
                        value={newContact.name}
                        onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))}
                        type="text" placeholder="Name" className="search-input"
                    />
                    <input
                        value={newContact.phoneNumber}
                        onChange={e => setNewContact(c => ({ ...c, phoneNumber: e.target.value }))}
                        type="tel" placeholder="Phone number" className="search-input"
                    />
                    <button
                        className="btn-primary"
                        onClick={onAddContact}
                        disabled={!newContact.name || !newContact.phoneNumber}
                    >
                        Save Contact
                    </button>
                    {addContactError && <p className="error-msg">{addContactError}</p>}
                </div>
            )}

            <ul className="contact-list">
                {contacts.length === 0 && (
                    <li className="empty-hint">No contacts yet.<br />Click <strong>+</strong> to add one.</li>
                )}
                {contacts.map(c => (
                    <li key={c.id} className="contact-item">
                        <div className="contact-info">
                            <span className="contact-name">{c.name}</span>
                            <span className="contact-username">{c.phoneNumber}</span>
                        </div>
                        <button className="btn-call-sm" onClick={() => onCall(c)} title="Call">&#9742;</button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

/* ── Dial pad panel ──────────────────────────────────────────────── */
const DIAL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function DialpadPanel({ dialInput, setDialInput, dialSuggestions, setDialSuggestions, onDial, onDialInput, onSelectContact, callError }) {
    return (
        <main className="panel center-panel">
            <div className="dialpad-view">
                <div className="dial-display-wrap">
                    <div className="dial-display">
                        <input
                            className="dial-input"
                            value={dialInput}
                            onChange={e => { setDialInput(e.target.value); onDialInput(e.target.value); }}
                            onKeyUp={e => e.key === 'Enter' && onDial()}
                            placeholder="Name or number..."
                            autoComplete="off"
                        />
                        {dialInput && (
                            <button className="btn-backspace" onClick={() => { setDialInput(''); setDialSuggestions([]); }}>
                                &#9003;
                            </button>
                        )}
                    </div>
                    {dialSuggestions.length > 0 && (
                        <ul className="dial-suggestions">
                            {dialSuggestions.map(c => (
                                <li key={c.id} onClick={() => onSelectContact(c)}>
                                    <span className="suggestion-name">{c.name}</span>
                                    <span className="suggestion-number">{c.phoneNumber}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="dialpad-grid">
                    {DIAL_KEYS.map(key => (
                        <button
                            key={key} className="dial-key"
                            onClick={() => { setDialInput(d => d + key); setDialSuggestions([]); }}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                <button className="btn-call" onClick={onDial} disabled={!dialInput}>
                    &#9742; Call
                </button>
                {callError && <p className="error-msg">{callError}</p>}
            </div>
        </main>
    );
}

/* ── Active call view ────────────────────────────────────────────── */
function ActiveCallView({ activeCall, callSeconds, muted, onHangUp, onToggleMute }) {
    const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const s = (callSeconds % 60).toString().padStart(2, '0');
    return (
        <main className="panel center-panel">
            <div className="active-call-view">
                <div className="call-avatar large">&#9742;</div>
                <p className="call-name large">{activeCall.remoteName}</p>
                <p className="call-timer">{m}:{s}</p>
                <div className="call-controls">
                    <button className={`ctrl-btn${muted ? ' active' : ''}`} onClick={onToggleMute} title="Mute">
                        {muted ? '\uD83D\uDD07' : '\uD83C\uDF99'}
                    </button>
                    <button className="ctrl-btn hangup" onClick={onHangUp} title="Hang Up">&#128222;</button>
                </div>
                <audio id="remoteAudio" autoPlay />
            </div>
        </main>
    );
}

/* ── Call history panel ──────────────────────────────────────────── */
function HistoryPanel({ callHistory, currentUser, onCallBack }) {
    function callIconClass(call) {
        if (call.status === 'MISSED' || call.status === 'REJECTED') return 'missed';
        if (call.caller.id === currentUser.id) return 'outgoing';
        return 'answered';
    }
    function callIconChar(call) {
        if (call.caller.id === currentUser.id) return '↗';
        if (call.status === 'MISSED') return '↙';
        return '↘';
    }
    function calleeDisplay(call) {
        if (call.callee) return call.callee.displayName;
        return call.calleeNumber || 'Unknown';
    }

    return (
        <aside className="panel history-panel">
            <div className="panel-header">
                <h3>Recent Calls</h3>
            </div>
            <ul className="history-list">
                {callHistory.length === 0 && <li className="empty-hint">No recent calls.</li>}
                {callHistory.map(call => (
                    <li key={call.id} className="history-item">
                        <span className={`call-icon ${callIconClass(call)}`}>{callIconChar(call)}</span>
                        <div className="history-info">
                            <span className="history-name">
                                {call.caller.id === currentUser.id ? calleeDisplay(call) : call.caller.displayName}
                            </span>
                            <span className="history-meta">
                                {call.status}{call.durationSeconds ? ' \u2022 ' + formatDuration(call.durationSeconds) : ''}
                            </span>
                            <span className="history-time">{formatTime(call.startTime)}</span>
                        </div>
                        <button className="btn-call-sm" onClick={() => onCallBack(call)} title="Call back">&#9742;</button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

/* ── Bottom navigation (mobile only) ────────────────────────────── */
function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'contacts', label: 'Contacts', icon: '👥' },
        { id: 'dialpad',  label: 'Dialpad',  icon: '☎' },
        { id: 'history',  label: 'Recent',   icon: '📋' },
    ];
    return (
        <nav className="bottom-nav">
            {tabs.map(t => (
                <button
                    key={t.id}
                    className={`bottom-nav-btn${activeTab === t.id ? ' active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                >
                    <span className="bottom-nav-icon">{t.icon}</span>
                    <span>{t.label}</span>
                </button>
            ))}
        </nav>
    );
}

/* ── Main app ────────────────────────────────────────────────────── */
function PhoneApp() {
    const tokenRef    = useRef(localStorage.getItem('token'));
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [myStatus,       setMyStatus]       = useState(currentUser.status || 'ONLINE');
    const [contacts,       setContacts]       = useState([]);
    const [callHistory,    setCallHistory]    = useState([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact,     setNewContact]     = useState({ name: '', phoneNumber: '' });
    const [addContactError,setAddContactError]= useState('');
    const [dialInput,      setDialInput]      = useState('');
    const [dialSuggestions,setDialSuggestions]= useState([]);
    const [callError,      setCallError]      = useState('');
    const [incomingCall,   setIncomingCall]   = useState(null);
    const [activeCall,     setActiveCall]     = useState(null);
    const [twilioReady,    setTwilioReady]    = useState(false);
    const [callSeconds,    setCallSeconds]    = useState(0);
    const [muted,          setMuted]          = useState(false);
    const [activeTab,      setActiveTab]      = useState('dialpad');

    // Refs hold values that shouldn't trigger re-renders (and avoids wrapping
    // Twilio's Device in a Vue-style Proxy, which caused the _log error)
    const twilioDevice       = useRef(null);
    const currentCall        = useRef(null);
    const currentCallRecordId= useRef(null);
    const callTimerInterval  = useRef(null);

    /* ── API helper ─────────────────────────────────────────────── */
    function api(path, options = {}) {
        return fetch(path, {
            ...options,
            headers: {
                'Authorization': `Bearer ${tokenRef.current}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
    }

    /* ── Data loaders ───────────────────────────────────────────── */
    async function loadContacts() {
        const res = await api('/api/contacts');
        setContacts(await res.json());
    }

    async function loadCallHistory() {
        const res = await api('/api/calls');
        setCallHistory(await res.json());
    }

    /* ── Twilio init ────────────────────────────────────────────── */
    async function initTwilio() {
        try {
            const res = await api('/api/twilio/token');
            if (!res.ok) throw new Error('Could not get Twilio token');
            const { token } = await res.json();

            // Store device in a ref — never in React state — so Twilio's
            // internal private fields are never wrapped in a Proxy.
            const device = new Twilio.Device(token, {
                logLevel: 1,
                codecPreferences: ['opus', 'pcmu'],
                edge: 'roaming'
            });
            twilioDevice.current = device;

            device.on('registered', () => setTwilioReady(true));

            device.on('incoming', (call) => {
                setIncomingCall({ call, fromName: call.parameters.From || 'Unknown' });
                call.on('cancel', () => setIncomingCall(null));
            });

            device.on('error', (err) => {
                console.error('Twilio error:', err.code, err.message, err);
                setCallError(`Phone error (${err.code}): ${err.message}`);
            });

            await device.register();
        } catch (e) {
            console.error('Twilio init failed:', e.message);
            setCallError('Phone failed to initialize: ' + e.message);
        }
    }

    useEffect(() => {
        if (!tokenRef.current) { window.location.href = '/index.html'; return; }
        loadContacts();
        loadCallHistory();
        initTwilio();
        return () => {
            if (twilioDevice.current) twilioDevice.current.destroy();
            clearInterval(callTimerInterval.current);
        };
    }, []);

    /* ── Call lifecycle ─────────────────────────────────────────── */
    function startActiveCall(remoteName) {
        setActiveCall({ remoteName });
        if (!callTimerInterval.current) {
            setCallSeconds(0);
            callTimerInterval.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
        }
    }

    async function endActiveCall(status) {
        clearInterval(callTimerInterval.current);
        callTimerInterval.current = null;
        setActiveCall(null);
        currentCall.current = null;
        setMuted(false);
        if (currentCallRecordId.current) {
            await api(`/api/calls/${currentCallRecordId.current}/status?status=${status}`, { method: 'PUT' });
            currentCallRecordId.current = null;
        }
        await loadCallHistory();
    }

    async function dial(rawNumber, displayName) {
        setCallError('');
        if (!twilioReady) { setCallError('Phone not ready yet. Please wait.'); return; }
        const to    = formatNumber(rawNumber);
        const label = displayName || to;

        try {
            const recRes = await api('/api/calls/pstn', {
                method: 'POST',
                body: JSON.stringify({ calleeNumber: to })
            });
            if (recRes.ok) {
                const record = await recRes.json();
                currentCallRecordId.current = record.id;
            }
        } catch (e) {
            console.warn('Could not create call record:', e.message);
        }

        try {
            const call = await twilioDevice.current.connect({ params: { To: to } });
            currentCall.current = call;

            call.on('accept',     ()    => {
                startActiveCall(label);
                api(`/api/calls/${currentCallRecordId.current}/status?status=ANSWERED`, { method: 'PUT' });
            });
            call.on('disconnect', ()    => endActiveCall('ENDED'));
            call.on('cancel',     ()    => endActiveCall('MISSED'));
            call.on('error',      (err) => { setCallError(err.message); endActiveCall('MISSED'); });

            startActiveCall(label);
            setActiveTab('dialpad'); // keep dialpad tab active so the call view shows
        } catch (e) {
            setCallError(e.message);
            endActiveCall('MISSED');
        }
    }

    /* ── Contact actions ────────────────────────────────────────── */
    async function addContact() {
        setAddContactError('');
        try {
            await api('/api/contacts', {
                method: 'POST',
                body: JSON.stringify({ name: newContact.name, phoneNumber: newContact.phoneNumber })
            });
            setNewContact({ name: '', phoneNumber: '' });
            setShowAddContact(false);
            await loadContacts();
        } catch (e) {
            setAddContactError('Failed to save contact');
        }
    }

    /* ── Dial pad actions ───────────────────────────────────────── */
    async function onDialInput(value) {
        if (!value || /^[\d\s+\-()]+$/.test(value)) { setDialSuggestions([]); return; }
        const res = await api(`/api/contacts/search?name=${encodeURIComponent(value)}`);
        setDialSuggestions(await res.json());
    }

    async function dialCall() {
        const raw = dialInput.trim();
        if (!raw) return;
        setDialInput('');
        setDialSuggestions([]);
        await dial(raw);
    }

    /* ── Incoming call actions ──────────────────────────────────── */
    async function acceptCall() {
        const { call, fromName } = incomingCall;
        setIncomingCall(null);
        call.accept();
        currentCall.current = call;
        call.on('disconnect', () => endActiveCall('ENDED'));
        call.on('error',      () => endActiveCall('ENDED'));
        startActiveCall(fromName);
    }

    function rejectCall() {
        incomingCall.call.reject();
        setIncomingCall(null);
    }

    /* ── In-call controls ───────────────────────────────────────── */
    function hangUp() {
        if (currentCall.current) currentCall.current.disconnect();
    }

    function toggleMute() {
        if (currentCall.current) {
            const next = !muted;
            setMuted(next);
            currentCall.current.mute(next);
        }
    }

    /* ── Call history ───────────────────────────────────────────── */
    function callBack(call) {
        const isCaller = call.caller.id === currentUser.id;
        if (isCaller) {
            const num = call.calleeNumber || (call.callee && call.callee.phoneNumber);
            if (num) dial(num, call.calleeNumber ? call.calleeNumber : call.callee?.displayName);
        } else {
            const num = call.caller.phoneNumber;
            if (num) dial(num, call.caller.displayName);
        }
    }

    /* ── Status / auth ──────────────────────────────────────────── */
    async function changeStatus(newStatus) {
        setMyStatus(newStatus);
        await api(`/api/users/status?status=${newStatus}`, { method: 'PUT' });
    }

    function logout() {
        api('/api/users/status?status=OFFLINE', { method: 'PUT' }).finally(() => {
            if (twilioDevice.current) twilioDevice.current.destroy();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }

    /* ── Shared panel props ─────────────────────────────────────── */
    const contactsPanelProps = {
        contacts,
        onCall: c => { dial(c.phoneNumber, c.name); setActiveTab('dialpad'); },
        showAddContact, setShowAddContact,
        newContact, setNewContact,
        onAddContact: addContact,
        addContactError
    };

    const dialpadPanelProps = {
        dialInput, setDialInput,
        dialSuggestions, setDialSuggestions,
        onDial: dialCall,
        onDialInput,
        onSelectContact: c => { setDialInput(c.phoneNumber); setDialSuggestions([]); },
        callError
    };

    const activeCallProps = {
        activeCall, callSeconds, muted,
        onHangUp: hangUp,
        onToggleMute: toggleMute
    };

    const historyPanelProps = {
        callHistory, currentUser,
        onCallBack: c => { callBack(c); setActiveTab('dialpad'); }
    };

    // The center panel is shared between desktop and mobile
    const centerPanel = activeCall
        ? <ActiveCallView {...activeCallProps} />
        : <DialpadPanel {...dialpadPanelProps} />;

    // On mobile, which tab class to show (controls CSS visibility)
    const bodyClass = `app-body tab-${activeTab}${activeCall ? ' in-call' : ''}`;

    return (
        <>
            {incomingCall && (
                <IncomingCallModal
                    incomingCall={incomingCall}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                />
            )}

            {/* ── Header ── */}
            <header className="app-header">
                <div className="header-left">
                    <span className="logo">&#9742; Phone App</span>
                </div>
                <div className="header-right">
                    <span className={`status-dot ${myStatus.toLowerCase()}`}></span>
                    <span className="user-name">{currentUser.displayName}</span>
                    <select value={myStatus} onChange={e => changeStatus(e.target.value)} className="status-select">
                        <option value="ONLINE">Online</option>
                        <option value="BUSY">Busy</option>
                        <option value="OFFLINE">Offline</option>
                    </select>
                    <button className="btn-logout" onClick={logout}>Logout</button>
                </div>
            </header>

            {/* ── Main panels ── */}
            {/* On desktop all 3 panels show side-by-side via flex.          */}
            {/* On mobile, CSS hides non-active panels; tab-* class controls */}
            {/* which one is visible. In-call always shows the center panel. */}
            <div className={bodyClass}>
                <ContactsPanel {...contactsPanelProps} />
                {centerPanel}
                <HistoryPanel {...historyPanelProps} />
            </div>

            {/* ── Bottom nav (mobile only, hidden via CSS on desktop) ── */}
            {!activeCall && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PhoneApp />);
