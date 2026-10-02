import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, provider } from '../firebaseConfig';

export const colors = {
  bgLight: '#FAF8F5',
  bgNeutral: '#F8F4F0',
  cardBg: '#FFFFFF',
  textPrimary: '#2c3e50',
  textSecondary: '#576574',
  accentGreen: '#4C5F4E',
  accentBeige: '#C6C0B3',
  safe: '#27ae60',
  limited: '#f39c12',
  harmful: '#e74c3c',
};

export const Spinner = ({ size = 'w-6 h-6' }) => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${size} border-2 border-t-transparent rounded-full`}
        style={{ borderColor: colors.accentGreen }}
    />
);

export const Modal = ({ children, isOpen, onClose }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const LoginModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [verificationCode, setVerificationCode] = React.useState('');
    const [confirmationResult, setConfirmationResult] = React.useState(null);
    const [authMode, setAuthMode] = React.useState('email'); // 'email', 'phone'
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
    }, []);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await confirmationResult.confirm(verificationCode);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6" style={{ color: colors.accentGreen }}>
                    {authMode === 'phone' ? 'Phone Authentication' : (isSignUp ? 'Create an Account' : 'Welcome Back')}
                </h2>
                {error && <p className="text-red-500 mb-4 text-center text-sm">{error}</p>}
                
                {authMode === 'email' ? (
                    <form onSubmit={handleEmailAuth} className="w-full space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition flex justify-center items-center h-12"
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : (isSignUp ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={confirmationResult ? handleVerifyCode : handleSendCode} className="w-full space-y-4">
                        {!confirmationResult ? (
                            <input
                                type="tel"
                                placeholder="Phone Number (e.g. +1234567890)"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition flex justify-center items-center h-12"
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : (confirmationResult ? 'Verify Code' : 'Send Code')}
                        </button>
                    </form>
                )}

                <div className="my-6 flex items-center w-full">
                    <hr className="flex-grow border-gray-300" />
                    <span className="mx-4 text-gray-500 text-sm">OR</span>
                    <hr className="flex-grow border-gray-300" />
                </div>

                <div className="w-full space-y-3">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full border border-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 h-12"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>
                    <button
                        onClick={() => {
                            setAuthMode(authMode === 'email' ? 'phone' : 'email');
                            setError('');
                            setConfirmationResult(null);
                        }}
                        disabled={loading}
                        className="w-full border border-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 h-12"
                    >
                        Continue with {authMode === 'email' ? 'Phone' : 'Email'}
                    </button>
                </div>

                {authMode === 'email' && (
                    <p className="mt-6 text-gray-600 text-sm text-center">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-green-600 font-semibold hover:underline"
                        >
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>
                )}
                
                {/* Invisible reCAPTCHA container for Phone Auth */}
                <div id="recaptcha-container"></div>
            </div>
        </Modal>
    );
};
