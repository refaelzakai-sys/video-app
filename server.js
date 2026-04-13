const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

let waitingUsers = []; // רשימת משתמשים שמחכים לשידוך

io.on('connection', (socket) => {
    console.log('משתמש התחבר:', socket.id);

    // כשמשתמש מבקש לחפש מישהו
    socket.on('find-partner', (userData) => {
        if (waitingUsers.length > 0) {
            // יש מישהו שמחכה! נשדך ביניהם
            let partner = waitingUsers.shift();
            
            // שולחים לכל אחד מהם את ה-ID של השני
            io.to(socket.id).emit('partner-found', {
                partnerId: partner.socketId,
                peerId: partner.peerId,
                gender: partner.gender
            });
            
            io.to(partner.socketId).emit('partner-found', {
                partnerId: socket.id,
                peerId: userData.peerId,
                gender: userData.gender
            });
            
            console.log('שידוך בוצע!');
        } else {
            // אין אף אחד, הוסף לתור
            waitingUsers.push({
                socketId: socket.id,
                peerId: userData.peerId,
                gender: userData.gender
            });
            console.log('נוסף לתור ההמתנה');
        }
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Server is running...');
});

