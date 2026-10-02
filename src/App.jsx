import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Leaf, Home, PieChart, MessageSquare } from 'lucide-react';
import { auth, db, appId } from './firebaseConfig';
import { colors, Spinner, LoginModal } from './components/Shared';
import { HomePage } from './components/HomePage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { NutritionAnalysisPage } from './components/NutritionAnalysisPage';
import { BlogPage } from './components/BlogPage';
import { ChatbotInterface } from './components/ChatbotInterface';
import { UserProfilePage } from './components/UserProfilePage';

export default function App() {
    const [page, setPage] = useState({ name: 'home', data: null });
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                if (!currentUser.isAnonymous) {
                    const userRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}`);
                    await setDoc(userRef, { email: currentUser.email, name: currentUser.displayName }, { merge: true });
                }
            } else {
                setUser(null);
                setUserId(null);
            }
            setAuthReady(true);
        });

        const attemptSignIn = async () => {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Authentication failed:", error);
            }
        };
        
        if (!auth.currentUser) {
            attemptSignIn();
        }

        return () => unsubscribe();
    }, []);

    const handleNavigation = (targetPage, data = null) => {
        if (['profile'].includes(targetPage) && (!user || user.isAnonymous)) {
            setLoginModalOpen(true);
            return;
        }
        setPage({ name: targetPage, data: data });
    };

    const handleSignOut = async () => {
        await signOut(auth);
        handleNavigation('home');
    };

    const renderPage = () => {
        switch (page.name) {
            case 'home':
                return <HomePage setPage={handleNavigation} />;
            case 'details':
                return <ProductDetailsPage setPage={handleNavigation} productDataOrQuery={page.data} userId={userId} />;
            case 'analysis':
                return <NutritionAnalysisPage setPage={handleNavigation} initialData={page.data} userId={userId} />;
            case 'blog':
                return <BlogPage setPage={handleNavigation} />;
            case 'chatbot':
                return <ChatbotInterface user={user} userId={userId} openLoginModal={() => setLoginModalOpen(true)} />;
            case 'profile':
                 return <UserProfilePage user={user} userId={userId} />;
            default:
                return <HomePage setPage={handleNavigation} />;
        }
    };

    if (!authReady) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgNeutral }}>
                <Spinner size="w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: colors.bgNeutral, color: colors.textPrimary }}>
            <header className="p-4 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('home')}>
                    <Leaf style={{ color: colors.accentGreen }} size={28} />
                    <h1 className="text-2xl font-bold" style={{ color: colors.accentGreen }}>NutriScan AI</h1>
                </div>
                <nav className="hidden md:flex items-center gap-4 md:gap-6">
                    <a onClick={() => handleNavigation('home')} className="cursor-pointer hover:text-green-700 transition-colors font-semibold">Products</a>
                    <a onClick={() => handleNavigation('analysis')} className="cursor-pointer hover:text-green-700 transition-colors font-semibold">Calories Analysis</a>
                    <a onClick={() => handleNavigation('blog')} className="cursor-pointer hover:text-green-700 transition-colors font-semibold">Blog</a>
                    <a onClick={() => handleNavigation('chatbot')} className="cursor-pointer hover:text-green-700 transition-colors font-semibold">Chatbot</a>
                    {user && !user.isAnonymous ? (
                        <div className="relative group">
                            <img src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt="User" className="w-10 h-10 rounded-full cursor-pointer border-2 border-green-500" />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                <a onClick={() => handleNavigation('profile')} className="cursor-pointer flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium"><User size={16} /> Profile</a>
                                <a onClick={handleSignOut} className="cursor-pointer flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium"><LogOut size={16} /> Sign Out</a>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setLoginModalOpen(true)} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-md">
                            <User size={16} /> Login
                        </button>
                    )}
                </nav>
            </header>
            
            <main className="pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={page.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderPage()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden border-t border-gray-100 z-40">
                <div className="flex justify-around items-center h-16">
                     <a onClick={() => handleNavigation('home')} className={`cursor-pointer flex flex-col items-center justify-center transition-colors ${page.name === 'home' || page.name === 'details' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}><Home size={24} /><span className="text-xs font-medium mt-1">Products</span></a>
                     <a onClick={() => handleNavigation('analysis')} className={`cursor-pointer flex flex-col items-center justify-center transition-colors ${page.name === 'analysis' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}><PieChart size={24} /><span className="text-xs font-medium mt-1">Calories</span></a>
                     <a onClick={() => handleNavigation('chatbot')} className={`cursor-pointer flex flex-col items-center justify-center transition-colors ${page.name === 'chatbot' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}><MessageSquare size={24} /><span className="text-xs font-medium mt-1">Chatbot</span></a>
                     <a onClick={() => handleNavigation('profile')} className={`cursor-pointer flex flex-col items-center justify-center transition-colors ${page.name === 'profile' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}><User size={24} /><span className="text-xs font-medium mt-1">Profile</span></a>
                </div>
            </nav>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
        </div>
    );
}
