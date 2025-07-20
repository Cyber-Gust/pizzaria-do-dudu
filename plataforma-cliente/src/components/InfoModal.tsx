'use client';

import { OperatingHour } from '@/lib/api';
import { useStatus } from '@/components/StatusProvider';
import { X, MapPin, Clock, Bike, Package } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatingHours: OperatingHour[];
}

const InfoModal = ({ isOpen, onClose, operatingHours }: InfoModalProps) => {
  const status = useStatus();

  if (!isOpen) return null;

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5); // Pega apenas os 5 primeiros caracteres (HH:MM)
  };

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
          <div className="text-center">
            <p className="font-bold text-lg">Forneria 360</p>
            <div className="flex items-center justify-center gap-2 mt-1 text-gray-600">
              <MapPin size={16} />
              <span>R. Coronel Tamarindo, 73A - Centro, São João del Rei / MG</span>
            </div>
          </div>
          
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
                            {/* --- ATUALIZAÇÃO AQUI --- */}
                            <span className="text-gray-600">{status.delivery_time_min}-{status.delivery_time_max} min</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package size={18} className="text-gray-700" />
                        <div>
                            <span className="block font-medium">Retirada</span>
                            {/* --- ATUALIZAÇÃO AQUI --- */}
                            <span className="text-gray-600">{status.pickup_time_min}-{status.pickup_time_max} min</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

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
                      {formatTime(day.open_time)} - {formatTime(day.close_time)}
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
