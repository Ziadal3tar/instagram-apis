import { Server } from 'socket.io';
let io;
export function init(server) {
    io = new Server(server,  {
        cors: "*"
    });
    return io;
}
export function getIO() {
    if (!io)
        throw Error("not valid IO");
    return io;
}