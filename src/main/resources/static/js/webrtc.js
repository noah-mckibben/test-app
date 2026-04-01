const STUN_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

class WebRTCClient {
    constructor(signaling, onRemoteStream, onCallEnded) {
        this.signaling = signaling;
        this.onRemoteStream = onRemoteStream;
        this.onCallEnded = onCallEnded;
        this.pc = null;
        this.localStream = null;

        signaling.on('offer', (msg) => this._handleOffer(msg));
        signaling.on('answer', (msg) => this._handleAnswer(msg));
        signaling.on('ice-candidate', (msg) => this._handleIceCandidate(msg));
        signaling.on('hang-up', () => { this.hangUp(); this.onCallEnded(); });
    }

    async startCall(remoteUserId) {
        this.remoteUserId = remoteUserId;
        await this._setupPeerConnection();
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.signaling.send('offer', remoteUserId, offer);
    }

    async _handleOffer(msg) {
        this.remoteUserId = msg.from;
        await this._setupPeerConnection();
        await this.pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.signaling.send('answer', msg.from, answer);
    }

    async _handleAnswer(msg) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
    }

    async _handleIceCandidate(msg) {
        if (msg.payload) {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.payload));
        }
    }

    async _setupPeerConnection() {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.pc = new RTCPeerConnection(STUN_SERVERS);

        this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));

        this.pc.onicecandidate = (event) => {
            this.signaling.send('ice-candidate', this.remoteUserId, event.candidate);
        };

        this.pc.ontrack = (event) => {
            this.onRemoteStream(event.streams[0]);
        };
    }

    toggleMute() {
        if (this.localStream) {
            const track = this.localStream.getAudioTracks()[0];
            if (track) track.enabled = !track.enabled;
            return !track?.enabled;
        }
        return false;
    }

    hangUp() {
        if (this.pc) { this.pc.close(); this.pc = null; }
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
    }
}
