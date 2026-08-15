import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID || 'dummy_app_id',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy_key',
    secret: process.env.PUSHER_SECRET || 'dummy_secret',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    useTLS: true,
});

export const triggerPusherEvent = async (channel: string, event: string, data: any) => {
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET || !process.env.NEXT_PUBLIC_PUSHER_KEY) {
        return;
    }
    try {
        await pusherServer.trigger(channel, event, data);
    } catch (err) {
        console.error('Failed to trigger Pusher event:', err);
    }
};

let clientInstance: PusherClient | null = null;

export const getPusherClient = () => {
    if (!clientInstance && typeof window !== 'undefined') {
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        if (!key) return null;
        
        clientInstance = new PusherClient(key, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
            authEndpoint: '/api/pusher/auth',
        });
    }
    return clientInstance;
};
