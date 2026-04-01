class Signaling {
    constructor(token) {
        this.token = token;
        this.ws = null;
        this.handlers = {};
    }

    connect() {
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        this.ws = new WebSocket(`${proto}://${location.host}/ws/signal?token=${this.token}`);

        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const handler = this.handlers[msg.type];
            if (handler) handler(msg);
        };

        this.ws.onclose = () => {
            console.log('Signaling disconnected');
        };
    }

    on(type, handler) {
        this.handlers[type] = handler;
    }

    send(type, to, payload = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, to, payload }));
        }
    }

    disconnect() {
        if (this.ws) this.ws.close();
    }
}
