import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const SquadAttachPanel = ({ onShareProduct, onClose }) => {
    const [activeTab, setActiveTab] = useState('wishlist');
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [bagProducts, setBagProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useSelector(state => state.user);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch wishlist
                const wishRes = await axios.get(`/api/v1/wishlist/${user?._id}`);
                if (wishRes.data.success && wishRes.data.wishlist) {
                    const products = await Promise.all(
                        wishRes.data.wishlist.map(async (item) => {
                            try {
                                const pRes = await axios.get(`/api/v1/squad/resolve-product/${item.productid}`);
                                return pRes.data.product;
                            } catch {
                                return null;
                            }
                        })
                    );
                    setWishlistProducts(products.filter(Boolean));
                }
            } catch (err) {
                console.log('Wishlist fetch:', err.message);
            }

            try {
                // Fetch bag
                const bagRes = await axios.get(`/api/v1/bag/${user?._id}`);
                if (bagRes.data.success && bagRes.data.bag) {
                    const products = await Promise.all(
                        bagRes.data.bag.map(async (item) => {
                            try {
                                const pRes = await axios.get(`/api/v1/squad/resolve-product/${item.productid}`);
                                return pRes.data.product;
                            } catch {
                                return null;
                            }
                        })
                    );
                    setBagProducts(products.filter(Boolean));
                }
            } catch (err) {
                console.log('Bag fetch:', err.message);
            }
            setLoading(false);
        };

        fetchData();
    }, [user]);

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
