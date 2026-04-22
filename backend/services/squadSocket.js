const jwt = require('jsonwebtoken');
const { SquadRoom, SquadMessage, SquadGuest } = require('../model/squadmodel');
const cookie = require('cookie');

function initSquadSocket(io) {
    const squadNamespace = io.of('/squad');

    squadNamespace.use(async (socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers.cookie || '');
            const token = socket.handshake.auth.token || cookies.token;
            const guestToken = socket.handshake.auth.guestToken;

            if (token) {
                // Logged-in user
                const decoded = jwt.verify(token, process.env.SECRETID);
                socket.userId = decoded.id;
                socket.isGuest = false;
                socket.displayName = socket.handshake.auth.displayName || 'User';
                next();
            } else if (guestToken) {
                // Guest user
                const decoded = jwt.verify(guestToken, process.env.SECRETID);
                socket.userId = decoded.guestId;
                socket.isGuest = true;
                socket.displayName = decoded.displayName;
                socket.roomCode = decoded.roomCode;
                next();
            } else {
                next(new Error('Authentication required'));
            }
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    squadNamespace.on('connection', (socket) => {
        console.log(`Squad: ${socket.displayName} connected (${socket.isGuest ? 'guest' : 'user'})`);

        // ── Join a room ──────────────────────────────────────────
        socket.on('squad:join-room', async (roomCode) => {
            try {
                const room = await SquadRoom.findOne({ roomCode, isActive: true });
                if (!room) {
                    socket.emit('squad:error', { message: 'Room not found or closed' });
                    return;
                }

                socket.join(roomCode);
                socket.currentRoom = roomCode;

                // Update guest lastActiveAt
                if (socket.isGuest) {
                    await SquadGuest.findByIdAndUpdate(socket.userId, {
                        lastActiveAt: Date.now()
                    });
                }

                // Broadcast member joined
                squadNamespace.to(roomCode).emit('squad:member-joined', {
                    oderId: socket.userId,
                    displayName: socket.displayName,
                    isGuest: socket.isGuest
                });

                // Send current online members
                const roomSockets = await squadNamespace.in(roomCode).fetchSockets();
                const onlineMembers = roomSockets.map(s => ({
                    oderId: s.userId,
                    displayName: s.displayName,
                    isGuest: s.isGuest
                }));
                socket.emit('squad:online-members', onlineMembers);

            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('squad:error', { message: 'Failed to join room' });
            }
        });

        // ── Send a chat message ──────────────────────────────────
        socket.on('squad:message', async (data) => {
            try {
                const { roomCode, content } = data;

                const message = await SquadMessage.create({
                    roomCode,
                    senderId: socket.userId,
                    senderName: socket.displayName,
                    senderType: socket.isGuest ? 'guest' : 'user',
                    messageType: 'text',
                    content
                });

                squadNamespace.to(roomCode).emit('squad:message', {
                    _id: message._id,
                    roomCode,
                    senderId: socket.userId,
                    senderName: socket.displayName,
                    senderType: socket.isGuest ? 'guest' : 'user',
                    messageType: 'text',
                    content,
                    createdAt: message.createdAt
                });
            } catch (error) {
                console.error('Message error:', error);
                socket.emit('squad:error', { message: 'Failed to send message' });
            }
        });

        // ── Typing indicator ─────────────────────────────────────
        socket.on('squad:typing', (roomCode) => {
            socket.to(roomCode).emit('squad:typing', {
                oderId: socket.userId,
                displayName: socket.displayName
            });
        });

        socket.on('squad:stop-typing', (roomCode) => {
            socket.to(roomCode).emit('squad:stop-typing', {
                oderId: socket.userId
            });
        });

        // ── Product shared ───────────────────────────────────────
        socket.on('squad:product-shared', async (data) => {
            try {
                const { roomCode, product, message } = data;
                squadNamespace.to(roomCode).emit('squad:product-shared', {
                    product,
                    message,
                    sharedBy: socket.displayName
                });
            } catch (error) {
                console.error('Product share error:', error);
            }
        });

        // ── Vote update ──────────────────────────────────────────
        socket.on('squad:vote', (data) => {
            const { roomCode, productId, votes } = data;
            squadNamespace.to(roomCode).emit('squad:vote-update', {
                productId,
                votes
            });
        });

        // ── Reaction update ──────────────────────────────────────
        socket.on('squad:reaction', (data) => {
            const { roomCode, productId, reactions } = data;
            squadNamespace.to(roomCode).emit('squad:reaction-update', {
                productId,
                reactions
            });
        });

        // ── Room closed by host ──────────────────────────────────
        socket.on('squad:close-room', (roomCode) => {
            squadNamespace.to(roomCode).emit('squad:room-closed', {
                message: 'Room has been closed by the host'
            });
        });

        // ── Disconnect ───────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`Squad: ${socket.displayName} disconnected`);
            if (socket.currentRoom) {
                squadNamespace.to(socket.currentRoom).emit('squad:member-left', {
                    oderId: socket.userId,
                    displayName: socket.displayName
                });
            }
        });
    });

    return squadNamespace;
}

module.exports = initSquadSocket;
