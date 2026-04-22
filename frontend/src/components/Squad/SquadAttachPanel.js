import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getwishlist, getbag } from '../../action/orderaction';

const SquadAttachPanel = ({ onShareProduct, onClose }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('wishlist');
    
    const { user, isAuthentication } = useSelector(state => state.user);
    const { wishlist, loading: wishLoading } = useSelector(state => state.wishlist_data);
    const { bag, loading: bagLoading } = useSelector(state => state.bag_data);

    useEffect(() => {
        if (isAuthentication && user?._id) {
            dispatch(getwishlist(user._id));
            dispatch(getbag(user._id));
        }
    }, [dispatch, user, isAuthentication]);

    const getProductsFromOrderItems = (source) => {
        if (!source || !source.orderItems) return [];
        return source.orderItems
            .map(item => item.product)
            .filter(product => product && product._id);
    };

    const wishlistProducts = getProductsFromOrderItems(wishlist);
    const bagProducts = getProductsFromOrderItems(bag);
    const loading = wishLoading || bagLoading;

    const items = activeTab === 'wishlist' ? wishlistProducts : bagProducts;

    return (
        <div className="squad-attach-panel">
            <div className="squad-attach-tabs">
                <button
                    className={`squad-attach-tab ${activeTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                >
                    ♥ Wishlist ({wishlistProducts.length})
                </button>
                <button
                    className={`squad-attach-tab ${activeTab === 'bag' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bag')}
                >
                    🛒 Cart ({bagProducts.length})
                </button>
                <button
                    className="squad-attach-tab"
                    onClick={onClose}
                    style={{ maxWidth: '60px', color: '#777' }}
                >
                    ✕
                </button>
            </div>

            {loading ? (
                <div className="squad-loading" style={{ padding: '20px' }}>
                    <div className="squad-spinner"></div>
                </div>
            ) : items.length > 0 ? (
                <div className="squad-attach-grid">
                    {items.map(product => (
                        <div
                            key={product._id}
                            className="squad-attach-item"
                            onClick={() => onShareProduct(product)}
                        >
                            <img
                                src={product.images?.[0]?.url || 'https://via.placeholder.com/120x100?text=No+Image'}
                                alt={product.title}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/120x100?text=No+Image'; }}
                            />
                            <div className="squad-attach-item-info">
                                <div className="brand">{product.brand}</div>
                                <div className="price">₹{product.sellingPrice}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="squad-attach-empty">
                    {activeTab === 'wishlist'
                        ? 'Your wishlist is empty. Add products to share them here!'
                        : 'Your cart is empty. Add products to share them here!'}
                </div>
            )}
        </div>
    );
};

export default SquadAttachPanel;
