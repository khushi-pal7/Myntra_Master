import React from 'react';
import { useNavigate } from 'react-router-dom';

const SquadSignupPrompt = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="squad-modal-overlay" onClick={onClose}>
            <div className="squad-modal squad-signup-modal" onClick={e => e.stopPropagation()}>
                <span className="squad-signup-logo">🛍️</span>
                <h2>Join Myntra to add this to your bag!</h2>
                <p>
                    Create a free Myntra account to add products to your cart, 
                    track orders, and get exclusive deals.
                </p>
                <button
                    className="squad-signup-cta"
                    onClick={() => navigate('/Login')}
                >
                    Sign Up / Log In
                </button>
                <button className="squad-signup-dismiss" onClick={onClose}>
                    Maybe Later
                </button>
            </div>
        </div>
    );
};

export default SquadSignupPrompt;
