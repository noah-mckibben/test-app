const { useState, useEffect } = React;

function AuthPage() {
    const [tab, setTab] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem('token')) {
            window.location.href = '/app.html';
        }
    }, []);

    async function login() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) throw new Error('Invalid username or password');
            const data = await res.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/app.html';
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function register() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, displayName, phoneNumber })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Registration failed');
            }
            const data = await res.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/app.html';
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyUp(e, action) {
        if (e.key === 'Enter') action();
    }

    return (
        <div className="auth-wrap">
            <div className="auth-box">
                <div className="auth-logo">&#9742;</div>
                <h1>Phone App</h1>
                <div className="tabs">
                    <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(''); }}>
                        Login
                    </button>
                    <button className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); setError(''); }}>
                        Register
                    </button>
                </div>

                {tab === 'login' && (
                    <div className="form">
                        <input
                            value={username} onChange={e => setUsername(e.target.value)}
                            onKeyUp={e => handleKeyUp(e, login)}
                            type="text" placeholder="Username" autoComplete="username"
                        />
                        <input
                            value={password} onChange={e => setPassword(e.target.value)}
                            onKeyUp={e => handleKeyUp(e, login)}
                            type="password" placeholder="Password" autoComplete="current-password"
                        />
                        <button className="btn-primary" onClick={login} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                )}

                {tab === 'register' && (
                    <div className="form">
                        <input
                            value={username} onChange={e => setUsername(e.target.value)}
                            type="text" placeholder="Username" autoComplete="username"
                        />
                        <input
                            value={displayName} onChange={e => setDisplayName(e.target.value)}
                            type="text" placeholder="Display Name" autoComplete="name"
                        />
                        <input
                            value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                            type="tel" placeholder="Phone Number (e.g. 5551234567)" autoComplete="tel"
                        />
                        <input
                            value={password} onChange={e => setPassword(e.target.value)}
                            type="password" placeholder="Password" autoComplete="new-password"
                        />
                        <button className="btn-primary" onClick={register} disabled={loading}>
                            {loading ? 'Registering...' : 'Create Account'}
                        </button>
                    </div>
                )}

                {error && <p className="error-msg">{error}</p>}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AuthPage />);
