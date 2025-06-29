import React, { useState, useRef } from 'react';
import { ReportData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Icons for different sections
const SummaryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
);
const VehicleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /><path d="M14 6a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const CauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);
const SpeedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block text-yellow-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
);
const PdfIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a1 1 0 00-.293-.707l-5.657-5.657A1 1 0 009.657 2H4zm6 6a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-3 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);
const NewAnalysisIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface ReportDisplayProps {
  report: ReportData;
  onReset: () => void;
}

const ReportSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <div className="flex items-center border-b border-gray-200 pb-3 mb-4">
      {icon}
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-700 space-y-3 prose max-w-none prose-p:my-1 prose-strong:text-gray-700">{children}</div>
  </div>
);

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!reportContentRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(reportContentRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f0f4f8',
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const imgHeight = canvasHeight / ratio;
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = heightLeft - imgHeight - 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }

        pdf.save(`informe-accidente-${Date.now()}.pdf`);
    } catch (error) {
        console.error("Error al exportar a PDF:", error);
        alert("Ocurrió un error al intentar exportar el informe a PDF.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div ref={reportContentRef} className="p-4 bg-f0f4f8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Informe del Accidente</h2>
            <p className="text-gray-500 mt-1">Este es un análisis generado por IA basado en las imágenes proporcionadas.</p>
        </div>
        
        <ReportSection title="Resumen del Incidente" icon={<SummaryIcon />}>
            <p>{report.summary}</p>
        </ReportSection>

        <ReportSection title="Análisis de Vehículos" icon={<VehicleIcon />}>
            <div className="space-y-6">
            {report.vehicles.map((vehicle, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50/50">
                <h4 className="font-bold text-lg text-blue-800">{vehicle.description}</h4>
                <div className="mt-3 pl-4 border-l-4 border-blue-200 space-y-2">
                    <div>
                        <strong className="font-semibold text-gray-600 block">Análisis de Daños:</strong>
                        <p>{vehicle.damage_analysis}</p>
                    </div>
                    <div className="text-sm bg-yellow-100 text-yellow-800 p-3 rounded-md flex items-start">
                    <SpeedIcon />
                    <div>
                        <strong className="font-semibold">Velocidad de Impacto Estimada:</strong> {vehicle.estimated_impact_speed}
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </ReportSection>

        <ReportSection title="Causa Probable y Culpabilidad" icon={<CauseIcon />}>
            <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-900 p-4 rounded-r-lg">
            <p><strong className="block mb-1">Nota de Culpabilidad:</strong>{report.probable_cause}</p>
            </div>
        </ReportSection>
        
        <div className="mt-6 text-center text-xs text-gray-500 p-4 bg-gray-100 rounded-lg">
            <strong>Descargo de responsabilidad:</strong> Este informe es generado por una inteligencia artificial y se basa únicamente en el análisis visual de las imágenes proporcionadas. No constituye un informe pericial legal ni una determinación definitiva de culpabilidad. Debe ser utilizado únicamente con fines informativos. Se recomienda una inspección profesional para una evaluación completa.
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition-all transform hover:scale-105"
          >
              {isExporting ? <LoadingSpinnerIcon /> : <PdfIcon />}
              <span>{isExporting ? 'Exportando...' : 'Exportar a PDF'}</span>
          </button>
          <button
              onClick={onReset}
              disabled={isExporting}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 transition-all transform hover:scale-105"
          >
              <NewAnalysisIcon />
              <span>Analizar Otro Accidente</span>
          </button>
      </div>
    </div>
  );
};

export default ReportDisplay;