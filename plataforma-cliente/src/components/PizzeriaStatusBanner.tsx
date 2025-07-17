import { getPizzeriaStatus } from '@/lib/api';
import { Clock, XCircle } from 'lucide-react';

/**
 * PizzeriaStatusBanner é um Componente de Servidor assíncrono.
 * Ele busca o status atual da pizzaria (aberta/fechada) e os tempos
 * de espera diretamente no servidor antes de renderizar a página.
 */
const PizzeriaStatusBanner = async () => {
  // Chama a função da API para obter o status.
  const status = await getPizzeriaStatus();

  // Caso 1: A chamada à API falhou (ex: backend offline).
  // A função getPizzeriaStatus retorna null nestes casos.
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

  // Caso 2: A pizzaria está aberta.
  if (status.is_open) {
    return (
      <div className="bg-green-600 text-white p-2 text-center text-sm font-semibold">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Estamos Abertos!</span>
          </div>
          <div className="flex gap-4">
            <span>Entrega: ~{status.delivery_time_minutes} min</span>
            <span>Retirada: ~{status.pickup_time_minutes} min</span>
          </div>
        </div>
      </div>
    );
  }

  // Caso 3: A pizzaria está fechada.
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
