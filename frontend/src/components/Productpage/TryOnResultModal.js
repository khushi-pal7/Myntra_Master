import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { VscChromeClose } from 'react-icons/vsc';
import { BsHandbag, BsShare, BsArrowLeftRight } from 'react-icons/bs';
import { createbag } from '../../action/orderaction';
import { shareTryOnResult, getMySquadRooms } from '../../action/squadaction';
import { useAlert } from 'react-alert';

const TryOnResultModal = ({ product, onClose }) => {
    const dispatch = useDispatch();
    const alert = useAlert();
    const { user } = useSelector(state => state.user);
    const { rooms } = useSelector(state => state.mySquadRooms || { rooms: [] });

    const [loading, setLoading] = useState(true);
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);
    const [showSquadSelector, setShowSquadSelector] = useState(false);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        const processAI = async () => {
            try {
                const { data } = await axios.post(`/api/v1/try-on/user/try-on/${user._id}`, {
                    productId: product._id
                });

                if (data.success && data.resultImage) {
                    setResultImage(data.resultImage);
                } else if (data.message) {
                    setError(data.message);
                } else {
                    setError("Try On is unavailable right now, please try again");
                }
                setLoading(false);
            } catch (err) {
                setError("Try On is unavailable right now, please try again");
                setLoading(false);
            }
        };

        if (user && product) {
            processAI();
            dispatch(getMySquadRooms());
        }
    }, [user, product, dispatch]);

    const handleAddToBag = () => {
        const option = {
            user: user._id,
            orderItems: [{ product: product._id, qty: 1 }]
        };
        dispatch(createbag(option));
        alert.success('Product added successfully in Bag');
    };

    const handleShareToSquad = async (room) => {
        setSharing(true);
        try {
            const displayName = user.name || `User-${user.phonenumber}`;
            await dispatch(shareTryOnResult(
                room.roomCode,
                product._id,
                resultImage || product.images[0].url, // Fallback if result image is empty for demo
                user._id,
                displayName,
                'user'
            ));
            alert.success(`Shared to ${room.roomName}!`);
            setShowSquadSelector(false);
        } catch (err) {
            alert.error("Failed to share to squad");
        }
        setSharing(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden relative shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-slate-100 transition-colors"
                >
                    <VscChromeClose size={24} />
                </button>

                {/* Left: Image Side */}
                <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center relative overflow-hidden h-1/2 md:h-auto">
                    {loading ? (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 border-4 border-[#ff3f6c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <h2 className="text-lg font-bold text-slate-800 animate-pulse">Gemini is dressing you...</h2>
                            <p className="text-sm text-slate-500 mt-2">Personalizing the fit and lighting...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center p-8">
                            <span className="text-5xl block mb-4">😕</span>
                            <h2 className="text-lg font-bold text-slate-800">{error}</h2>
                            <button 
                                onClick={onClose}
                                className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-md font-bold"
                            >
                                Go Back
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                             <img 
                                src={resultImage || product.images[0].url} 
                                alt="Try On Result" 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-[10px] font-bold text-[#ff3f6c] shadow-sm flex items-center gap-1 uppercase tracking-wider">
                                <span className="w-2 h-2 bg-[#ff3f6c] rounded-full animate-pulse"></span>
                                AI Generated View
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Actions Side */}
                <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col overflow-y-auto">
                    {!loading && !error && (
                        <>
                            <div className="mb-6">
                                <h1 className="text-xl font-bold text-slate-900 mb-1">{product.brand}</h1>
                                <p className="text-slate-500 text-sm mb-4">{product.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black">Rs. {Math.round(product.sellingPrice)}</span>
                                    <span className="text-slate-400 line-through text-sm">Rs. {product.mrp}</span>
                                    <span className="text-[#f26a10] text-sm font-bold">({-Math.round(product.sellingPrice / product.mrp * 100 - 100)}% OFF)</span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-auto">
                                <button 
                                    onClick={handleAddToBag}
                                    className="w-full bg-[#ff3f6c] text-white py-4 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-[#f64871] transition-all transform active:scale-95 shadow-lg shadow-pink-100"
                                >
                                    <BsHandbag size={20} />
                                    ADD TO BAG
                                </button>
                                
                                <button 
                                    onClick={() => setShowSquadSelector(!showSquadSelector)}
                                    className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 ${showSquadSelector ? 'bg-slate-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-800'}`}
                                >
                                    <BsShare size={18} />
                                    SHARE TO SQUAD
                                </button>

                                {showSquadSelector && (
                                    <div className="mt-2 border rounded-lg p-2 bg-slate-50 animate-slideDown max-h-48 overflow-y-auto">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest pl-2">My Squad Rooms</p>
                                        {rooms && rooms.length > 0 ? (
                                            rooms.map(room => (
                                                <button 
                                                    key={room._id}
                                                    disabled={sharing}
                                                    onClick={() => handleShareToSquad(room)}
                                                    className="w-full text-left p-3 hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center justify-between group"
                                                >
                                                    <span className="font-semibold text-sm">{room.roomName}</span>
                                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-500 group-hover:bg-[#ff3f6c] group-hover:text-white transition-colors uppercase">{room.roomCode}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="p-4 text-center text-xs text-slate-400 italic">You aren't in any squad rooms yet.</p>
                                        )}
                                    </div>
                                )}

                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 text-slate-500 font-bold flex items-center justify-center gap-3 hover:text-slate-800 transition-all"
                                >
                                    <BsArrowLeftRight size={18} />
                                    TRY ANOTHER
                                </button>
                            </div>

                            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 items-start gap-3 hidden md:flex">
                                <span className="text-xl">💡</span>
                                <div>
                                    <p className="text-xs font-bold text-yellow-800">Friend's Opinion?</p>
                                    <p className="text-[10px] text-yellow-700 leading-relaxed mt-1">
                                        Share this try-on result to your Squad room. Your friends can vote "Buy" or "Bye" directly on your photo!
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TryOnResultModal;
