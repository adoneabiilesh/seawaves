import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { initSocketServer } from '@/lib/socket';

export const config = {
    api: {
        bodyParser: false,
    },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
    if (!(res.socket as any).server.io) {
        console.log('Initializing Socket.io server...');

        const httpServer: HTTPServer = (res.socket as any).server;
        const io = initSocketServer(httpServer);

        (res.socket as any).server.io = io;
    } else {
        console.log('Socket.io already running');
    }

    res.end();
};

export default SocketHandler;

