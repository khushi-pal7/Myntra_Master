import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getSquadRoomDetails, shareSquadProduct, closeSquadRoom, resolveProductUrl, ADD_SQUAD_MESSAGE, UPDATE_SQUAD_VOTES, UPDATE_SQUAD_REACTIONS } from '../../action/squadaction';
import SquadMessage from './SquadMessage';
import SquadProductCard from './SquadProductCard';
import SquadInviteModal from './SquadInviteModal';
import SquadSignupPrompt from './SquadSignupPrompt';
import SquadSelector from './SquadSelector';

const SquadRoom = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { roomCode } = useParams();

    const { isAuthentication, user } = useSelector(state => state.user);
    const { room, messages, loading } = useSelector(state => state.squadRoomDetails);

    const [messageInput, setMessageInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    // Socket instance for real-time syncing
    useEffect(() => {
        if (socket) {
            window.squadSocket = socket;
        }
        return () => {
            delete window.squadSocket;
        };
    }, [socket]);
    const [onlineMembers, setOnlineMembers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showInvite, setShowInvite] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [showAttach, setShowAttach] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Determine if current user is a guest
    const guestToken = localStorage.getItem(`squad_guest_${roomCode}`);
    const guestName = localStorage.getItem(`squad_guest_name_${roomCode}`);
    const guestId = localStorage.getItem('squad_guest_id_global') || localStorage.getItem(`squad_guest_id_${roomCode}`);
    const isGuest = !isAuthentication && !!guestToken;

    const currentUserId = isGuest ? guestId : user?._id;
    const currentUserName = isGuest ? guestName : (user?.name || `User-${user?.phonenumber}`);
    const isHost = room && user && room.createdBy?.toString() === user._id?.toString();

    // Fetch room details
    useEffect(() => {
        if (roomCode) {
            dispatch(getSquadRoomDetails(roomCode));
        }
    }, [dispatch, roomCode]);

    // Socket.IO connection
    useEffect(() => {
        if (!roomCode || (!isAuthentication && !guestToken)) return;

        const socketUrl = process.env.REACT_APP_API_URL 
            ? `${process.env.REACT_APP_API_URL}/squad`
            : window.location.hostname === 'localhost'
                ? 'http://localhost:4000/squad'
                : '/squad';

        const authPayload = isGuest
            ? { guestToken, displayName: guestName }
            : { token: document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1'), displayName: currentUserName };

        const newSocket = io(socketUrl, {
            auth: authPayload,
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        newSocket.on('connect', () => {
            setConnected(true);
            newSocket.emit('squad:join-room', roomCode);
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        newSocket.on('squad:message', (msg) => {
            dispatch({ type: ADD_SQUAD_MESSAGE, payload: msg });
        });

        newSocket.on('squad:online-members', (members) => {
            setOnlineMembers(members);
        });

        newSocket.on('squad:member-joined', (member) => {
            setOnlineMembers(prev => {
                if (prev.find(m => m.oderId === member.oderId)) return prev;
                return [...prev, member];
            });
        });

        newSocket.on('squad:member-left', (member) => {
            setOnlineMembers(prev => prev.filter(m => m.oderId !== member.oderId));
        });

        newSocket.on('squad:typing', (data) => {
            setTypingUsers(prev => {
                if (prev.find(u => u.oderId === data.oderId)) return prev;
                return [...prev, data];
            });
        });

        newSocket.on('squad:stop-typing', (data) => {
            setTypingUsers(prev => prev.filter(u => u.oderId !== data.oderId));
        });

        newSocket.on('squad:product-shared', (data) => {
            dispatch(getSquadRoomDetails(roomCode));
        });

        newSocket.on('squad:vote-update', (data) => {
            dispatch({ type: UPDATE_SQUAD_VOTES, payload: data });
        });

        newSocket.on('squad:reaction-update', (data) => {
            dispatch({ type: UPDATE_SQUAD_REACTIONS, payload: data });
        });

        newSocket.on('squad:room-closed', () => {
            setRoomClosed(true);
        });

        newSocket.on('squad:error', (data) => {
            console.error('Squad socket error:', data.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [roomCode, isAuthentication, guestToken, guestName, currentUserName, isGuest, dispatch]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Detect product URL in message
    const detectProductUrl = (text) => {
        const patterns = [
            /\/products\/([a-f0-9]{24})/i,
            /products\/([a-f0-9]{24})/i
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket) return;

        const text = messageInput.trim();
        setMessageInput('');

        // Check if message contains a product URL
        const productId = detectProductUrl(text);
        if (productId) {
            // Auto-share as product card
            const product = await resolveProductUrl(productId);
            if (product) {
                dispatch(shareSquadProduct(
                    roomCode, productId, currentUserId, currentUserName,
                    isGuest ? 'guest' : 'user'
                ));
                socket.emit('squad:product-shared', { roomCode, product });
                return;
            }
        }

        // Regular text message
        socket.emit('squad:message', { roomCode, content: text });

        // Stop typing
        socket.emit('squad:stop-typing', roomCode);
    };

    // Handle typing
    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        if (socket) {
            socket.emit('squad:typing', roomCode);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('squad:stop-typing', roomCode);
            }, 2000);
        }
    };

    // Share product from attach panel
    const handleShareProduct = (product) => {
        dispatch(shareSquadProduct(
            roomCode, product._id, currentUserId, currentUserName,
            isGuest ? 'guest' : 'user'
        ));
        if (socket) {
            socket.emit('squad:product-shared', { roomCode, product });
        }
        setShowAttach(false);
    };

    // Close room
    const handleCloseRoom = () => {
        if (window.confirm('Are you sure you want to close this room? All members will be disconnected.')) {
            dispatch(closeSquadRoom(roomCode));
            if (socket) {
                socket.emit('squad:close-room', roomCode);
            }
            navigate('/squad');
        }
    };

    // Copy room code
    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            alert('Room code copied!');
        });
    };

    if (loading) {
        return (
            <div className="squad-loading" style={{ height: 'calc(100vh - 80px)' }}>
                <div className="squad-spinner"></div>
            </div>
        );
    }

    if (!room && !loading) {
        return (
            <div className="squad-join-page">
                <div className="squad-join-card">
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>😕</span>
                    <h1 style={{ fontSize: '20px' }}>Room Not Found</h1>
                    <p className="squad-join-members">This room may have been closed or doesn't exist.</p>
                    <button className="squad-join-btn" onClick={() => navigate('/squad')}>
                        Back to Squad
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="squad-room" style={{ position: 'relative' }}>
            {roomClosed && (
                <div className="squad-room-closed">
                    <h2>Room Closed</h2>
                    <p>This room has been closed by the host.</p>
                    <button className="squad-btn-primary" onClick={() => navigate('/squad')}>
                        Back to Squad
                    </button>
                </div>
            )}

            {/* Chat Panel */}
            <div className="squad-chat-panel">
                {/* Header */}
                <div className="squad-room-header">
                    <div className="squad-room-header-left">
                        <h2>{room.roomName}</h2>
                        <span className="squad-room-header-code" onClick={copyRoomCode} title="Click to copy">
                            {room.roomCode}
                        </span>
                        <span className="squad-member-count">
                            {room.members?.length || 0}/20 members
                        </span>
                    </div>
                    <div className="squad-room-header-actions">
                        {!isGuest && (
                            <button className="squad-btn-outline" onClick={() => setShowInvite(true)}>
                                + Invite
                            </button>
                        )}
                        {isHost && (
                            <button
                                className="squad-btn-outline"
                                style={{ color: '#e6355f', borderColor: '#e6355f' }}
                                onClick={handleCloseRoom}
                            >
                                Close Room
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="squad-messages">
                    {messages && messages.map((msg, idx) => {
                        if (msg.messageType === 'product_share' || msg.messageType === 'try_on_share') {
                            // Find the shared product data
                            const sp = room.sharedProducts?.find(
                                s => s.productId?._id === msg.productId || s.productId === msg.productId
                            );
                            if (sp) {
                                return (
                                    <div key={msg._id || idx} className={`squad-message-wrapper ${msg.senderId === currentUserId ? 'own' : 'other'}`}>
                                        {msg.senderId !== currentUserId && (
                                            <div className="squad-message-sender">
                                                {msg.senderName} {msg.messageType === 'try_on_share' ? 'tried on a product' : 'shared a product'}
                                            </div>
                                        )}
                                        {msg.senderId === currentUserId && (
                                            <div className="squad-message-sender" style={{ textAlign: 'right' }}>
                                                {msg.messageType === 'try_on_share' ? 'You tried on a product' : 'You shared a product'}
                                            </div>
                                        )}
                                        <SquadProductCard
                                            sharedProduct={sp}
                                            roomCode={roomCode}
                                            currentUserId={currentUserId}
                                            currentUserName={currentUserName}
                                            isGuest={isGuest}
                                            onAddToCart={() => setShowSignup(true)}
                                            tryOnImageUrl={msg.tryOnImageUrl}
                                        />
                                    </div>
                                );
                            }
                        }
                        return (
                            <SquadMessage
                                key={msg._id || idx}
                                msg={msg}
                                currentUserId={currentUserId}
                            />
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                <div className="squad-typing-indicator">
                    {typingUsers.filter(u => u.oderId !== currentUserId).length > 0 && (
                        <span>
                            {typingUsers.filter(u => u.oderId !== currentUserId).map(u => u.displayName).join(', ')} 
                            {' '}typing...
                        </span>
                    )}
                </div>

                {/* Selector Panel */}
                {showAttach && !isGuest && (
                    <SquadSelector
                        onShareProduct={handleShareProduct}
                        onClose={() => setShowAttach(false)}
                        socket={socket}
                    />
                )}

                {/* Chat Input */}
                <form className="squad-chat-input-wrapper" onSubmit={handleSendMessage}>
                    {!isGuest && (
                        <button
                            type="button"
                            className="squad-attach-btn"
                            onClick={() => setShowAttach(!showAttach)}
                            title="Share from Wishlist or Cart"
                        >
                            📎
                        </button>
                    )}
                    <input
                        type="text"
                        className="squad-chat-input"
                        placeholder={isGuest ? "Type a message or paste a product URL..." : "Type a message, paste a product URL, or attach from wishlist..."}
                        value={messageInput}
                        onChange={handleTyping}
                    />
                    <button type="submit" className="squad-send-btn" disabled={!messageInput.trim()}>
                        ➤
                    </button>
                </form>
            </div>

            {/* Sidebar */}
            <div className="squad-sidebar">
                {/* Members */}
                <div className="squad-sidebar-section">
                    <h3>Members ({room.members?.length || 0}/20)</h3>
                    {room.members?.map((member, idx) => {
                        const isOnline = onlineMembers.some(m => m.oderId === member.oderId);
                        return (
                            <div key={idx} className="squad-member-item">
                                <div className={`squad-member-avatar ${member.isGuest ? 'guest' : ''}`}>
                                    {member.displayName?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="squad-member-name">{member.displayName}</span>
                                {member.oderId === room.createdBy?.toString() && (
                                    <span className="squad-badge-host">Host</span>
                                )}
                                {member.isGuest && member.oderId !== room.createdBy?.toString() && (
                                    <span className="squad-badge-guest">Guest</span>
                                )}
                                {isOnline && <span className="squad-online-dot"></span>}
                            </div>
                        );
                    })}
                </div>

                {/* Shared Products */}
                {room.sharedProducts && room.sharedProducts.length > 0 && (
                    <div className="squad-sidebar-section" style={{ borderBottom: 'none' }}>
                        <h3>Shared Products ({room.sharedProducts.length})</h3>
                        <div className="squad-shared-products-list">
                            {room.sharedProducts.map((sp, idx) => (
                                <SquadProductCard
                                    key={idx}
                                    sharedProduct={sp}
                                    roomCode={roomCode}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    isGuest={isGuest}
                                    onAddToCart={() => setShowSignup(true)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showInvite && (
                <SquadInviteModal
                    roomCode={roomCode}
                    onClose={() => setShowInvite(false)}
                />
            )}
            {showSignup && (
                <SquadSignupPrompt onClose={() => setShowSignup(false)} />
            )}
        </div>
    );
};

export default SquadRoom;
