import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-md">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
          <div className="ml-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Generador de Informes de Accidentes IA
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              Analice accidentes con el poder de la IA. Cargue o tome fotos para empezar.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;