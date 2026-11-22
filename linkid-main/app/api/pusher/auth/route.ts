import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const data = await req.text();
        const params = new URLSearchParams(data);
        const socketId = params.get('socket_id');
        const channelName = params.get('channel_name');

        if (!socketId || !channelName) {
            return new NextResponse('Missing socket_id or channel_name', { status: 400 });
        }

        // Ensure users can only subscribe to their own private channel
        if (channelName !== `private-user-${session.user.id}`) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const authResponse = pusherServer.authorizeChannel(socketId, channelName);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error('Pusher auth error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
