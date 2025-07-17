// src/app/dashboard/loading.tsx
'use client';

// Este é o nosso componente de tela de carregamento.
// O Next.js irá mostrá-lo automaticamente enquanto as páginas do dashboard carregam.
const LoadingScreen = () => (
    <div className="flex flex-col justify-center items-center h-full min-h-[80vh]">
      {/* Ícone da Forneria (Pizza) a piscar */}
      <svg 
        className="w-24 h-24 text-red-600 animate-pulse" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12a1 1 0 10-2 0 1 1 0 002 0zm4 0a1 1 0 10-2 0 1 1 0 002 0zm-4 4a1 1 0 10-2 0 1 1 0 002 0zm4 0a1 1 0 10-2 0 1 1 0 002 0zm-6 3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm6 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" />
      </svg>
      <p className="mt-4 text-lg text-gray-600">A carregar...</p>
    </div>
  );

export default LoadingScreen;
