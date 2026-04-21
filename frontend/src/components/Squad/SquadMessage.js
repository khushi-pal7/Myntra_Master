import React from 'react';

const SquadMessage = ({ msg, currentUserId }) => {
    if (msg.messageType === 'system') {
        return (
            <div className="squad-system-message">
                <span>{msg.content}</span>
            </div>
        );
    }

    const isOwn = msg.senderId === currentUserId;
    const time = new Date(msg.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    return (
        <div className={`squad-message-wrapper ${isOwn ? 'own' : 'other'}`}>
            {!isOwn && (
                <div className="squad-message-sender">
                    {msg.senderName}
                    {msg.senderType === 'guest' && (
                        <span className="squad-badge-guest" style={{ fontSize: '9px', padding: '1px 4px' }}>Guest</span>
                    )}
                </div>
            )}
            <div className={`squad-message-bubble ${isOwn ? 'own' : 'other'}`}>
                {msg.content}
            </div>
            <div className="squad-message-time">{time}</div>
        </div>
    );
};

export default SquadMessage;
