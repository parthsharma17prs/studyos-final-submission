import {io} from 'socket.io-client';

const SOCKET_URL=import.meta.env.VITE_API_URL||(import.meta.env.DEV ? 'http://localhost:5002' : '');
let socket;

const socketService={
  connect()
  {
    if (!socket)
    {
      socket=io(SOCKET_URL);
    }
    return socket;
  },
  joinInterview(interviewId, userName, role)
  {
    if (socket) socket.emit('join-interview', {interviewId, userName, role});
  },
  sendCodeUpdate(interviewId, code, language)
  {
    if (socket) socket.emit('code-update', {interviewId, code, language});
  },
  sendProctoringEvent(interviewId, event)
  {
    if (socket) socket.emit('proctoring-event', {interviewId, event});
  },
  leaveInterview(interviewId)
  {
    if (socket) socket.emit('leave-interview', {interviewId});
  },
};

export default socketService;
