import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomInfo, joinSquadRoom, joinRoomAsUser } from '../../action/squadaction';

const SquadJoin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const [displayName, setDisplayName] = useState('');

    const { isAuthentication, user } = useSelector(state => state.user);
    const { roomName, hostName, memberCount, maxMembers, isFull, loading: infoLoading, error: infoError } = useSelector(state => state.squadRoomInfo);
    const { loading: joining, success: joinSuccess, error: joinError } = useSelector(state => state.joinSquadRoom);

    // Check if guest already has a token for this room
    useEffect(() => {
        const existingToken = localStorage.getItem(`squad_guest_${roomCode}`);
        if (existingToken) {
            // Already joined as guest — go directly to room
            navigate(`/squad/room/${roomCode}`, { replace: true });
            return;
        }
        dispatch(getRoomInfo(roomCode));
    }, [dispatch, roomCode, navigate]);

    useEffect(() => {
        if (joinSuccess) {
            navigate(`/squad/room/${roomCode}`, { replace: true });
        }
    }, [joinSuccess, roomCode, navigate]);

    const handleJoinAsGuest = (e) => {
        e.preventDefault();
        if (displayName.trim()) {
            dispatch(joinSquadRoom(roomCode, displayName.trim()));
        }
    };

    const handleJoinAsUser = () => {
        dispatch(joinRoomAsUser(roomCode));
    };

    if (infoLoading) {
        return (
            <div className="squad-join-page">
                <div className="squad-loading">
                    <div className="squad-spinner"></div>
                </div>
            </div>
        );
    }

    if (infoError) {
        return (
            <div className="squad-join-page">
                <div className="squad-join-card">
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>😕</span>
                    <h1 style={{ fontSize: '20px' }}>Room Not Found</h1>
                    <p className="squad-join-members">{infoError}</p>
                    <button className="squad-join-btn" onClick={() => navigate('/')}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="squad-join-page">
            <div className="squad-join-card">
                <h1>👗 Myntra Squad</h1>
                {roomName && (
                    <>
                        <div className="squad-join-roomname">{roomName}</div>
                        <p className="squad-join-members">
                            Hosted by {hostName} · {memberCount}/{maxMembers} members
                        </p>
                    </>
                )}

                {isFull ? (
                    <div className="squad-join-full">
                        This room is full. Ask the host to create a new room.
                    </div>
                ) : (
                    <>
                        {/* If logged in, offer to join as user */}
                        {isAuthentication && (
                            <div style={{ marginBottom: '20px' }}>
                                <button
                                    className="squad-join-btn"
                                    onClick={handleJoinAsUser}
                                    disabled={joining}
                                >
                                    {joining ? 'Joining...' : `Join as ${user?.name || 'Myntra User'}`}
                                </button>
                                <p style={{ fontSize: '13px', color: '#777', margin: '12px 0', textAlign: 'center' }}>
                                    — or join as a guest —
                                </p>
                            </div>
                        )}

                        {joinError && (
                            <div className="squad-join-error">{joinError}</div>
                        )}

                        <form onSubmit={handleJoinAsGuest}>
                            <input
                                type="text"
                                className="squad-join-input"
                                placeholder="Enter your display name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                maxLength={30}
                            />
                            <button
                                type="submit"
                                className="squad-join-btn"
                                disabled={joining || !displayName.trim()}
                                style={isAuthentication ? { background: '#fff', color: '#ff3f6c', border: '1px solid #ff3f6c' } : {}}
                            >
                                {joining ? 'Joining...' : 'Join as Guest'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default SquadJoin;
