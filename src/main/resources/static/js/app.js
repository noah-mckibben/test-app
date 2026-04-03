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
function ContactsPanel({
    contacts, onCallPstn, onCallApp,
    showAddContact, setShowAddContact,
    newContact, setNewContact, onAddContact, addContactError,
    onlineUsers, currentUserId,
    userSearch, setUserSearch, userResults, onSearchUsers
}) {
    // Separate contacts by whether they have an online app user match
    const appOnline  = contacts.filter(c => c.appStatus === 'ONLINE');
    const appOffline = contacts.filter(c => c.appUsername && c.appStatus !== 'ONLINE');
    const pstnOnly   = contacts.filter(c => !c.appUsername);

    // Online users not already in contacts list
    const contactAppUserIds = new Set(contacts.map(c => c.appUserId).filter(Boolean));
    const onlineNotInContacts = onlineUsers.filter(
        u => u.id !== currentUserId && !contactAppUserIds.has(u.id)
    );

    const isSearching = userSearch.trim().length > 0;

    function statusDot(status) {
        const cls = status === 'ONLINE' ? 'online' : status === 'BUSY' ? 'busy' : 'offline';
        return <span className={`status-dot ${cls}`} style={{ marginRight: 6 }} />;
    }

    function statusLabel(status) {
        if (status === 'ONLINE') return 'Online';
        if (status === 'BUSY')   return 'Busy';
        return 'Offline';
    }

    return (
        <aside className="panel contacts-panel">
            <div className="panel-header">
                <h3>Contacts</h3>
                <button className="btn-add-contact" onClick={() => { setShowAddContact(v => !v); setUserSearch(''); }}>
                    {showAddContact ? '✕' : '+'}
                </button>
            </div>

            {/* ── User search bar ─────────────────────────────────── */}
            <div className="user-search-row">
                <input
                    className="search-input"
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); onSearchUsers(e.target.value); }}
                    placeholder="Search users by name or username…"
                    type="search"
                />
                {userSearch && (
                    <button className="btn-search-clear" onClick={() => { setUserSearch(''); }}>✕</button>
                )}
            </div>

            {showAddContact && !isSearching && (
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

                {/* ════════════════════════════════════════════════
                    USER SEARCH RESULTS
                    Shown only while the search bar has input.
                    ════════════════════════════════════════════════ */}
                {isSearching && (
                    <>
                        {userResults.length === 0 && (
                            <li className="empty-hint">No users found.</li>
                        )}
                        {userResults.map(u => (
                            <li key={`search-${u.id}`} className="contact-item">
                                <div className="contact-info">
                                    {statusDot(u.status)}
                                    <span className="contact-name">{u.displayName}</span>
                                    <span className="contact-username">@{u.username}</span>
                                </div>
                                <div className="call-btn-group">
                                    {/* In-app call — always available for app users */}
                                    <button
                                        className={`btn-call-sm app-call${u.status !== 'ONLINE' ? ' dim' : ''}`}
                                        onClick={() => onCallApp(u.phoneNumber || '', u.displayName, u.username, u.id)}
                                        title={u.status === 'ONLINE' ? 'Call in-app' : `Call in-app (${statusLabel(u.status)})`}
                                    >
                                        &#9742;
                                    </button>
                                    {/* PSTN fallback when they have a phone number */}
                                    {u.phoneNumber && (
                                        <button
                                            className="btn-call-sm"
                                            onClick={() => onCallPstn({ phoneNumber: u.phoneNumber, name: u.displayName })}
                                            title="Call phone number"
                                        >
                                            &#128222;
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </>
                )}

                {/* ════════════════════════════════════════════════
                    REGULAR CONTACT LIST
                    Shown when the search bar is empty.
                    ════════════════════════════════════════════════ */}
                {!isSearching && (
                    <>
                        {/* ── Online app users not yet saved as contacts ─── */}
                        {onlineNotInContacts.length > 0 && (
                            <>
                                <li className="contact-section-header">Online Now</li>
                                {onlineNotInContacts.map(u => (
                                    <li key={`online-${u.id}`} className="contact-item">
                                        <div className="contact-info">
                                            {statusDot('ONLINE')}
                                            <span className="contact-name">{u.displayName}</span>
                                            <span className="contact-username">@{u.username}</span>
                                        </div>
                                        <button
                                            className="btn-call-sm app-call"
                                            onClick={() => onCallApp(u.phoneNumber || '', u.displayName, u.username, u.id)}
                                            title="Call in-app (free)"
                                        >
                                            &#9742;
                                        </button>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ── Contacts who are online app users ─────────── */}
                        {appOnline.length > 0 && (
                            <>
                                <li className="contact-section-header">In-App · Online</li>
                                {appOnline.map(c => (
                                    <li key={c.id} className="contact-item">
                                        <div className="contact-info">
                                            {statusDot('ONLINE')}
                                            <span className="contact-name">{c.name}</span>
                                            <span className="contact-username">@{c.appUsername}</span>
                                        </div>
                                        <div className="call-btn-group">
                                            <button
                                                className="btn-call-sm app-call"
                                                onClick={() => onCallApp(c.phoneNumber, c.name, c.appUsername, c.appUserId)}
                                                title="Call in-app (free)"
                                            >
                                                &#9742;
                                            </button>
                                            <button
                                                className="btn-call-sm"
                                                onClick={() => onCallPstn(c)}
                                                title="Call phone number"
                                            >
                                                &#128222;
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ── Contacts who are app users but offline ─────── */}
                        {appOffline.length > 0 && (
                            <>
                                <li className="contact-section-header">In-App · Offline</li>
                                {appOffline.map(c => (
                                    <li key={c.id} className="contact-item">
                                        <div className="contact-info">
                                            {statusDot(c.appStatus || 'OFFLINE')}
                                            <span className="contact-name">{c.name}</span>
                                            <span className="contact-username">@{c.appUsername}</span>
                                        </div>
                                        <div className="call-btn-group">
                                            <button
                                                className="btn-call-sm app-call dim"
                                                onClick={() => onCallApp(c.phoneNumber, c.name, c.appUsername, c.appUserId)}
                                                title="Call in-app (offline)"
                                            >
                                                &#9742;
                                            </button>
                                            <button
                                                className="btn-call-sm"
                                                onClick={() => onCallPstn(c)}
                                                title="Call phone number"
                                            >
                                                &#128222;
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ── External-only contacts (no app account) ───── */}
                        {pstnOnly.length > 0 && (
                            <>
                                {(appOnline.length > 0 || appOffline.length > 0 || onlineNotInContacts.length > 0) && (
                                    <li className="contact-section-header">External</li>
                                )}
                                {pstnOnly.map(c => (
                                    <li key={c.id} className="contact-item">
                                        <div className="contact-info">
                                            <span className="contact-name">{c.name}</span>
                                            <span className="contact-username">{c.phoneNumber}</span>
                                        </div>
                                        <button
                                            className="btn-call-sm"
                                            onClick={() => onCallPstn(c)}
                                            title="Call phone number"
                                        >
                                            &#9742;
                                        </button>
                                    </li>
                                ))}
                            </>
                        )}

                        {contacts.length === 0 && onlineNotInContacts.length === 0 && (
                            <li className="empty-hint">No contacts yet.<br />Click <strong>+</strong> to add one.</li>
                        )}
                    </>
                )}
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
                {activeCall.isAppCall && (
                    <span className="app-call-badge">In-App</span>
                )}
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
    function isAppCall(call) {
        // A call has a callee User object when it was app-to-app
        return call.callee != null;
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
                                {isAppCall(call) && <span className="app-call-badge small"> In-App</span>}
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
    const [onlineUsers,    setOnlineUsers]    = useState([]);
    const [callHistory,    setCallHistory]    = useState([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact,     setNewContact]     = useState({ name: '', phoneNumber: '' });
    const [addContactError,setAddContactError]= useState('');
    const [userSearch,     setUserSearch]     = useState('');
    const [userResults,    setUserResults]    = useState([]);
    const [dialInput,      setDialInput]      = useState('');
    const [dialSuggestions,setDialSuggestions]= useState([]);
    const [callError,      setCallError]      = useState('');
    const [incomingCall,   setIncomingCall]   = useState(null);
    const [activeCall,     setActiveCall]     = useState(null);
    const [twilioReady,    setTwilioReady]    = useState(false);
    const [callSeconds,    setCallSeconds]    = useState(0);
    const [muted,          setMuted]          = useState(false);
    const [activeTab,      setActiveTab]      = useState('dialpad');

    // Refs: never put Twilio's Device in React state — its private class fields
    // are non-configurable, which causes a Proxy invariant error in Vue / React.
    const twilioDevice        = useRef(null);
    const currentCall         = useRef(null);
    const currentCallRecordId = useRef(null);
    const callTimerInterval   = useRef(null);

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

    async function loadOnlineUsers() {
        const res = await api('/api/users/online');
        setOnlineUsers(await res.json());
    }

    async function loadCallHistory() {
        const res = await api('/api/calls');
        setCallHistory(await res.json());
    }

    async function searchUsers(query) {
        if (!query.trim()) { setUserResults([]); return; }
        const res = await api(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
            const all = await res.json();
            // Exclude the logged-in user from results
            setUserResults(all.filter(u => u.id !== currentUser.id));
        }
    }

    /* ── Twilio init ────────────────────────────────────────────── */
    async function initTwilio() {
        try {
            const res = await api('/api/twilio/token');
            if (!res.ok) throw new Error('Could not get Twilio token');
            const { token } = await res.json();

            // Store in a ref — never in state — so Twilio's internal private
            // fields are never wrapped in a React/Vue Proxy.
            const device = new Twilio.Device(token, {
                logLevel: 1,
                codecPreferences: ['opus', 'pcmu'],
                edge: 'roaming'
            });
            twilioDevice.current = device;

            device.on('registered', () => {
                setTwilioReady(true);
                // Refresh online users when we ourselves come online
                loadOnlineUsers();
            });

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
        loadOnlineUsers();
        loadCallHistory();
        initTwilio();

        // Refresh online users every 30 s so status stays current
        const onlineInterval = setInterval(loadOnlineUsers, 30_000);

        return () => {
            if (twilioDevice.current) twilioDevice.current.destroy();
            clearInterval(callTimerInterval.current);
            clearInterval(onlineInterval);
        };
    }, []);

    /* ── Call lifecycle ─────────────────────────────────────────── */
    function startActiveCall(remoteName, isAppCall = false) {
        setActiveCall({ remoteName, isAppCall });
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
        await Promise.all([loadCallHistory(), loadOnlineUsers(), loadContacts()]);
    }

    /**
     * Core dial function.
     *
     * @param rawNumber  - E.164 or local phone number string (used for PSTN and display)
     * @param displayName - Human-readable label for the call screen
     * @param appUsername - If set, dials via Twilio Client (in-app, free); otherwise PSTN
     * @param appUserId   - Used to create the call record for app-to-app calls
     */
    async function dial(rawNumber, displayName, appUsername = null, appUserId = null) {
        setCallError('');
        if (!twilioReady) { setCallError('Phone not ready yet. Please wait.'); return; }

        const isAppCall = !!appUsername;
        const to        = isAppCall ? `client:${appUsername}` : formatNumber(rawNumber);
        const label     = displayName || to;

        // Create call record (best-effort)
        try {
            let recRes;
            if (isAppCall && appUserId) {
                // App-to-app — link the callee User entity
                recRes = await api(`/api/calls/${appUserId}`, { method: 'POST' });
            } else {
                // PSTN — store the destination number
                recRes = await api('/api/calls/pstn', {
                    method: 'POST',
                    body: JSON.stringify({ calleeNumber: to })
                });
            }
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

            call.on('accept', () => {
                startActiveCall(label, isAppCall);
                api(`/api/calls/${currentCallRecordId.current}/status?status=ANSWERED`, { method: 'PUT' });
            });
            call.on('disconnect', () => endActiveCall('ENDED'));
            call.on('cancel',     () => endActiveCall('MISSED'));
            call.on('error', (err) => { setCallError(err.message); endActiveCall('MISSED'); });

            startActiveCall(label, isAppCall);
            setActiveTab('dialpad');
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

    /* ── Incoming call ──────────────────────────────────────────── */
    async function acceptCall() {
        const { call, fromName } = incomingCall;
        setIncomingCall(null);
        call.accept();
        currentCall.current = call;
        call.on('disconnect', () => endActiveCall('ENDED'));
        call.on('error',      () => endActiveCall('ENDED'));
        startActiveCall(fromName, false);
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

    /* ── Call history call-back ─────────────────────────────────── */
    function callBack(call) {
        const isCaller = call.caller.id === currentUser.id;

        if (isCaller) {
            if (call.callee) {
                // Was an app-to-app call — try in-app again (callee may be online now)
                const callee = call.callee;
                const contact = contacts.find(c => c.appUsername === callee.username);
                const online  = contact?.appStatus === 'ONLINE' || onlineUsers.some(u => u.id === callee.id);
                dial(callee.phoneNumber || '', callee.displayName,
                     online ? callee.username : null,
                     online ? callee.id        : null);
            } else {
                const num = call.calleeNumber;
                if (num) dial(num, num);
            }
        } else {
            const caller = call.caller;
            const online  = onlineUsers.some(u => u.id === caller.id);
            dial(caller.phoneNumber || '', caller.displayName,
                 online ? caller.username : null,
                 online ? caller.id        : null);
        }
        setActiveTab('dialpad');
    }

    /* ── Status / auth ──────────────────────────────────────────── */
    async function changeStatus(newStatus) {
        setMyStatus(newStatus);
        await api(`/api/users/status?status=${newStatus}`, { method: 'PUT' });
        await loadOnlineUsers();
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
        onCallPstn: c => { dial(c.phoneNumber, c.name); setActiveTab('dialpad'); },
        onCallApp:  (phone, name, username, id) => { dial(phone, name, username, id); setActiveTab('dialpad'); },
        showAddContact, setShowAddContact,
        newContact, setNewContact,
        onAddContact: addContact,
        addContactError,
        onlineUsers,
        currentUserId: currentUser.id,
        userSearch, setUserSearch,
        userResults,
        onSearchUsers: searchUsers
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
        onCallBack: callBack
    };

    const centerPanel = activeCall
        ? <ActiveCallView {...activeCallProps} />
        : <DialpadPanel {...dialpadPanelProps} />;

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

            <div className={bodyClass}>
                <ContactsPanel {...contactsPanelProps} />
                {centerPanel}
                <HistoryPanel {...historyPanelProps} />
            </div>

            {!activeCall && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PhoneApp />);
