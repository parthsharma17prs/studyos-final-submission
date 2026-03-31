import {createServer} from 'http';
import {Server} from 'socket.io';
import {createApp, frontendOrigins} from './app.js';
import {setupSocketHandlers} from './socket/handlers.js';

const app=createApp();
const httpServer=createServer(app);

const io=new Server(httpServer, {
  cors: {origin: frontendOrigins, methods: ['GET', 'POST'], credentials: true},
});
setupSocketHandlers(io);

const PORT=process.env.PORT||5000;
httpServer.listen(PORT, () =>
{
  console.log(`Backend running at http://localhost:${PORT}`);
});
