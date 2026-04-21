import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSquadRoom, getMySquadRooms } from '../../action/squadaction';

const SquadLanding = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState('');

    const { isAuthentication, user } = useSelector(state => state.user);
    const { rooms, loading: roomsLoading } = useSelector(state => state.squadRooms);
    const { room: createdRoom, loading: creating, success } = useSelector(state => state.createSquadRoom);

    useEffect(() => {
        if (isAuthentication) {
            dispatch(getMySquadRooms());
        }
    }, [dispatch, isAuthentication]);

    useEffect(() => {
        if (success && createdRoom) {
            navigate(`/squad/room/${createdRoom.roomCode}`);
        }
    }, [success, createdRoom, navigate]);

    const handleCreate = (e) => {
        e.preventDefault();
        if (roomName.trim()) {
            dispatch(createSquadRoom(roomName.trim()));
        }
    };

    if (!isAuthentication) {
        return (
            <div className="squad-landing">
                <div className="squad-landing-inner">
                    <h1>👗 Myntra <span>Squad</span></h1>
                    <p className="squad-subtitle">Shop together with friends in real-time</p>
                    <div className="squad-create-card">
                        <h2>Sign in to create your Squad room</h2>
                        <p style={{ color: '#777', fontSize: '14px', marginBottom: '16px' }}>
                            Create a private room, invite your friends, and shop together. Chat, share products, and vote on what to buy!
                        </p>
                        <button 
                            className="squad-btn-primary"
                            onClick={() => navigate('/Login')}
                        >
                            Sign In to Get Started
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="squad-landing">
            <div className="squad-landing-inner">
                <h1>👗 Myntra <span>Squad</span></h1>
                <p className="squad-subtitle">Create a room, invite friends, and shop together in real-time</p>

                {/* Create Room */}
                <div className="squad-create-card">
                    <h2>Create a New Room</h2>
                    <form className="squad-create-form" onSubmit={handleCreate}>
                        <input
                            type="text"
                            className="squad-create-input"
                            placeholder="Room name (e.g. Wedding Shopping, Weekend Haul...)"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            maxLength={50}
                        />
                        <button
                            type="submit"
                            className="squad-btn-primary"
                            disabled={creating || !roomName.trim()}
                        >
                            {creating ? 'Creating...' : 'Create Room'}
                        </button>
                    </form>
                </div>

                {/* Active Rooms */}
                <div className="squad-rooms-section">
                    <h2>Your Active Rooms</h2>
                    {roomsLoading ? (
                        <div className="squad-loading">
                            <div className="squad-spinner"></div>
                        </div>
                    ) : rooms && rooms.length > 0 ? (
                        <div className="squad-room-list">
                            {rooms.map(room => (
                                <div
                                    key={room._id}
                                    className="squad-room-card"
                                    onClick={() => navigate(`/squad/room/${room.roomCode}`)}
                                >
                                    <div className="squad-room-card-info">
                                        <h3>{room.roomName}</h3>
                                        <p>
                                            {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                                            {' · '}
                                            {room.sharedProducts?.length || 0} products shared
                                            {' · '}
                                            <span className="squad-room-code">{room.roomCode}</span>
                                        </p>
                                    </div>
                                    <span className="squad-room-arrow">›</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="squad-empty-rooms">
                            <span className="squad-empty-icon">🛍️</span>
                            No active rooms yet. Create one above to start shopping with friends!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SquadLanding;
