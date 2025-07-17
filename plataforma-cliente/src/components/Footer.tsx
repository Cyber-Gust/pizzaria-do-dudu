import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, MapPin } from 'lucide-react';

const Footer = () => {
  // --- ATENÇÃO: Substitua estes links pelos seus dados reais ---
  // Coloque o link do WhatsApp da sua pizzaria aqui
  const whatsappLink = "https://wa.me/5532999999999?text=Olá!%20Gostaria%20de%20fazer%20um%20pedido.";
  
  // Coloque o link do Google Maps da sua pizzaria aqui
  const mapsLink = "https://www.google.com/maps/place/Sua+Pizzaria";

  return (
    // Rodapé com fundo "branco gelo" e uma borda superior sutil
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 py-5">
        
        {/* Container principal com layout flexível */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Lado Esquerdo: Copyright e "Powered by" */}
          <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-4 text-sm text-gray-700">
            
            {/* Copyright da Pizzaria */}
            <div className="flex items-center gap-3">
              <Image 
                src="/logo-redonda.png" 
                alt="Logo Pizzaria do Dudo" 
                width={32} 
                height={32} 
                className="rounded-full" 
              />
              <span className="font-medium">&copy; {new Date().getFullYear()} Forneria 360</span>
            </div>

            {/* Powered by BitBloom AI */}
            <a 
              href="https://bitbloomai.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 hover:text-blue-600 transition-colors"
            >
              <Image 
                src="/bitbloom-logo.png" 
                alt="Logo BitBloom AI" 
                width={32} 
                height={32} 
                className="rounded-full" 
              />
              <span className="font-medium">Powered by BitBloom AI</span>
            </a>
          </div>

          {/* Lado Direito: Botões de Ação */}
          <div className="flex items-center gap-3">
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 bg-green-100 text-green-800 font-bold px-4 py-2 rounded-full hover:bg-green-200 transition-colors text-sm"
            >
              <MessageCircle size={18} />
              <span>Contato</span>
            </a>
            <a 
              href={mapsLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-full hover:bg-blue-200 transition-colors text-sm"
            >
              <MapPin size={18} />
              <span>Localização</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
