import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { colors } from './Shared';

export const BlogPage = ({ setPage }) => {
    const articles = [
        {
            title: "Understanding Food Labels in India",
            excerpt: "Learn how to read and interpret the complex nutritional information and ingredient lists on packaged foods.",
            date: "May 12, 2024",
            imageUrl: "https://placehold.co/600x400/F8F4F0/4C5F4E?text=Food+Labels",
            category: "Nutrition"
        },
        {
            title: "The Truth About 'Sugar-Free' Claims",
            excerpt: "Discover the hidden artificial sweeteners used in supposedly healthy products and their impact.",
            date: "May 10, 2024",
            imageUrl: "https://placehold.co/600x400/F8F4F0/4C5F4E?text=Sugar+Free",
            category: "Health"
        },
        {
            title: "Navigating Personal Care Ingredients",
            excerpt: "A guide to avoiding harmful chemicals in shampoos, soaps, and lotions.",
            date: "May 05, 2024",
            imageUrl: "https://placehold.co/600x400/F8F4F0/4C5F4E?text=Personal+Care",
            category: "Skincare"
        }
    ];

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="text-center mb-12">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                    Health & Nutrition Blog
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Stay informed with our latest articles on clean eating, safe products, and healthy living.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article, index) => (
                    <motion.div 
                        key={index} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow cursor-pointer"
                    >
                        <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover" />
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">{article.category}</span>
                                <span className="text-xs text-gray-500">{article.date}</span>
                            </div>
                            <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                            <p className="text-gray-600 mb-4 flex-grow">{article.excerpt}</p>
                            <button className="text-green-600 font-semibold flex items-center gap-1 hover:text-green-800 transition">
                                Read More <BookOpen size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
