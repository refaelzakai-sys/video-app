const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" } // מאפשר חיבור מכל דומיין
});

let waitingUsers = []; 

io.on('connection', (socket) => {
    console.log('משתמש חדש התחבר ל-Socket:', socket.id);

    socket.on('find-partner', (userData) => {
        console.log('משתמש מחפש שידוך:', userData.peerId);

        // מנקה משתמשים שניתקו מהתור לפני שבודקים
        waitingUsers = waitingUsers.filter(u => io.sockets.sockets.has(u.socketId));

        if (waitingUsers.length > 0) {
            // מוציא את הראשון בתור
            const partner = waitingUsers.shift();
            console.log('שידוך נמצא! מחבר בין:', socket.id, 'לבין:', partner.socketId);

            // שולח לכל אחד את ה-PeerID של השני
            io.to(socket.id).emit('partner-found', {
                peerId: partner.peerId,
                gender: partner.gender
            });

            io.to(partner.socketId).emit('partner-found', {
                peerId: userData.peerId,
                gender: userData.gender
            });
        } else {
            // מוסיף את המשתמש הנוכחי לתור
            waitingUsers.push({
                socketId: socket.id,
                peerId: userData.peerId,
                gender: userData.gender
            });
            console.log('אין משתמשים פנויים. נוסף לתור ההמתנה. גודל התור:', waitingUsers.length);
        }
    });

    socket.on('leave-chat', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        console.log('משתמש יצא מהתור');
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        console.log('משתמש התנתק');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`שרת רץ על פורט ${PORT}`));
