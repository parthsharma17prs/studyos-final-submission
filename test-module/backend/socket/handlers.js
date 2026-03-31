export function setupSocketHandlers(io)
{
  io.on('connection', (socket) =>
  {
    socket.on('join-interview', ({interviewId, userName, role}) =>
    {
      socket.join(interviewId);
      socket.to(interviewId).emit('user-joined', {userName, role, userId: socket.id});
    });

    socket.on('leave-interview', ({interviewId}) =>
    {
      socket.leave(interviewId);
      socket.to(interviewId).emit('user-left', {userId: socket.id});
    });

    socket.on('code-update', ({interviewId, code, language}) =>
    {
      socket.to(interviewId).emit('code-update', {code, language, from: socket.id});
    });

    socket.on('proctoring-event', ({interviewId, event}) =>
    {
      socket.to(interviewId).emit('proctoring-alert', {event, timestamp: new Date().toISOString()});
    });
  });
}
