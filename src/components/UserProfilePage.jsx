import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Star, History, LogOut } from 'lucide-react';
import { colors } from './Shared';

export const UserProfilePage = ({ user, userId }) => {
    if (!user || user.isAnonymous) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
                <User size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
                <p className="text-gray-500">You need to be logged in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <img 
                        src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full border-4 border-green-100 shadow-md"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2">{user.displayName || "User"}</h1>
                        <p className="text-gray-600 mb-4">{user.email}</p>
                        <button className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-100 transition flex items-center gap-2 mx-auto md:mx-0">
                            <Settings size={18} /> Edit Profile
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Star className="text-yellow-500" /> Saved Products</h2>
                    <div className="space-y-4">
                        <p className="text-gray-500 text-sm">No products saved yet.</p>
                        {/* Placeholder for saved products */}
                    </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><History className="text-blue-500" /> Recent Scans</h2>
                    <div className="space-y-4">
                        <p className="text-gray-500 text-sm">No recent scans.</p>
                        {/* Placeholder for recent scans */}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
