import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Camera as CameraIcon, Link as LinkIcon, PieChart, BrainCircuit, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { db, appId } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { colors, Spinner } from './Shared';
import { CameraView, UrlModal, MultipleItemsModal } from './Modals';

const AnalysisInput = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [isMultiItemModalOpen, setIsMultiItemModalOpen] = useState(false);
    const [identifiedItems, setIdentifiedItems] = useState([]);
    const fileInputRef = useRef(null);

    const handleSearch = (searchQuery, isFullPlate = false) => {
        onSearch(searchQuery, isFullPlate);
    };
    
    const analyzeImage = async (base64ImageData) => {
        setIsLoading(true);
        setError('');
        const prompt = "You are an expert in regional Indian cuisine. Identify all distinct food items on this plate. List only the names, separated by commas. For example: Medu Vada, Masala Dosa, Sambar, Coconut Chutney.";
        const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }] }],
        };
        const apiKey = "YOUR_GEMINI_API_KEY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const fullList = result.candidates[0].content.parts[0].text.trim();
                const items = fullList.split(',').map(item => item.trim()).filter(Boolean);
                
                if (items.length > 1) {
                    setIdentifiedItems(items);
                    setIsMultiItemModalOpen(true);
                } else if (items.length === 1) {
                    await handleSearch(items[0]);
                } else {
                    setError("Could not identify any specific items in the image.");
                }
            } else {
                setError("AI could not identify the image. Please try another one.");
            }
        } catch (err) {
            setError("Failed to connect to the AI service.");
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
            analyzeImage(base64ImageData);
        };
        reader.onerror = () => { setError("Failed to read image file."); };
    };

    const handleMultiItemSelect = (item) => {
        setIsMultiItemModalOpen(false);
        handleSearch(item);
    };

    const handleFullPlateAnalysis = () => {
        setIsMultiItemModalOpen(false);
        const allItems = identifiedItems.join(',');
        handleSearch(allItems, true);
    };

    return (
        <>
            <div className="w-full max-w-3xl mx-auto mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4" style={{ color: colors.textSecondary }} />
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)} placeholder="Search for a fresh food or upload an image..." className="w-full pl-12 pr-24 py-4 bg-transparent text-lg focus:outline-none" />
                        <button onClick={() => handleSearch(query)} disabled={isLoading} className="absolute right-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 disabled:bg-gray-400">
                            {isLoading ? <Spinner /> : 'Analyze'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <Upload size={20} style={{ color: colors.accentGreen }} /> Upload Image
                    </button>
                    <button onClick={() => setIsCameraOpen(true)} className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <CameraIcon size={20} style={{ color: colors.accentGreen }} /> Scan with Camera
                    </button>
                    <button onClick={() => setIsUrlModalOpen(true)} className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <LinkIcon size={20} style={{ color: colors.accentGreen }} /> Paste URL
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
            </div>
            <CameraView isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={analyzeImage} />
            <UrlModal isOpen={isUrlModalOpen} onClose={() => setIsUrlModalOpen(false)} onAnalyze={handleSearch} />
            <MultipleItemsModal isOpen={isMultiItemModalOpen} onClose={() => setIsMultiItemModalOpen(false)} items={identifiedItems} onSelect={handleMultiItemSelect} onAnalyzeFullPlate={handleFullPlateAnalysis} />
        </>
    );
};

