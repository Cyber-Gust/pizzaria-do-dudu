'use client';

import { OperatingHour } from '@/lib/api';
import { useStatus } from '@/components/StatusProvider'; // Importar para aceder ao status
import { X, MapPin, Clock, Bike, Package } from 'lucide-react'; // Adicionar ícones de entrega

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatingHours: OperatingHour[];
}

const InfoModal = ({ isOpen, onClose, operatingHours }: InfoModalProps) => {
  // Aceder aos dados de status (que contêm os tempos de entrega)
  const status = useStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute -top-3 -right-3 bg-brand-red text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-20"
          aria-label="Fechar modal"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-center mb-4">Informações da Pizzaria</h2>
        
        <div className="space-y-4">
          {/* Nome e Endereço */}
          <div className="text-center">
            <p className="font-bold text-lg">Forneria 360</p>
            <div className="flex items-center justify-center gap-2 mt-1 text-gray-600">
              <MapPin size={16} />
              <span>R. Coronel Tamarindo, 73A - Centro, São João del Rei / MG</span>
            </div>
          </div>
          
          {/* --- NOVA SECÇÃO: TEMPO DE ENTREGA --- */}
          {status && (
            <div>
                <h3 className="font-semibold text-center mb-3 border-t pt-4">
                    Tempo Estimado
                </h3>
                <div className="flex justify-around text-sm">
                    <div className="flex items-center gap-2">
                        <Bike size={18} className="text-gray-700" />
                        <div>
                            <span className="block font-medium">Entrega</span>
                            <span className="text-gray-600">~{status.delivery_time_minutes} min</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package size={18} className="text-gray-700" />
                        <div>
                            <span className="block font-medium">Retirada</span>
                            <span className="text-gray-600">~{status.pickup_time_minutes} min</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Horários de Funcionamento */}
          <div>
            <h3 className="font-semibold text-center mb-3 border-t pt-4">
              <Clock size={18} className="inline-block mr-2" />
              Horário de Funcionamento
            </h3>
            <div className="space-y-2 text-sm">
              {operatingHours.map(day => (
                <div key={day.day_of_week} className="flex justify-between items-center">
                  <span className="font-medium">{day.day_name}</span>
                  {day.is_open ? (
                    <span className="font-semibold text-green-600">
                      {day.open_time} - {day.close_time}
                    </span>
                  ) : (
                    <span className="font-semibold text-red-500">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
