import React, { Fragment, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Sidebar from './sidebar';
import Footer from '../../Footer/Footer';
import { useAlert } from 'react-alert';
import { getuser } from '../../../action/useraction';

const MyFitProfile = () => {
    const dispatch = useDispatch();
    const alert = useAlert();
    const { user } = useSelector(state => state.user);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(user?.fitProfilePhoto || '');
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            alert.error("Please select an image first");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const config = { headers: { "Content-Type": "multipart/form-data" } };
            const { data } = await axios.post(`/api/v1/try-on/user/fit-profile/${user._id}`, formData, config);
            
            if (data.success) {
                alert.success("Fit Profile updated successfully!");
                dispatch(getuser()); // Refresh user data to get the new photo URL
            }
            setLoading(false);
        } catch (error) {
            alert.error(error.response?.data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <Fragment>
            <div>
                <div className='py-4 border-b-[1px] mx-auto w-[90%] mt-5 2xl:w-[70%] xl:w-[70%] lg:w-[70%]'>
                    <h1 className='font-semibold text-lg font1'>Account</h1>
                    <p className='text-xs'>{user?.name}</p>
                </div>
                <div className='flex w-[90%] h-auto mx-auto 2xl:w-[70%] xl:w-[70%] lg:w-[70%]'>
                    <div className='w-[30%] border-r-2 2xl:w-[20%] xl:w-[20%] lg:w-[20%]'>
                        <Sidebar />
                    </div>
                    <div className='w-[70%] h-full 2xl:w-[80%] xl:w-[80%] lg:w-[80%]'>
                        <div className='w-[100%] mx-auto text-xs 2xl:w-[60%] xl:w-[60%] lg:w-[60%] 2xl:text-base xl:text-base lg:text-base'>
                            <h1 className='font-semibold text-lg font1 border-b-[1px] my-4 py-4'>My Fit Profile</h1>
                            
                            <div className='p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 mt-4'>
                                <p className='mb-6 text-slate-600'>
                                    Upload a clear, front-facing photo of yourself to enable the "Try It On" feature. 
                                    This photo will be saved to your profile and used whenever you try on a product.
                                </p>

                                <div className='flex flex-col items-center gap-6'>
                                    <div className='relative w-64 h-80 bg-white rounded-lg overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center'>
                                        {imagePreview ? (
                                            <img 
                                                src={imagePreview.startsWith('data:') ? imagePreview : (imagePreview.startsWith('http') ? imagePreview : `http://localhost:4000${imagePreview}`)} 
                                                alt="Fit Preview" 
                                                className='w-full h-full object-contain'
                                            />
                                        ) : (
                                            <div className='text-center p-4 text-slate-400'>
                                                <span className='text-4xl block mb-2'>👤</span>
                                                <p>No photo uploaded yet</p>
                                            </div>
                                        )}
                                    </div>

                                    <form onSubmit={handleSubmit} className='w-full max-w-xs flex flex-col gap-4'>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            id="fit-upload" 
                                            className='hidden' 
                                            onChange={handleImageChange}
                                        />
                                        <label 
                                            htmlFor="fit-upload" 
                                            className='w-full py-3 bg-white border-2 border-[#e6355f] text-[#e6355f] text-center font-bold rounded cursor-pointer hover:bg-pink-50 transition-colors uppercase text-sm'
                                        >
                                            {imagePreview ? "Change Photo" : "Select Photo"}
                                        </label>

                                        {image && (
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className='w-full py-3 bg-[#e6355f] text-white font-bold rounded cursor-pointer hover:bg-[#d1244d] transition-colors uppercase text-sm disabled:bg-slate-400'
                                            >
                                                {loading ? "Uploading..." : "Save to Fit Profile"}
                                            </button>
                                        )}
                                    </form>
                                </div>

                                <div className='mt-8 text-[10px] text-slate-400 text-center'>
                                    <p>Tip: For best results, use a photo with good lighting and a simple background.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </Fragment>
    );
};

export default MyFitProfile;
