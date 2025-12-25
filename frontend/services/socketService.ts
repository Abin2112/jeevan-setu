import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            this.socket = io(BACKEND_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('[Socket] Connected to backend:', this.socket?.id);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
            });

            // Set up event forwarding
            this.setupEventForwarding();
        });
    }

    private setupEventForwarding() {
        const events = [
            'emergency:created',
            'emergency:driver-assigned',
            'emergency:no-drivers',
            'emergency:cancelled',
            'emergency:new-request',
            'driver:registered',
            'driver:assignment-confirmed',
            'hospital:registered',
            'hospital:incoming-patient'
        ];

        events.forEach(event => {
            this.socket?.on(event, (data) => {
                this.notifyListeners(event, data);
            });
        });
    }

    // ============ LISTENER MANAGEMENT ============
    on(event: string, callback: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    private notifyListeners(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`[Socket] Error in listener for ${event}:`, e);
            }
        });
    }

    // ============ PATIENT ACTIONS ============
    sendSOS(data: { location?: { lat: number; lng: number; address: string }; severity?: string; type?: string }) {
        this.socket?.emit('patient:sos', data);
    }

    cancelEmergency(emergencyId: string) {
        this.socket?.emit('patient:cancel', emergencyId);
    }

    // ============ DRIVER ACTIONS ============
    registerAsDriver(data: { name: string; vehicle: string; location?: { lat: number; lng: number } }) {
        this.socket?.emit('driver:register', data);
    }

    updateDriverLocation(location: { lat: number; lng: number }) {
        this.socket?.emit('driver:update-location', location);
    }

    acceptEmergency(emergencyId: string) {
        this.socket?.emit('driver:accept', emergencyId);
    }

    rejectEmergency(emergencyId: string) {
        this.socket?.emit('driver:reject', emergencyId);
    }

    // ============ HOSPITAL ACTIONS ============
    registerAsHospital(data: { name: string; beds: number; icu: number; location?: { lat: number; lng: number } }) {
        this.socket?.emit('hospital:register', data);
    }

    updateBedAvailability(data: { beds: number; icu: number }) {
        this.socket?.emit('hospital:update-beds', data);
    }

    // ============ UTILITIES ============
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.listeners.clear();
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

// Export a singleton instance
export const socketService = new SocketService();
