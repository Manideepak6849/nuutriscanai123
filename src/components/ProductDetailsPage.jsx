import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { db, appId } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { colors, Spinner } from './Shared';

export const ProductDetailsPage = ({ setPage, productDataOrQuery, userId }) => {
    const [productData, setProductData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchAnalysisData = async (query) => {
            setIsLoading(true);
            setError('');
            const { query: productName, type: productType } = query;
            const cacheKey = productName.toLowerCase();

            const prompt = `You are an expert in analyzing Indian consumer products. Analyze the following product: "${productName}", which is in the category of "${productType}". Identify harmful chemicals, allergens, and its purpose. Provide a detailed analysis in a valid JSON object format. Do not include any text before or after the JSON object. The JSON object must conform to this schema:
                   { "name": "string", "healthGrade": "string (A-F)", "summary": "string", "ingredients": [ { "name": "string", "type": "string (Natural/Artificial)", "risk": "string", "classification": "string (safe/limited/harmful)" } ], "alternatives": [ { "name": "string", "reason": "string" } ] }`;

            const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } };
            // Replace with your Gemini API key
            const apiKey = "YOUR_GEMINI_API_KEY";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await response.json();
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = JSON.parse(jsonText);
                setProductData(parsedData);
                try {
                    const productRef = doc(db, `/artifacts/${appId}/public/data/products/${cacheKey}`);
                    await setDoc(productRef, parsedData, { merge: true });
                } catch(e) {}
            } catch (err) {
                setError(`Sorry, I couldn't analyze "${productName}".`);
            } finally {
                setIsLoading(false);
            }
        };

        if (typeof productDataOrQuery === 'object' && productDataOrQuery?.query) {
            fetchAnalysisData(productDataOrQuery);
        } else if (typeof productDataOrQuery === 'object' && productDataOrQuery !== null) {
            setProductData(productDataOrQuery);
            setIsLoading(false);
        } else {
            setError("No product data provided.");
            setIsLoading(false);
        }
    }, [productDataOrQuery]);
    
    if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4"><Spinner size="w-12 h-12" /><p>AI is analyzing product...</p></div>;
    if (error) return <div className="min-h-[60vh] flex items-center justify-center text-center text-red-500 p-8">{error}</div>;
    if (!productData) return null;

    const { name, healthGrade, summary, ingredients, alternatives } = productData;
    
    const HealthGrade = ({ grade }) => {
        const gradeColors = { A: 'bg-green-500', B: 'bg-lime-500', C: 'bg-yellow-500', D: 'bg-orange-500', F: 'bg-red-500' };
        return <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg ${gradeColors[grade] || 'bg-gray-400'}`}>{grade}</div>;
    };
    
    const getClassificationStyles = (c) => {
        switch (c) {
            case 'safe': return { icon: <CheckCircle size={20} className="text-green-600" />, bg: 'bg-green-50' };
            case 'limited': return { icon: <AlertCircle size={20} className="text-yellow-600" />, bg: 'bg-yellow-50' };
            case 'harmful': return { icon: <XCircle size={20} className="text-red-600" />, bg: 'bg-red-50' };
            default: return { icon: <HelpCircle size={20} className="text-gray-500" />, bg: 'bg-gray-50' };
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                 <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                    <img src={`https://placehold.co/150x150/F8F4F0/4C5F4E?text=${name.split(' ')[0]}`} alt={name} className="w-32 h-32 rounded-xl object-cover" />
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2">{name}</h1>
                        <p className="text-lg text-gray-600">{summary}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2"><HealthGrade grade={healthGrade} /><span className="font-semibold">Health Grade</span></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Leaf size={24} style={{ color: colors.accentGreen }} /> Ingredient Analysis</h2>
                        <ul className="space-y-4">
                            {ingredients?.map((ing, index) => {
                                const { icon, bg } = getClassificationStyles(ing.classification);
                                return (
                                    <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className={`p-4 rounded-xl flex items-start gap-4 ${bg}`}>
                                        <div className="flex-shrink-0 mt-1">{icon}</div>
                                        <div>
                                            <h3 className={`font-bold text-lg`}>{ing.name} <span className="text-sm font-normal text-gray-500">({ing.type})</span></h3>
                                            <p className="text-gray-600">{ing.risk}</p>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </div>
                     <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Better Alternatives</h2>
                        {alternatives && alternatives.length > 0 ? (
                            <ul className="space-y-4">
                                {alternatives.map((alt, index) => (
                                    <li key={index} className="border-l-4 border-green-500 pl-4">
                                        <h3 className="font-bold text-lg text-green-700">{alt.name}</h3>
                                        <p className="text-gray-600">{alt.reason}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-gray-500">No specific alternatives found.</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
