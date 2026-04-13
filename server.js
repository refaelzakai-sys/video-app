const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

let waitingUsers = []; // רשימת ממתינים { id, socket, gender }

io.on('connection', (socket) => {
    console.log('משתמש התחבר:', socket.id);

    socket.on('find-partner', (data) => {
        // הסרת המשתמש מרשימות קודמות אם היה
        waitingUsers = waitingUsers.filter(u => u.socket.id !== socket.id);

        // חיפוש שותף (כרגע פשוט הראשון בתור, אפשר להוסיף סינון לפי מגדר)
        if (waitingUsers.length > 0) {
            let partner = waitingUsers.shift();

            // עדכון שני הצדדים שהם מצאו אחד את השני
            socket.emit('partner-found', { peerId: partner.peerId, gender: partner.gender });
            partner.socket.emit('partner-found', { peerId: data.peerId, gender: data.gender });

            // קישור בין הסוקטים לטובת הצ'אט והניתוק
            socket.partnerSocket = partner.socket;
            partner.socket.partnerSocket = socket;

            console.log(`שידוך בוצע: ${socket.id} עם ${partner.socket.id}`);
        } else {
            waitingUsers.push({
                socket: socket,
                peerId: data.peerId,
                gender: data.gender
            });
            console.log('משתמש ממתין לשידוך...');
        }
    });

    // ניהול צ'אט
    socket.on('send-chat-msg', (msg) => {
        if (socket.partnerSocket) {
            socket.partnerSocket.emit('receive-chat-msg', msg);
        }
    });

    // ניתוק יזום או עזיבה
    socket.on('leave-chat', () => {
        disconnectPartner(socket);
    });

    socket.on('disconnect', () => {
        console.log('משתמש התנתק:', socket.id);
        waitingUsers = waitingUsers.filter(u => u.socket.id !== socket.id);
        disconnectPartner(socket);
    });

    function disconnectPartner(s) {
        if (s.partnerSocket) {
            s.partnerSocket.emit('partner-disconnected');
            s.partnerSocket.partnerSocket = null;
            s.partnerSocket = null;
        }
    }
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log(`שרת רץ על פורט ${PORT}`);
});
