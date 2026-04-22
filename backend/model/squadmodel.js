const mongoose = require('mongoose');

// ── SquadGuest Schema ──────────────────────────────────────────────
const squadGuestSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [30, 'Display name cannot exceed 30 characters']
    },
    roomCode: {
        type: String,
        required: true,
        index: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const SquadGuest = mongoose.model('SquadGuest', squadGuestSchema);

// ── SquadMessage Schema ────────────────────────────────────────────
const squadMessageSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderType: {
        type: String,
        enum: ['user', 'guest'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'product_share', 'system', 'try_on_share'],
        default: 'text'
    },
    content: {
        type: String,
        default: ''
    },
    tryOnImageUrl: {
        type: String,
        default: ''
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'myntraproduct'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

squadMessageSchema.index({ roomCode: 1, createdAt: 1 });

const SquadMessage = mongoose.model('SquadMessage', squadMessageSchema);

// ── SquadRoom Schema ───────────────────────────────────────────────
const squadRoomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    roomName: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: [50, 'Room name cannot exceed 50 characters']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MynUser',
        required: true
    },
    hostName: {
        type: String,
        required: true
    },
    members: [{
        oderId: {
            type: String,
            required: true
        },
        displayName: {
            type: String,
            required: true
        },
        isGuest: {
            type: Boolean,
            default: false
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    invites: [{
        phone: {
            type: String,
            required: true
        },
        invitedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'myntraproduct',
            required: true
        },
        sharedBy: {
            type: String,
            required: true
        },
        sharedByName: {
            type: String,
            required: true
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        votes: [{
            oderId: {
                type: String,
                required: true
            },
            voterName: {
                type: String,
                required: true
            },
            vote: {
                type: String,
                enum: ['buy', 'bye'],
                required: true
            }
        }],
        reactions: [{
            oderId: {
                type: String,
                required: true
            },
            emoji: {
                type: String,
                required: true
            }
        }]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SquadRoom = mongoose.model('SquadRoom', squadRoomSchema);

module.exports = { SquadRoom, SquadMessage, SquadGuest };
