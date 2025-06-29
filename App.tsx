import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import { generateReportFromImages } from './services/geminiService';
import { ReportData } from './types';
import ReportDisplay from './components/ReportDisplay';
import Spinner from './components/Spinner';
import CameraModal from './components/CameraModal'; // Import new component

const USAGE_LIMIT = 10;
const USAGE_COUNT_KEY = 'accidentReportAppUsageCount';

// Camera Icon
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Report Icon
const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


const PhotoPreview: React.FC<{ file: File; onRemove: (file: File) => void }> = ({ file, onRemove }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group w-36 h-36 m-2 animate-fade-in">
      <img src={objectUrl || ''} alt={file.name} className="w-full h-full object-cover rounded-lg shadow-md border-2 border-white" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg"></div>
      <button
        onClick={() => onRemove(file)}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110"
        aria-label="Remove photo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};


const App: React.FC = () => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [usageCount, setUsageCount] = useState<number>(0);

  useEffect(() => {
    try {
        const storedCount = localStorage.getItem(USAGE_COUNT_KEY);
        const count = storedCount ? parseInt(storedCount, 10) : 0;
        if (!isNaN(count)) {
            setUsageCount(count);
        }
    } catch (error) {
        console.error("No se pudo leer el contador de uso desde localStorage", error);
        setUsageCount(0);
    }
  }, []);

  const handleAddPhotos = (newFiles: File[]) => {
    setError(null);
    setPhotos(prevPhotos => {
      const combined = [...prevPhotos, ...newFiles];
      const uniqueFiles = Array.from(new Map(combined.map(file => [file.name, file])).values());
      if (uniqueFiles.length > 10) {
        setError("No puede cargar más de 10 fotos.");
      }
      return uniqueFiles.slice(0, 10);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleAddPhotos(Array.from(event.target.files));
    }
  };

  const handleRemovePhoto = useCallback((fileToRemove: File) => {
    setPhotos(prevPhotos => prevPhotos.filter(photo => photo !== fileToRemove));
  }, []);

  const handleGenerateReport = async () => {
    if (photos.length < 1 || photos.length > 10) {
      setError("Por favor, cargue entre 1 y 10 fotos.");
      return;
    }
    if (usageCount >= USAGE_LIMIT) {
      setError("Ha alcanzado el límite de 10 informes por dispositivo.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const generatedReport = await generateReportFromImages(photos);
      setReport(generatedReport);
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem(USAGE_COUNT_KEY, newCount.toString());
    } catch (e) {
      if (e instanceof Error) {
        setError(`Error al generar el informe: ${e.message}`);
      } else {
        setError("Ocurrió un error inesperado al generar el informe.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setPhotos([]);
    setReport(null);
    setError(null);
    setIsLoading(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      handleAddPhotos(newFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };


  const isButtonDisabled = useMemo(() => {
    return isLoading || photos.length < 1 || photos.length > 10 || usageCount >= USAGE_LIMIT;
  }, [isLoading, photos.length, usageCount]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {!report && !isLoading && (
          <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">Comience su Análisis</h2>
            <p className="text-center text-gray-500 mb-6">Proporcione de 1 a 10 fotos para que la IA genere su informe.</p>
            
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 md:p-10 text-center transition-all duration-300 ${dragOver ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-gray-50'}`}
            >
              <input type="file" multiple accept="image/*" onChange={handleFileChange} id="file-upload" className="hidden"/>
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="mt-2 text-base text-gray-600">
                  <span className="font-semibold text-blue-600 hover:text-blue-700">Haga clic para cargar</span> o arrastre y suelte
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, HEIC, WEBP (Máx. 10 fotos)</p>
              </label>
            </div>
            
            <div className="text-center my-4">
              <span className="text-gray-500 text-sm">O</span>
            </div>

            <div className="text-center">
                <button onClick={() => setIsCameraOpen(true)} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 transition-all transform hover:scale-105">
                    <CameraIcon />
                    Tomar Foto con la Cámara
                </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl text-gray-700">Fotos Seleccionadas ({photos.length}/10)</h3>
                    <button onClick={() => setPhotos([])} className="text-sm font-medium text-blue-600 hover:text-blue-800">Limpiar todo</button>
                </div>
                 <div className="flex flex-wrap justify-center mt-2 bg-gray-100 p-4 rounded-lg">
                    {photos.map((file) => (
                      <PhotoPreview key={file.name + file.lastModified} file={file} onRemove={handleRemovePhoto} />
                    ))}
                </div>
              </div>
            )}
            
            {error && <div className="mt-6 text-center text-red-700 bg-red-100 p-3 rounded-lg font-medium">{error}</div>}

            <div className="mt-8 text-center border-t pt-6">
               {usageCount < USAGE_LIMIT ? (
                 <>
                    <button onClick={handleGenerateReport} disabled={isButtonDisabled} className="w-full md:w-auto inline-flex items-center justify-center bg-blue-600 text-white font-bold py-4 px-10 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100">
                        <ReportIcon />
                        Generar Informe ({photos.length} fotos)
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                        Usos restantes: {USAGE_LIMIT - usageCount}
                    </p>
                 </>
                ) : (
                    <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg font-bold">
                        <p>Ha alcanzado el límite de 10 informes por dispositivo.</p>
                        <p className="font-normal text-sm mt-1">Gracias por utilizar nuestra aplicación.</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        )}

        {report && !isLoading && (
          <div className="animate-fade-in">
            <ReportDisplay report={report} />
            <div className="mt-8 text-center">
              <button onClick={handleReset} className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105">
                  Analizar Otro Accidente
              </button>
            </div>
          </div>
        )}
        {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onPhotoCapture={(file) => handleAddPhotos([file])} />}
      </main>
    </div>
  );
};

export default App;