const express = require('express');
const route = express.Router();
const { isAuthenticateuser } = require('../Middelwares/authuser.js');
const {
    createRoom,
    getMyRooms,
    getRoomDetails,
    joinRoom,
    joinRoomAsUser,
    sendInvite,
    shareProduct,
    voteOnProduct,
    reactToProduct,
    closeRoom,
    getRoomInfo,
    resolveProductUrl
} = require('../controller/squadcontroller');

// Auth-required routes
route.post('/create', isAuthenticateuser, createRoom);
route.get('/rooms', isAuthenticateuser, getMyRooms);
route.get('/room/:roomCode', getRoomDetails);
route.post('/invite', isAuthenticateuser, sendInvite);
route.post('/share-product', shareProduct);
route.post('/vote', voteOnProduct);
route.post('/react', reactToProduct);
route.delete('/room/:roomCode', isAuthenticateuser, closeRoom);
route.post('/join-as-user/:roomCode', isAuthenticateuser, joinRoomAsUser);

// Public routes (for guests)
route.post('/join/:roomCode', joinRoom);
route.get('/room-info/:roomCode', getRoomInfo);
route.get('/resolve-product/:productId', resolveProductUrl);

module.exports = route;
