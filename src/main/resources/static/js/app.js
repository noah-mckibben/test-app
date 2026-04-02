const { createApp } = Vue;

createApp({
    data() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return {
            currentUser: user,
            myStatus: user.status || 'ONLINE',
            contacts: [],
            callHistory: [],
            showAddContact: false,
            newContact: { name: '', phoneNumber: '' },
            addContactError: '',
            dialInput: '',
            dialSuggestions: [],
            dialKeys: ['1','2','3','4','5','6','7','8','9','*','0','#'],
            callError: '',
            incomingCall: null,
            activeCall: null,
            currentCall: null,
            twilioDevice: null,
            twilioReady: false,
            callTimerInterval: null,
            callSeconds: 0,
            muted: false,
            currentCallRecordId: null
        };
    },
    computed: {
        callTimer() {
            const m = Math.floor(this.callSeconds / 60).toString().padStart(2, '0');
            const s = (this.callSeconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }
    },
    async mounted() {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/index.html'; return; }
        this.token = token;

        await this.loadContacts();
        await this.loadCallHistory();
        await this.initTwilio();
    },
    beforeUnmount() {
        if (this.twilioDevice) this.twilioDevice.destroy();
        clearInterval(this.callTimerInterval);
    },
    methods: {
        api(path, options = {}) {
            return fetch(path, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
        },

        // ── Twilio ────────────────────────────────────────────────────────
        async initTwilio() {
            try {
                const res = await this.api('/api/twilio/token');
                if (!res.ok) throw new Error('Could not get Twilio token');
                const { token } = await res.json();

                this.twilioDevice = new Twilio.Device(token, {
                    logLevel: 1,
                    codecPreferences: ['opus', 'pcmu'],
                    edge: 'roaming'
                });

                this.twilioDevice.on('registered', () => {
                    this.twilioReady = true;
                });

                this.twilioDevice.on('incoming', (call) => {
                    this.incomingCall = {
                        call,
                        fromName: call.parameters.From || 'Unknown'
                    };
                    call.on('cancel', () => { this.incomingCall = null; });
                });

                this.twilioDevice.on('error', (err) => {
                    console.error('Twilio error:', err.code, err.message, err);
                    this.callError = `Phone error (${err.code}): ${err.message}`;
                });

                await this.twilioDevice.register();
            } catch (e) {
                console.error('Twilio init failed:', e.message);
                this.callError = 'Phone failed to initialize: ' + e.message;
            }
        },

        // ── Contacts ──────────────────────────────────────────────────────
        async loadContacts() {
            const res = await this.api('/api/contacts');
            this.contacts = await res.json();
        },
        async loadCallHistory() {
            const res = await this.api('/api/calls');
            this.callHistory = await res.json();
        },
        async addContact() {
            this.addContactError = '';
            try {
                await this.api('/api/contacts', {
                    method: 'POST',
                    body: JSON.stringify({ name: this.newContact.name, phoneNumber: this.newContact.phoneNumber })
                });
                this.newContact = { name: '', phoneNumber: '' };
                this.showAddContact = false;
                await this.loadContacts();
            } catch (e) {
                this.addContactError = 'Failed to save contact';
            }
        },
        async callByContact(contact) {
            await this._dial(contact.phoneNumber, contact.name);
        },

        // ── Dial pad ─────────────────────────────────────────────────────
        async onDialInput() {
            const query = this.dialInput.trim();
            if (!query || /^[\d\s\+\-\(\)]+$/.test(query)) {
                this.dialSuggestions = [];
                return;
            }
            const res = await this.api(`/api/contacts/search?name=${encodeURIComponent(query)}`);
            this.dialSuggestions = await res.json();
        },
        selectDialContact(contact) {
            this.dialInput = contact.phoneNumber;
            this.dialSuggestions = [];
        },
        async dialCall() {
            const raw = this.dialInput.trim();
            if (!raw) return;
            this.dialInput = '';
            this.dialSuggestions = [];
            await this._dial(raw);
        },

        // ── Core call logic ───────────────────────────────────────────────
        formatNumber(raw) {
            const digits = raw.replace(/\D/g, '');
            if (raw.startsWith('+')) return raw.replace(/\s/g, '');
            if (digits.length === 10) return `+1${digits}`;
            if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
            return raw;
        },

        async _dial(rawNumber, displayName) {
            this.callError = '';
            if (!this.twilioReady) {
                this.callError = 'Phone not ready yet. Please wait.';
                return;
            }
            const to = this.formatNumber(rawNumber);
            const label = displayName || to;

            // Create call record
            const recRes = await this.api('/api/calls/pstn', {
                method: 'POST',
                body: JSON.stringify({ calleeNumber: to })
            });
            const record = await recRes.json();
            this.currentCallRecordId = record.id;

            try {
                this.currentCall = await this.twilioDevice.connect({ params: { To: to } });

                this.currentCall.on('accept', () => {
                    this._startActiveCall(label);
                    this.api(`/api/calls/${this.currentCallRecordId}/status?status=ANSWERED`, { method: 'PUT' });
                });

                this.currentCall.on('disconnect', () => this._endActiveCall('ENDED'));
                this.currentCall.on('cancel', () => this._endActiveCall('MISSED'));
                this.currentCall.on('error', (err) => {
                    this.callError = err.message;
                    this._endActiveCall('MISSED');
                });

                // Show ringing state immediately
                this._startActiveCall(label);
            } catch (e) {
                this.callError = e.message;
                this._endActiveCall('MISSED');
            }
        },

        async acceptCall() {
            const { call, fromName } = this.incomingCall;
            this.incomingCall = null;
            call.accept();
            this.currentCall = call;

            call.on('disconnect', () => this._endActiveCall('ENDED'));
            call.on('error', () => this._endActiveCall('ENDED'));

            this._startActiveCall(fromName);
        },

        rejectCall() {
            this.incomingCall.call.reject();
            this.incomingCall = null;
        },

        async hangUp() {
            if (this.currentCall) {
                this.currentCall.disconnect();
            }
        },

        toggleMute() {
            if (this.currentCall) {
                this.muted = !this.muted;
                this.currentCall.mute(this.muted);
            }
        },

        _startActiveCall(remoteName) {
            this.activeCall = { remoteName };
            if (!this.callTimerInterval) {
                this.callSeconds = 0;
                this.callTimerInterval = setInterval(() => this.callSeconds++, 1000);
            }
        },

        async _endActiveCall(status) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
            this.activeCall = null;
            this.currentCall = null;
            this.muted = false;
            if (this.currentCallRecordId) {
                await this.api(`/api/calls/${this.currentCallRecordId}/status?status=${status}`, { method: 'PUT' });
                this.currentCallRecordId = null;
            }
            await this.loadCallHistory();
        },

        // Call back from history entry
        callBack(call) {
            // If we were the caller, call the callee's number; otherwise call the caller's number
            const isCaller = call.caller.id === this.currentUser.id;
            if (isCaller) {
                // We placed the call — dial the same destination number
                const num = call.calleeNumber || (call.callee && call.callee.phoneNumber);
                if (num) this._dial(num, call.calleeNumber ? call.calleeNumber : call.callee?.displayName);
            } else {
                // We received the call — dial back the caller's number
                const num = call.caller.phoneNumber;
                if (num) this._dial(num, call.caller.displayName);
            }
        },

        // ── Status / auth ─────────────────────────────────────────────────
        async changeStatus() {
            await this.api(`/api/users/status?status=${this.myStatus}`, { method: 'PUT' });
            this.currentUser.status = this.myStatus;
        },
        logout() {
            this.api('/api/users/status?status=OFFLINE', { method: 'PUT' }).finally(() => {
                if (this.twilioDevice) this.twilioDevice.destroy();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/index.html';
            });
        },

        // ── Call history helpers ──────────────────────────────────────────
        calleeDisplay(call) {
            if (call.callee) return call.callee.displayName;
            return call.calleeNumber || 'Unknown';
        },
        callIcon(call) {
            if (call.status === 'MISSED' || call.status === 'REJECTED') return 'missed';
            if (call.caller.id === this.currentUser.id) return 'outgoing';
            return 'answered';
        },
        callIconChar(call) {
            if (call.caller.id === this.currentUser.id) return '↗';
            if (call.status === 'MISSED') return '↙';
            return '↘';
        },
        formatDuration(seconds) {
            if (!seconds) return '';
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        },
        formatTime(isoString) {
            if (!isoString) return '';
            return new Date(isoString).toLocaleString();
        }
    }
}).mount('#app');
