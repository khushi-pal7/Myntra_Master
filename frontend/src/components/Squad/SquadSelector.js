import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getwishlist, getbag } from '../../action/orderaction';

const SquadSelector = ({ onShareProduct, onClose, socket }) => {
    // Version: 1.0.5 - Guest Persistence & Real-time Sync
    const dispatch = useDispatch();
    console.log('SquadSelector: Mounted v1.0.5');
    const [activeTab, setActiveTab] = useState('wishlist');
    
    const { user, isAuthentication } = useSelector(state => state.user);
    const wishlistState = useSelector(state => state.wishlist_data || {});
    const bagState = useSelector(state => state.bag_data || {});

    // Destructure with fallbacks
    const { wishlist, loading: wishLoading } = wishlistState;
    const { bag, loading: bagLoading } = bagState;

    useEffect(() => {
        // Senior Engineer Tip: Unified ID detection for multi-tab durability
        const globalGuestId = localStorage.getItem('squad_guest_id_global');
        const identifier = user?._id || globalGuestId;
        
        if (identifier) {
            console.log(`Squad Room: Fetching items for identity ${identifier}`);
            dispatch(getwishlist(identifier));
            dispatch(getbag(identifier));
        }
    }, [dispatch, user]);

    // Real-time synchronization listener
    useEffect(() => {
        if (!socket) return;

        const handleSync = () => {
            const globalGuestId = localStorage.getItem('squad_guest_id_global');
            const identifier = user?._id || globalGuestId;
            if (identifier) {
                console.log('Squad Selector: Received real-time sync event, refreshing data');
                dispatch(getwishlist(identifier));
                dispatch(getbag(identifier));
            }
        };

        socket.on('wishlist_updated', handleSync);
        socket.on('bag_updated', handleSync);

        return () => {
            socket.off('wishlist_updated', handleSync);
            socket.off('bag_updated', handleSync);
        };
    }, [socket, user, dispatch]);

    // Robust extraction logic
    const extractProducts = useMemo(() => (source) => {
        if (!source) return [];
        
        // Handle case where source might be the DB object or just the orderItems array
        const items = source.orderItems || (Array.isArray(source) ? source : []);
        
        return items
            .map(item => item.product)
            .filter(product => {
                const isValid = product && (product._id || product.id);
                if (!isValid && product) {
                    console.debug('Squad Room: Found semi-invalid product in source', product);
                }
                return isValid;
            });
    }, []);

    const wishlistProducts = useMemo(() => extractProducts(wishlist), [wishlist, extractProducts]);
    const bagProducts = useMemo(() => extractProducts(bag), [bag, extractProducts]);
    
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
                    style={{ maxWidth: '60px', color: '#777', fontWeight: 'bold' }}
                >
                    ✕
                </button>
            </div>

            {loading && items.length === 0 ? (
                <div className="squad-loading" style={{ padding: '40px' }}>
                    <div className="squad-spinner"></div>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>Loading products...</p>
                </div>
            ) : items.length > 0 ? (
                <div className="squad-attach-grid">
                    {items.map(product => (
                        <div
                            key={product._id || product.id}
                            className="squad-attach-item"
                            onClick={() => onShareProduct(product)}
                        >
                            <div className="squad-attach-img-wrapper">
                                <img
                                    src={product.images?.[0]?.url || 'https://via.placeholder.com/120x150?text=No+Image'}
                                    alt={product.title}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/120x150?text=No+Image'; }}
                                />
                            </div>
                            <div className="squad-attach-item-info">
                                <div className="brand">{product.brand || 'Product'}</div>
                                <div className="price">₹{product.sellingPrice}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="squad-attach-empty">
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>
                        {activeTab === 'wishlist' ? '📋' : '🛍️'}
                    </span>
                    {activeTab === 'wishlist'
                        ? 'Your wishlist is empty.'
                        : 'Your cart is empty.'}
                    <p style={{ fontSize: '11px', marginTop: '8px', color: '#999' }}>
                        {!isAuthentication ? 'Please log in to see your items.' : 'Add items to share them with your squad!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SquadSelector;
