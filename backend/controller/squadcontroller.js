const A = require('../Middelwares/resolveandcatch');
const Errorhandler = require('../utilis/errorhandel');
const { SquadRoom, SquadMessage, SquadGuest } = require('../model/squadmodel');
const Product = require('../model/productmodel');
const User = require('../model/usermodel');
const jwt = require('jsonwebtoken');
const { sendMessage } = require('fast-two-sms');
const crypto = require('crypto');

// Generate a unique room code like "SQUAD-A7X3"
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SQUAD-${code}`;
}

// ── Create a new Squad Room ───────────────────────────────────────
exports.createRoom = A(async (req, res, next) => {
    const { roomName } = req.body;

    if (!roomName || !roomName.trim()) {
        return next(new Errorhandler('Room name is required', 400));
    }

    // Generate unique room code
    let roomCode;
    let exists = true;
    while (exists) {
        roomCode = generateRoomCode();
        exists = await SquadRoom.findOne({ roomCode });
    }

    const hostName = req.user.name || `User-${req.user.phonenumber}`;

    const room = await SquadRoom.create({
        roomCode,
        roomName: roomName.trim(),
        createdBy: req.user._id,
        hostName,
        members: [{
            oderId: req.user._id.toString(),
            displayName: hostName,
            isGuest: false,
            joinedAt: Date.now()
        }]
    });

    res.status(201).json({
        success: true,
        room
    });
});

// ── Get my active rooms ───────────────────────────────────────────
exports.getMyRooms = A(async (req, res, next) => {
    const userId = req.user._id.toString();

    const rooms = await SquadRoom.find({
        isActive: true,
        'members.oderId': userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        rooms
    });
});

// ── Get room details ──────────────────────────────────────────────
exports.getRoomDetails = A(async (req, res, next) => {
    const { roomCode } = req.params;

    const room = await SquadRoom.findOne({ roomCode, isActive: true })
        .populate('sharedProducts.productId');

    if (!room) {
        return next(new Errorhandler('Room not found or has been closed', 404));
    }

    // Get chat messages (last 100)
    const messages = await SquadMessage.find({ roomCode })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate('productId');

    res.status(200).json({
        success: true,
        room,
        messages
    });
});

// ── Guest join room ───────────────────────────────────────────────
exports.joinRoom = A(async (req, res, next) => {
    const { roomCode } = req.params;
    const { displayName } = req.body;

    if (!displayName || !displayName.trim()) {
        return next(new Errorhandler('Display name is required', 400));
    }

    const room = await SquadRoom.findOne({ roomCode, isActive: true });

    if (!room) {
        return next(new Errorhandler('Room not found or has been closed', 404));
    }

    // Check 20-member cap
    if (room.members.length >= 20) {
        return next(new Errorhandler('This room is full. Ask the host to create a new room.', 400));
    }

    // Create guest session
    const guest = await SquadGuest.create({
        displayName: displayName.trim(),
        roomCode
    });

    // Add guest to room members
    room.members.push({
        oderId: guest._id.toString(),
        displayName: displayName.trim(),
        isGuest: true,
        joinedAt: Date.now()
    });
    await room.save();

    // Generate 7-day guest JWT
    const guestToken = jwt.sign(
        {
            guestId: guest._id,
            displayName: displayName.trim(),
            roomCode,
            isGuest: true
        },
        process.env.SECRETID,
        { expiresIn: '7d' }
    );

    // Create system message
    await SquadMessage.create({
        roomCode,
        senderId: guest._id.toString(),
        senderName: displayName.trim(),
        senderType: 'guest',
        messageType: 'system',
        content: `${displayName.trim()} joined the room`
    });

    res.status(200).json({
        success: true,
        guestToken,
        guest,
        room
    });
});

// ── Logged-in user join room ──────────────────────────────────────
exports.joinRoomAsUser = A(async (req, res, next) => {
    const { roomCode } = req.params;
    const userId = req.user._id.toString();
    const displayName = req.user.name || `User-${req.user.phonenumber}`;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });

    if (!room) {
        return next(new Errorhandler('Room not found or has been closed', 404));
    }

    // Check if already a member
    const alreadyMember = room.members.find(m => m.oderId === userId);
    if (alreadyMember) {
        return res.status(200).json({
            success: true,
            room,
            message: 'Already a member'
        });
    }

    // Check 20-member cap
    if (room.members.length >= 20) {
        return next(new Errorhandler('This room is full. Ask the host to create a new room.', 400));
    }

    // Add user to room members
    room.members.push({
        oderId: userId,
        displayName,
        isGuest: false,
        joinedAt: Date.now()
    });
    await room.save();

    // Create system message
    await SquadMessage.create({
        roomCode,
        senderId: userId,
        senderName: displayName,
        senderType: 'user',
        messageType: 'system',
        content: `${displayName} joined the room`
    });

    res.status(200).json({
        success: true,
        room
    });
});

// ── Send invite SMS ───────────────────────────────────────────────
exports.sendInvite = A(async (req, res, next) => {
    const { roomCode, phone, frontendBaseUrl } = req.body;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });
    if (!room) {
        return next(new Errorhandler('Room not found', 404));
    }

    const base = frontendBaseUrl || `${req.protocol}://${req.get('host')}`;
    const inviteLink = `${base}/squad/join/${roomCode}`;

    // Record invite
    room.invites.push({ phone, invitedAt: Date.now() });
    await room.save();

    const smsMessage = `You've been invited to join "${room.roomName}" on Myntra Squad! Join here: ${inviteLink}`;

    let options = {
        authorization: process.env.YOUR_API_KEY,
        message: smsMessage,
        numbers: [phone]
    };

    try {
        const response = await sendMessage(options);
        if (response.return === true) {
            res.status(200).json({
                success: true,
                message: `Invite sent to ${phone}`,
                inviteLink
            });
        } else {
            console.log(`📱 Squad invite for ${phone}: ${inviteLink}`);
            res.status(200).json({
                success: true,
                message: `Invite link generated (SMS service unavailable)`,
                inviteLink
            });
        }
    } catch (error) {
        console.log(`📱 Squad invite for ${phone}: ${inviteLink}`);
        res.status(200).json({
            success: true,
            message: `Invite link generated (SMS service unavailable)`,
            inviteLink
        });
    }
});

