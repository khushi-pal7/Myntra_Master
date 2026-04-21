import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendSquadInvite } from '../../action/squadaction';

const SquadInviteModal = ({ roomCode, onClose }) => {
    const dispatch = useDispatch();
    const [phone, setPhone] = useState('');
    const { loading, success, inviteLink, message } = useSelector(state => state.squadInvite);

    const handleSend = (e) => {
        e.preventDefault();
        if (phone.trim()) {
            dispatch(sendSquadInvite(roomCode, phone.trim(), window.location.origin));
        }
    };

    const copyLink = () => {
        const link = inviteLink || `${window.location.origin}/squad/join/${roomCode}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Invite link copied!');
        });
    };

    return (
        <div className="squad-modal-overlay" onClick={onClose}>
            <div className="squad-modal" onClick={e => e.stopPropagation()}>
                <button className="squad-modal-close" onClick={onClose}>✕</button>
                <h2>Invite Friends</h2>
                <p>Send an SMS invite or share the room link. Anyone with the link can join!</p>

                <form onSubmit={handleSend}>
                    <input
                        type="tel"
                        className="squad-modal-input"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="squad-btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading || !phone.trim()}
                    >
                        {loading ? 'Sending...' : 'Send Invite SMS'}
                    </button>
                </form>

                {success && (
                    <div className="squad-invite-success">✓ {message}</div>
                )}

                <div className="squad-invite-link">
                    <strong>Or share this link directly:</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ flex: 1 }}>
                            {inviteLink || `${window.location.origin}/squad/join/${roomCode}`}
                        </span>
                        <button
                            className="squad-btn-outline"
                            onClick={copyLink}
                            style={{ flexShrink: 0, padding: '6px 12px', fontSize: '12px' }}
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <p style={{ fontSize: '11px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
                    This link can be shared with multiple people. Each person joins separately.
                </p>
            </div>
        </div>
    );
};

export default SquadInviteModal;
