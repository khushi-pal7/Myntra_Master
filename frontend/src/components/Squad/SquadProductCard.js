import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { voteOnProduct, reactToProduct } from '../../action/squadaction';

const EMOJIS = ['❤️', '🔥', '😍', '👎', '🤔', '💰'];

const SquadProductCard = ({ sharedProduct, roomCode, currentUserId, currentUserName, isGuest, onAddToCart }) => {
    const dispatch = useDispatch();
    const [showSignup, setShowSignup] = useState(false);
    const product = sharedProduct.productId;

    if (!product) return null;

    const buyVotes = sharedProduct.votes?.filter(v => v.vote === 'buy').length || 0;
    const byeVotes = sharedProduct.votes?.filter(v => v.vote === 'bye').length || 0;
    const totalVotes = buyVotes + byeVotes;
    const buyPercent = totalVotes > 0 ? (buyVotes / totalVotes) * 100 : 50;

    const userVote = sharedProduct.votes?.find(v => v.oderId === currentUserId);
    const userReactions = sharedProduct.reactions?.filter(r => r.oderId === currentUserId).map(r => r.emoji) || [];

    const discount = product.mrp && product.sellingPrice
        ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
        : 0;

    const handleVote = (vote) => {
        dispatch(voteOnProduct(roomCode, product._id, currentUserId, currentUserName, vote));
    };

    const handleReaction = (emoji) => {
        dispatch(reactToProduct(roomCode, product._id, currentUserId, emoji));
    };

    const handleAddToCart = () => {
        if (isGuest) {
            onAddToCart && onAddToCart();
        } else {
            window.open(`/products/${product._id}`, '_blank');
        }
    };

    const imgUrl = product.images && product.images.length > 0
        ? product.images[0].url
        : 'https://via.placeholder.com/300x200?text=No+Image';

    // Count reactions by emoji
    const reactionCounts = {};
    (sharedProduct.reactions || []).forEach(r => {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    });

    return (
        <div className="squad-product-card">
            <img
                src={imgUrl}
                alt={product.title}
                className="squad-product-card-img"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
            />
            <div className="squad-product-card-body">
                <p className="squad-product-brand">{product.brand}</p>
                <p className="squad-product-title">{product.title}</p>

                <div className="squad-product-price">
                    <span className="squad-product-selling">₹{product.sellingPrice}</span>
                    {product.mrp && product.mrp > product.sellingPrice && (
                        <>
                            <span className="squad-product-mrp">₹{product.mrp}</span>
                            <span className="squad-product-discount">({discount}% OFF)</span>
                        </>
                    )}
                </div>

                {/* Vote Section */}
                <div className="squad-vote-section">
                    <div className="squad-vote-label">Buy or Bye? 🤷</div>
                    <div className="squad-vote-buttons">
                        <button
                            className={`squad-vote-btn ${userVote?.vote === 'buy' ? 'active-buy' : ''}`}
                            onClick={() => handleVote('buy')}
                        >
                            👍 Buy {buyVotes > 0 && `(${buyVotes})`}
                        </button>
                        <button
                            className={`squad-vote-btn ${userVote?.vote === 'bye' ? 'active-bye' : ''}`}
                            onClick={() => handleVote('bye')}
                        >
                            👋 Bye {byeVotes > 0 && `(${byeVotes})`}
                        </button>
                    </div>
                    {totalVotes > 0 && (
                        <>
                            <div className="squad-vote-bar">
                                <div
                                    className="squad-vote-bar-fill"
                                    style={{ width: `${buyPercent}%` }}
                                ></div>
                            </div>
                            <div className="squad-vote-count">
                                <span>{buyVotes} Buy</span>
                                <span>{byeVotes} Bye</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Reactions */}
                <div className="squad-reactions">
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            className={`squad-reaction-btn ${userReactions.includes(emoji) ? 'active' : ''}`}
                            onClick={() => handleReaction(emoji)}
                        >
                            {emoji} {reactionCounts[emoji] ? reactionCounts[emoji] : ''}
                        </button>
                    ))}
                </div>

                {/* Add to Cart */}
                <button className="squad-add-cart-btn" onClick={handleAddToCart}>
                    {isGuest ? '🛒 Add to Cart' : '🛒 View Product'}
                </button>
            </div>
        </div>
    );
};

export default SquadProductCard;
