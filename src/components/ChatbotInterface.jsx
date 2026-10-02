import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User } from 'lucide-react';
import { colors, Spinner } from './Shared';

export const ChatbotInterface = ({ user, userId, openLoginModal }) => {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi! I am NutriScan AI. Ask me anything about food ingredients, healthy alternatives, or product safety!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        if (!user || user.isAnonymous) {
            openLoginModal();
            return;
        }

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const prompt = `You are NutriScan AI, a helpful health and nutrition assistant focused on Indian consumers. 
        User asks: ${input}`;
        
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const apiKey = "YOUR_GEMINI_API_KEY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            const replyText = result.candidates[0].content.parts[0].text;
            
            setMessages(prev => [...prev, { role: 'model', text: replyText }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl h-[calc(100vh-140px)] flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full overflow-hidden">
                <div className="bg-green-600 text-white p-4 flex items-center gap-3">
                    <Bot size={28} />
                    <div>
                        <h2 className="text-xl font-bold">NutriScan Assistant</h2>
                        <p className="text-sm opacity-80">Online & Ready to Help</p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-md rounded-tl-none border border-gray-100'}`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="bg-white p-4 rounded-2xl shadow-md rounded-tl-none border border-gray-100 flex items-center gap-2">
                                <Spinner size="w-5 h-5" /> <span className="text-sm text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your question here..." 
                        className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center min-w-[50px]"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