export const NutritionAnalysisPage = ({ setPage, initialData, userId }) => {
    const [productData, setProductData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [servingSize, setServingSize] = useState(100);
    const [servingUnit, setServingUnit] = useState('grams');
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [aiTip, setAiTip] = useState({ type: '', text: '', isLoading: false });

    const handleAnalysisSearch = async (searchQuery, isFullPlate = false) => {
        if (!searchQuery.trim()) return;
        
        const fetchAnalysisData = async (query) => {
            setIsLoading(true);
            setError('');
            const isFullPlateQuery = typeof query === 'object' && query.isFullPlate;
            const cacheKey = isFullPlateQuery ? query.items.join(',') : query;

            const prompt = isFullPlateQuery
                ? `You are an expert on Indian food and nutrition. Analyze the following full plate of food: ${query.items.join(', ')}. Provide a combined, holistic analysis in a valid JSON object format. Summarize the meal, calculate the total nutrition, and list all ingredients from all items. The JSON object must conform to this schema:
                   { "name": "Full Plate Analysis", "healthGrade": "string (A-F)", "summary": "string", "ingredients": [ { "name": "string", "type": "string", "risk": "string", "classification": "string" } ], "nutrition": { "serving": "string", "calories": "number", "protein": "number", "carbs": "number", "fat": "number", "sodium": "string" }, "alternatives": [] }`
                : `You are an expert on Indian food and nutrition. Analyze the food or product "${query}". Provide a detailed analysis in a valid JSON object format. The JSON object must conform to this schema:
                   { "name": "string", "healthGrade": "string (A-F)", "summary": "string", "ingredients": [ { "name": "string", "type": "string", "risk": "string", "classification": "string" } ], "nutrition": { "serving": "string", "calories": "number", "protein": "number", "carbs": "number", "fat": "number", "sodium": "string" }, "alternatives": [] }`;

            const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } };
            const apiKey = "YOUR_GEMINI_API_KEY";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = JSON.parse(jsonText);
                setProductData(parsedData);
                try {
                    const productRef = doc(db, `/artifacts/${appId}/public/data/foods/${cacheKey.toLowerCase()}`);
                    await setDoc(productRef, parsedData, { merge: true });
                } catch(e) {}
            } catch (err) {
                setError(`Sorry, I couldn't analyze "${cacheKey}".`);
            } finally {
                setIsLoading(false);
            }
        };

        const searchData = isFullPlate ? { items: searchQuery.split(','), isFullPlate: true } : searchQuery;
        
        if (!isFullPlate) {
            try {
                const productRef = doc(db, `/artifacts/${appId}/public/data/foods/${searchQuery.toLowerCase()}`);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    setProductData(productSnap.data());
                    return;
                }
            } catch(e) {}
        }
        fetchAnalysisData(searchData);
    };

    const handleRecalculateNutrition = async () => {
        if (!servingSize || !servingUnit || !productData) return;
        setIsRecalculating(true);

        const prompt = `Given the product "${productData.name}", recalculate the nutritional information for a new serving size of ${servingSize} ${servingUnit}. Provide only the nutrition part of the analysis in a valid JSON object format. The JSON object must conform to this schema: { "serving": "string", "calories": "number", "protein": "number", "carbs": "number", "fat": "number", "sodium": "string" }`;
        
        const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } };
        const apiKey = "YOUR_GEMINI_API_KEY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            const jsonText = result.candidates[0].content.parts[0].text;
            const newNutritionData = JSON.parse(jsonText);
            
            setProductData(prevData => ({
                ...prevData,
                nutrition: newNutritionData
            }));

        } catch (err) {
            console.error("Failed to recalculate nutrition:", err);
        } finally {
            setIsRecalculating(false);
        }
    };
    
    const getAiInsight = async (type) => {
        setAiTip({ type, text: '', isLoading: true });
        let prompt;
        if (type === 'coach') {
            prompt = `I am looking at a food: ${productData.name}. Give me one concise, actionable health tip related to this food for an Indian user.`;
        } else if (type === 'improve') {
            prompt = `Here is a meal: ${productData.name}. Suggest one simple way to make this meal healthier without drastically changing it.`;
        } else if (type === 'recipe') {
            prompt = `Give me a simple, creative recipe idea for "${productData.name}".`;
        }

        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const apiKey = "YOUR_GEMINI_API_KEY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            const insightText = result.candidates[0].content.parts[0].text;
            setAiTip({ type, text: insightText, isLoading: false });
        } catch (err) {
            setAiTip({ type, text: "Could not get an insight at this time.", isLoading: false });
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <AnalysisInput onSearch={handleAnalysisSearch} />
            
            {isLoading && <div className="min-h-[40vh] flex items-center justify-center flex-col gap-4"><Spinner size="w-12 h-12" /><p>AI is analyzing...</p></div>}
            {error && <div className="min-h-[40vh] flex items-center justify-center text-center text-red-500 p-8">{error}</div>}

            {!isLoading && !error && !productData && (
                 <div className="text-center py-16">
                    <PieChart size={48} className="mx-auto text-gray-300" />
                    <h2 className="mt-4 text-2xl font-semibold">Calories Analysis Hub</h2>
                    <p className="mt-2 text-gray-500">Search for a fresh food or upload an image to begin your calories analysis.</p>
                </div>
            )}

            {productData && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-8">
                    <h1 className="text-4xl font-bold mb-2 text-center">{productData.name}</h1>
                    <h2 className="text-xl text-gray-500 mb-8 text-center">Calories & Ingredient Analysis</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BrainCircuit size={24} style={{ color: colors.accentGreen }} /> Nutrition Details</h2>
                                <div className="text-center mb-4 bg-green-50 p-2 rounded-lg"><p className="font-semibold">Showing nutrition for: <span className="text-green-700">{productData.nutrition.serving}</span></p></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                    {Object.entries(productData.nutrition).filter(([key]) => key !== 'serving').map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 capitalize">{key}</p>
                                            <p className="text-2xl font-bold" style={{ color: colors.accentGreen }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="font-bold text-lg mb-2">Calculate for a different serving size:</h3>
                                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                                        <input type="number" value={servingSize} onChange={e => setServingSize(e.target.value)} className="w-full sm:w-1/3 p-2 border rounded-lg" placeholder="e.g., 100" />
                                        <select value={servingUnit} onChange={e => setServingUnit(e.target.value)} className="w-full sm:w-1/3 p-2 border rounded-lg bg-white">
                                            <option value="grams">grams</option>
                                            <option value="piece">piece</option>
                                            <option value="cup">cup</option>
                                            <option value="tbsp">tbsp</option>
                                        </select>
                                        <button onClick={handleRecalculateNutrition} disabled={isRecalculating} className="w-full sm:w-1/3 bg-green-600 text-white p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-gray-400">
                                            {isRecalculating ? <Spinner size="w-5 h-5" /> : <RefreshCw size={16} />}
                                            Recalculate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                             <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles size={24} style={{ color: colors.accentGreen }} /> AI Insights</h2>
                                <div className="space-y-4">
                                    <button onClick={() => getAiInsight('coach')} disabled={aiTip.isLoading && aiTip.type === 'coach'} className="w-full text-left flex items-center justify-between gap-2 text-green-700 font-semibold">
                                        <span>✨ AI Health Coach</span>
                                        {aiTip.isLoading && aiTip.type === 'coach' ? <Spinner size="w-4 h-4" /> : <ChevronRight size={16} />}
                                    </button>
                                    {aiTip.type === 'coach' && !aiTip.isLoading && <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">{aiTip.text}</p>}
                                    
                                    {productData.name === "Full Plate Analysis" && (
                                        <>
                                            <button onClick={() => getAiInsight('improve')} disabled={aiTip.isLoading && aiTip.type === 'improve'} className="w-full text-left flex items-center justify-between gap-2 text-green-700 font-semibold mt-2">
                                                <span>💡 Suggest Improvements</span>
                                                {aiTip.isLoading && aiTip.type === 'improve' ? <Spinner size="w-4 h-4" /> : <ChevronRight size={16} />}
                                            </button>
                                            {aiTip.type === 'improve' && !aiTip.isLoading && <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg mt-2">{aiTip.text}</p>}
                                        </>
                                    )}

                                    {productData.name !== "Full Plate Analysis" && (
                                        <>
                                            <button onClick={() => getAiInsight('recipe')} disabled={aiTip.isLoading && aiTip.type === 'recipe'} className="w-full text-left flex items-center justify-between gap-2 text-green-700 font-semibold mt-2">
                                                <span>🍳 Recipe Idea</span>
                                                {aiTip.isLoading && aiTip.type === 'recipe' ? <Spinner size="w-4 h-4" /> : <ChevronRight size={16} />}
                                            </button>
                                            {aiTip.type === 'recipe' && !aiTip.isLoading && <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg mt-2">{aiTip.text}</p>}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
