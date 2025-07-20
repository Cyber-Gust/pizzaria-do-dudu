import { getPizzeriaStatus } from '@/lib/api';
import { Clock, XCircle } from 'lucide-react';

const PizzeriaStatusBanner = async () => {
  const status = await getPizzeriaStatus();

  if (!status) {
    return (
      <div className="bg-gray-500 text-white p-2 text-center text-sm font-semibold">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <XCircle size={16} />
          <span>Não foi possível verificar o status da pizzaria.</span>
        </div>
      </div>
    );
  }

  if (status.is_open) {
    return (
      <div className="bg-green-600 text-white p-2 text-center text-sm font-semibold">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Estamos Abertos!</span>
          </div>
          <div className="flex gap-4">
            {/* --- ATUALIZAÇÃO AQUI --- */}
            <span>Entrega: {status.delivery_time_min}-{status.delivery_time_max} min</span>
            <span>Retirada: {status.pickup_time_min}-{status.pickup_time_max} min</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-red text-white p-2 text-center text-sm font-semibold">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <XCircle size={16} />
        <span>Que pena! No momento estamos fechados.</span>
      </div>
    </div>
  );
};

export default PizzeriaStatusBanner;
