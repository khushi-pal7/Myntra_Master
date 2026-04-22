import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const SquadAttachPanel = ({ onShareProduct, onClose }) => {
    const [activeTab, setActiveTab] = useState('wishlist');
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [bagProducts, setBagProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user, isAuthentication } = useSelector(state => state.user);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthentication || !user?._id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch wishlist
                const wishRes = await axios.get(`/api/v1/get_wishlist/${user._id}`);
                console.log('Squad Wishlist Response:', wishRes.data);
                if (wishRes.data.success && wishRes.data.wishlist) {
                    const products = (wishRes.data.wishlist.orderItems || [])
                        .map(item => item.product)
                        .filter(product => product && product._id);
                    setWishlistProducts(products);
                }
            } catch (err) {
                console.log('Wishlist fetch error:', err.response?.data?.message || err.message);
            }

            try {
                // Fetch bag
                const bagRes = await axios.get(`/api/v1/bag/${user._id}`);
                console.log('Squad Bag Response:', bagRes.data);
                if (bagRes.data.success && bagRes.data.bag) {
                    const products = (bagRes.data.bag.orderItems || [])
                        .map(item => item.product)
                        .filter(product => product && product._id);
                    setBagProducts(products);
                }
            } catch (err) {
                console.log('Bag fetch error:', err.response?.data?.message || err.message);
            }
            setLoading(false);
        };

        fetchData();
    }, [user, isAuthentication]);

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
