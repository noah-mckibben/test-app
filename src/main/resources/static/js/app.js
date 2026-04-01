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
            dialSuggestions: [],
            selectedContact: null,
            incomingCall: null,
            activeCall: null,
            callTimerInterval: null,
            callSeconds: 0,
            muted: false,
            dialInput: '',
            dialKeys: ['1','2','3','4','5','6','7','8','9','*','0','#'],
            callError: '',
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
        this.signaling = new Signaling(token);
        this.signaling.connect();
        this.signaling.on('call-request', (msg) => this._onIncomingCall(msg));
        this.signaling.on('call-accept', (msg) => this._onCallAccepted(msg));
        this.signaling.on('call-reject', () => this._onCallRejected());
        this.signaling.on('hang-up', () => this._onRemoteHangUp());

        this.webrtc = new WebRTCClient(
            this.signaling,
            (stream) => { this.$refs.remoteAudio.srcObject = stream; },
            () => this._endActiveCall('ENDED')
        );

        await this.loadContacts();
        await this.loadCallHistory();
    },
    beforeUnmount() {
        this.signaling?.disconnect();
        clearInterval(this.callTimerInterval);
    },
    methods: {
        api(path, options = {}) {
            return fetch(path, {
                ...options,
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
            });
        },
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
            this.callError = '';
            const res = await this.api(`/api/users/phone/${encodeURIComponent(contact.phoneNumber)}`);
            if (!res.ok) { this.callError = `${contact.name} is not on the app`; return; }
            const user = await res.json();
            this._initiateCall(user, contact.name);
        },
        async onDialInput() {
            const query = this.dialInput.trim();
            if (!query || /^\d+$/.test(query)) { this.dialSuggestions = []; return; }
            const res = await this.api(`/api/contacts/search?name=${encodeURIComponent(query)}`);
            this.dialSuggestions = await res.json();
        },
        selectDialContact(contact) {
            this.dialInput = contact.phoneNumber;
            this.dialSuggestions = [];
        },
        async dialCall() {
            const number = this.dialInput.trim();
            this.callError = '';
            if (!number) return;
            const res = await this.api(`/api/users/phone/${encodeURIComponent(number)}`);
            if (!res.ok) { this.callError = 'No user found with that number'; return; }
            const user = await res.json();
            this.dialInput = '';
            this._initiateCall(user, user.displayName);
        },
        async _initiateCall(target, displayName) {
            const res = await this.api(`/api/calls/${target.id}`, { method: 'POST' });
            const record = await res.json();
            this.currentCallRecordId = record.id;
            this.pendingRemoteName = displayName || target.displayName;
            this.signaling.send('call-request', target.id, { fromName: this.currentUser.displayName, callRecordId: record.id });
        },
        _onIncomingCall(msg) {
            this.incomingCall = { fromId: msg.from, fromName: msg.payload?.fromName || 'Unknown', callRecordId: msg.payload?.callRecordId };
        },
        async acceptCall() {
            const { fromId, callRecordId } = this.incomingCall;
            this.currentCallRecordId = callRecordId;
            this.incomingCall = null;
            this.signaling.send('call-accept', fromId);
            await this.api(`/api/calls/${callRecordId}/status?status=ANSWERED`, { method: 'PUT' });
            await this.webrtc.startCall(fromId);
            this._startActiveCall({ id: fromId, displayName: this.contacts.find(c => c.contact.id === fromId)?.contact.displayName || 'Unknown' });
        },
        rejectCall() {
            this.signaling.send('call-reject', this.incomingCall.fromId);
            if (this.incomingCall.callRecordId) {
                this.api(`/api/calls/${this.incomingCall.callRecordId}/status?status=REJECTED`, { method: 'PUT' });
            }
            this.incomingCall = null;
        },
        async _onCallAccepted(msg) {
            await this.webrtc.startCall(msg.from);
            await this.api(`/api/calls/${this.currentCallRecordId}/status?status=ANSWERED`, { method: 'PUT' });
            this._startActiveCall({ id: msg.from, displayName: this.pendingRemoteName || 'Unknown' });
        },
        _onCallRejected() {
            if (this.currentCallRecordId) {
                this.api(`/api/calls/${this.currentCallRecordId}/status?status=REJECTED`, { method: 'PUT' });
            }
            alert('Call rejected');
            this.currentCallRecordId = null;
        },
        _onRemoteHangUp() {
            this._endActiveCall('ENDED');
        },
        _startActiveCall(contact) {
            this.activeCall = { remoteId: contact.id, remoteName: contact.displayName };
            this.callSeconds = 0;
            this.callTimerInterval = setInterval(() => this.callSeconds++, 1000);
        },
        async hangUp() {
            this.signaling.send('hang-up', this.activeCall.remoteId);
            this.webrtc.hangUp();
            await this._endActiveCall('ENDED');
        },
        async _endActiveCall(status) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
            if (this.currentCallRecordId) {
                await this.api(`/api/calls/${this.currentCallRecordId}/status?status=${status}`, { method: 'PUT' });
                this.currentCallRecordId = null;
            }
            this.activeCall = null;
            this.muted = false;
            await this.loadCallHistory();
        },
        toggleMute() {
            this.muted = this.webrtc.toggleMute();
        },
        async changeStatus() {
            await this.api(`/api/users/status?status=${this.myStatus}`, { method: 'PUT' });
            this.currentUser.status = this.myStatus;
        },
        logout() {
            this.api('/api/users/status?status=OFFLINE', { method: 'PUT' }).finally(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/index.html';
            });
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
