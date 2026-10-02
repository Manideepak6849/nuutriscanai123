import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Camera as CameraIcon, Package, Droplets, Pill } from 'lucide-react';
import { db, appId } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { colors, Spinner } from './Shared';
import { CameraView } from './Modals';

export const HomePage = ({ setPage }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('food');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setError('Please enter a product name.');
            return;
        }
        setError('');
        setIsLoading(true);
        
        const searchData = { query: searchQuery, type: category };
        
        try {
            const productRef = doc(db, `/artifacts/${appId}/public/data/products/${searchQuery.toLowerCase()}`);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                setPage('details', productSnap.data());
                setIsLoading(false);
                return;
            }
        } catch (err) {
            // Firestore might fail if offline or unauthorized, gracefully continue to fetch via AI
            console.warn(err);
        }
        
        setPage('details', searchData);
        setIsLoading(false);
    };

    const analyzeProductImage = async (base64ImageData) => {
        setIsLoading(true);
        setError('');
        const prompt = `From this image of a product's packaging or ingredients list, identify the product name. For example: 'Maggi Noodles', 'Head & Shoulders Shampoo'. Respond with only the product name.`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }] }],
        };
        // Replace with your actual Gemini API key
        const apiKey = "YOUR_GEMINI_API_KEY"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const productName = result.candidates[0].content.parts[0].text.trim();
                await handleSearch(productName);
            } else {
                setError("AI could not identify the product from the image.");
            }
        } catch (err) {
            setError("Failed to connect to the AI service for image analysis.");
        } finally {
            setIsLoading(false);
            setIsCameraOpen(false);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64ImageData = reader.result.split(',')[1];
            analyzeProductImage(base64ImageData);
        };
        reader.onerror = () => { setError("Failed to read image file."); };
    };

    return (
        <>
            <div className="container mx-auto px-4 py-12 md:py-24 text-center flex flex-col items-center">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-6xl font-extrabold mb-4" style={{ color: colors.textPrimary }}>
                    Analyze Your Products.
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg md:text-xl max-w-2xl mb-10" style={{ color: colors.textSecondary }}>
                    Get instant AI analysis of packaged foods, personal care, and health products to understand their ingredients and potential risks.
                </motion.p>

                <div className="w-full max-w-2xl">
                    <div className="flex justify-center gap-2 mb-4">
                        <button onClick={() => setCategory('food')} className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${category === 'food' ? 'bg-green-600 text-white shadow-lg' : 'bg-white'}`}><Package size={16}/> Packaged Foods</button>
                        <button onClick={() => setCategory('care')} className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${category === 'care' ? 'bg-green-600 text-white shadow-lg' : 'bg-white'}`}><Droplets size={16}/> Personal Care</button>
                        <button onClick={() => setCategory('health')} className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${category === 'health' ? 'bg-green-600 text-white shadow-lg' : 'bg-white'}`}><Pill size={16}/> Health Products</button>
                    </div>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white p-4 rounded-2xl shadow-lg">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4" style={{ color: colors.textSecondary }} />
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)} placeholder={`Search for ${category === 'food' ? 'biscuits, chips...' : category === 'care' ? 'shampoo, creams...' : 'supplements...'}`} className="w-full pl-12 pr-24 py-4 bg-transparent text-lg focus:outline-none" />
                            <button onClick={() => handleSearch(query)} disabled={isLoading} className="absolute right-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 disabled:bg-gray-400">
                                {isLoading ? <Spinner /> : 'Search'}
                            </button>
                        </div>
                    </motion.div>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex flex-wrap justify-center gap-4 mt-4">
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <Upload size={20} style={{ color: colors.accentGreen }} /> Upload Image
                        </button>
                        <button onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <CameraIcon size={20} style={{ color: colors.accentGreen }} /> Scan with Camera
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </motion.div>
                </div>
            </div>
            <CameraView isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={analyzeProductImage} />
        </>
    );
};
