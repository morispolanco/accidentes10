import React, { useState, useRef, useEffect, useCallback } from 'react';
import Spinner from './Spinner';

interface CameraModalProps {
  onClose: () => void;
  onPhotoCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onPhotoCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no es compatible con este navegador.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      let message = 'No se pudo acceder a la cámara. ';
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message += 'Por favor, conceda permiso para usar la cámara en la configuración de su navegador.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              message += 'No se encontró ningún dispositivo de cámara.';
          } else {
              message += `Detalle: ${err.message}`;
          }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage && canvasRef.current) {
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                const fileName = `capture-${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                onPhotoCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Tomar Foto</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        
        <div className="flex-grow p-4 bg-gray-900 overflow-hidden flex items-center justify-center">
          {loading && <Spinner />}
          {error && <div className="text-center text-red-400 p-4">{error}</div>}
          {!loading && !error && (
            <div className="relative w-full h-full">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
              )}
            </div>
          )}
           <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="p-4 bg-gray-100 border-t flex justify-center items-center space-x-4">
          {capturedImage ? (
            <>
              <button onClick={handleRetake} className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 transition-all transform hover:scale-105">
                Tomar de Nuevo
              </button>
              <button onClick={handleUsePhoto} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105">
                Usar Foto
              </button>
            </>
          ) : (
            <button onClick={handleCapture} disabled={!stream || loading} className="w-20 h-20 bg-white rounded-full border-4 border-blue-500 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"></button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;