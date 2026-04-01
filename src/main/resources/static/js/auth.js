const { createApp } = Vue;

createApp({
    data() {
        return {
            tab: 'login',
            username: '',
            password: '',
            displayName: '',
            phoneNumber: '',
            loading: false,
            error: ''
        };
    },
    mounted() {
        if (localStorage.getItem('token')) {
            window.location.href = '/app.html';
        }
    },
    methods: {
        async login() {
            this.loading = true;
            this.error = '';
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: this.username, password: this.password })
                });
                if (!res.ok) throw new Error('Invalid username or password');
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/app.html';
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },
        async register() {
            this.loading = true;
            this.error = '';
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: this.username, password: this.password, displayName: this.displayName, phoneNumber: this.phoneNumber })
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
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        }
    }
}).mount('#app');