// ── Share a product ───────────────────────────────────────────────
exports.shareProduct = A(async (req, res, next) => {
    const { roomCode, productId, sharedBy, sharedByName } = req.body;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });
    if (!room) {
        return next(new Errorhandler('Room not found', 404));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new Errorhandler('Product not found', 404));
    }

    // Add to shared products
    room.sharedProducts.push({
        productId,
        sharedBy,
        sharedByName,
        sharedAt: Date.now(),
        votes: [],
        reactions: []
    });
    await room.save();

    // Create product share message
    const message = await SquadMessage.create({
        roomCode,
        senderId: sharedBy,
        senderName: sharedByName,
        senderType: req.body.senderType || 'user',
        messageType: 'product_share',
        content: `Shared ${product.brand} - ${product.title}`,
        productId
    });

    const populatedMessage = await SquadMessage.findById(message._id).populate('productId');

    res.status(200).json({
        success: true,
        message: populatedMessage,
        product
    });
});

// ── Vote on a shared product ──────────────────────────────────────
exports.voteOnProduct = A(async (req, res, next) => {
    const { roomCode, productId, oderId, voterName, vote } = req.body;

    if (!['buy', 'bye'].includes(vote)) {
        return next(new Errorhandler('Vote must be "buy" or "bye"', 400));
    }

    const room = await SquadRoom.findOne({ roomCode, isActive: true });
    if (!room) {
        return next(new Errorhandler('Room not found', 404));
    }

    const sharedProduct = room.sharedProducts.find(
        sp => sp.productId.toString() === productId
    );

    if (!sharedProduct) {
        return next(new Errorhandler('Product not found in this room', 404));
    }

    // Remove existing vote by this user (so they can change their vote)
    sharedProduct.votes = sharedProduct.votes.filter(v => v.oderId !== oderId);

    // Add new vote
    sharedProduct.votes.push({ oderId, voterName, vote });
    await room.save();

    res.status(200).json({
        success: true,
        votes: sharedProduct.votes
    });
});

// ── React to a shared product ─────────────────────────────────────
exports.reactToProduct = A(async (req, res, next) => {
    const { roomCode, productId, oderId, emoji } = req.body;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });
    if (!room) {
        return next(new Errorhandler('Room not found', 404));
    }

    const sharedProduct = room.sharedProducts.find(
        sp => sp.productId.toString() === productId
    );

    if (!sharedProduct) {
        return next(new Errorhandler('Product not found in this room', 404));
    }

    // Toggle reaction: remove if same emoji exists, add otherwise
    const existingIdx = sharedProduct.reactions.findIndex(
        r => r.oderId === oderId && r.emoji === emoji
    );

    if (existingIdx > -1) {
        sharedProduct.reactions.splice(existingIdx, 1);
    } else {
        sharedProduct.reactions.push({ oderId, emoji });
    }
    await room.save();

    res.status(200).json({
        success: true,
        reactions: sharedProduct.reactions
    });
});

// ── Close room (host only) ───────────────────────────────────────
exports.closeRoom = A(async (req, res, next) => {
    const { roomCode } = req.params;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });
    if (!room) {
        return next(new Errorhandler('Room not found', 404));
    }

    // Only host can close the room
    if (room.createdBy.toString() !== req.user._id.toString()) {
        return next(new Errorhandler('Only the host can close this room', 403));
    }

    room.isActive = false;
    await room.save();

    // Create system message
    await SquadMessage.create({
        roomCode,
        senderId: req.user._id.toString(),
        senderName: room.hostName,
        senderType: 'user',
        messageType: 'system',
        content: 'Room has been closed by the host'
    });

    res.status(200).json({
        success: true,
        message: 'Room closed successfully'
    });
});

// ── Get room info for guest join page (no auth needed) ────────────
exports.getRoomInfo = A(async (req, res, next) => {
    const { roomCode } = req.params;

    const room = await SquadRoom.findOne({ roomCode, isActive: true });

    if (!room) {
        return next(new Errorhandler('Room not found or has been closed', 404));
    }

    res.status(200).json({
        success: true,
        roomName: room.roomName,
        hostName: room.hostName,
        memberCount: room.members.length,
        maxMembers: 20,
        isFull: room.members.length >= 20
    });
});

// ── Resolve product URL ───────────────────────────────────────────
exports.resolveProductUrl = A(async (req, res, next) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new Errorhandler('Product not found', 404));
    }

    res.status(200).json({
        success: true,
        product
    });
});
