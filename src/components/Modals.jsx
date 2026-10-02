import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Modal } from './Shared';

export const MultipleItemsModal = ({ isOpen, onClose, items, onSelect, onAnalyzeFullPlate }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">Multiple Items Detected!</h3>
            <p className="text-gray-500 mb-6">Which item would you like to analyze? Or, analyze the entire plate.</p>
            <div className="flex flex-col gap-3">
                <motion.button
                    onClick={onAnalyzeFullPlate}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    whileHover={{ scale: 1.02 }}
                >
                    Analyze Full Plate
                </motion.button>
                <div className="flex items-center my-2">
                    <hr className="flex-grow border-t" /><span className="mx-4 text-gray-400 text-sm">OR SELECT ONE</span><hr className="flex-grow border-t" />
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    {items.map((item, index) => (
                        <motion.button
                            key={index}
                            onClick={() => onSelect(item)}
                            className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {item}
                        </motion.button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export const CameraView = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    setStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    onClose();
                });
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            onCapture(dataUrl.split(',')[1]);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button onClick={handleCapture} className="p-4 bg-white rounded-full shadow-lg">
                        <Camera size={24} className="text-green-600" />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const UrlModal = ({ isOpen, onClose, onAnalyze }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = () => {
        if (!url) return;
        try {
            const path = new URL(url).pathname;
            const keyword = path.split('/').pop().replace(/-/g, ' ').replace('.html', '');
            onAnalyze(keyword);
        } catch (e) {
            onAnalyze(url);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">Analyze Product from URL</h3>
            <p className="text-gray-500 mb-4">Paste a link to a recipe or product page.</p>
            <div className="flex gap-2">
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/product/..." className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Analyze</button>
            </div>
        </Modal>
    );
};
