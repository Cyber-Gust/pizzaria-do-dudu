'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { getDeliveryFees, createOrder, DeliveryFee, OrderPayload, validateCoupon } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { toast, Toaster } from 'react-hot-toast';
import { Send } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { name, phone, isAuthenticated } = useUserStore();

  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<number>(0);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('cash');
  const [observations, setObservations] = useState('');
  const [address, setAddress] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const whatsappNumber = "5532999413289"; 

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Você precisa fazer login para finalizar o pedido.');
      router.push('/');
    }
    getDeliveryFees().then(setDeliveryFees);
  }, [isAuthenticated, router]);
  
  const subtotal = items.reduce((acc, item) => {
    const extrasTotal = item.extras.reduce((extraAcc, extra) => extraAcc + extra.price, 0);
    return acc + (item.product.price + extrasTotal) * item.quantity;
  }, 0);

  const total = subtotal + (orderType === 'delivery' ? selectedFee : 0) - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      const validCoupon = await validateCoupon(couponCode);
      
      if (validCoupon.discount_type === 'fixed') {
        setDiscount(validCoupon.discount_value);
        toast.success(`Cupom de R$${validCoupon.discount_value.toFixed(2)} aplicado!`);
      } else if (validCoupon.discount_type === 'percentage') {
        const percentageDiscount = (subtotal * validCoupon.discount_value) / 100;
        setDiscount(percentageDiscount);
        toast.success(`Cupom de ${validCoupon.discount_value}% aplicado!`);
      }
      
      setCouponApplied(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Cupom inválido ou expirado.');
      setCouponCode('');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // --- [ATUALIZADO] Usando o seu construtor manual de PIX ---
  const generatePixCode = () => {
    try {
      // Validação inicial
      if (total <= 0) {
        toast.error('Valor inválido para gerar PIX');
        return;
      }

      // Função para calcular CRC16 CCITT
      const crc16 = (str: string) => {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
          crc ^= str.charCodeAt(i) << 8;
          for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
              crc = (crc << 1) ^ 0x1021;
            } else {
              crc <<= 1;
            }
            crc &= 0xFFFF; // Manter apenas 16 bits
          }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
      };

      // Função para formatar campo PIX (ID + Length + Value)
      const formatField = (id: string, value: string) => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
      };

      // Dados do beneficiário
      const pixKey = '59132299000180';
      const merchantName = 'CARLOS EDUARDO DA SILVA'; // 25 caracteres max
      const merchantCity = 'SAO JOAO DEL REI'; // 15 caracteres max
      const amount = total.toFixed(2);
      const transactionId = `PED${Date.now().toString().slice(-8)}`; // ID mais curto

      console.log('Gerando PIX com dados:', {
        pixKey,
        merchantName: `${merchantName} (${merchantName.length} chars)`,
        merchantCity: `${merchantCity} (${merchantCity.length} chars)`,
        amount,
        transactionId
      });

      // Construir payload PIX passo a passo
      let payload = '';
      
      // 00 - Payload Format Indicator
      payload += formatField('00', '01');
      
      // 01 - Point of Initiation Method
      payload += formatField('01', '12');
      
      // 26 - Merchant Account Information (PIX)
      const pixInfo = formatField('00', 'BR.GOV.BCB.PIX') + formatField('01', pixKey);
      payload += formatField('26', pixInfo);
      
      // 52 - Merchant Category Code
      payload += formatField('52', '0000');
      
      // 53 - Transaction Currency (986 = BRL)
      payload += formatField('53', '986');
      
      // 54 - Transaction Amount
      payload += formatField('54', amount);
      
      // 58 - Country Code
      payload += formatField('58', 'BR');
      
      // 59 - Merchant Name
      payload += formatField('59', merchantName);
      
      // 60 - Merchant City
      payload += formatField('60', merchantCity);
      
      // 62 - Additional Data Field Template
      const additionalData = formatField('05', transactionId);
      payload += formatField('62', additionalData);
      
      // 63 - CRC16 (placeholder)
      payload += '6304';
      
      // Calcular CRC16 e substituir placeholder
      const crcValue = crc16(payload);
      payload += crcValue;

      console.log('PIX payload gerado:', payload);
      console.log('Tamanho do payload:', payload.length);
      
      setPixCode(payload);
      toast.success('Código PIX gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro detalhado ao gerar PIX:', error);
      toast.error('Erro ao gerar código PIX. Tente novamente.');
    }
  };
  
  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && !address) {
      toast.error('Por favor, informe o endereço de entrega.');
      return;
    }
    
    setIsProcessing(true);

    const orderPayload: OrderPayload = {
      customer_name: name,
      customer_phone: phone,
      address: orderType === 'delivery' ? `${address} (Taxa: R$ ${selectedFee.toFixed(2)})` : 'Retirada no local',
      payment_method: paymentMethod,
      order_type: orderType,
      items: items.map(item => {
        const itemType = 'stock_quantity' in item.product ? 'drink' : 'pizza';
        const price = typeof item.product.price === 'number' ? item.product.price : parseFloat(item.product.price || '0');

        return {
          item_id: ('type' in item.product && item.product.type === 'half-and-half') ? null : item.product.id,
          item_type: itemType,
          item_name: item.product.name,
          quantity: item.quantity,
          price_per_item: price,
          extras: item.extras || [],
        };
      }),
    };

    try {
      await createOrder(orderPayload);
      toast.success('Pedido realizado com sucesso!');
      
      if (paymentMethod === 'pix') {
        generatePixCode();
      } else {
        clearCart();
        router.push('/');
      }
    } catch (error) {
      console.error("Erro detalhado ao criar pedido:", error);
      toast.error('Houve um erro ao enviar seu pedido.');
      setIsProcessing(false);
    }
  };

  if (pixCode) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold mb-4">Pague com PIX</h1>
        <p className="mb-4">Aponte a câmara do seu telemóvel para o QR Code abaixo.</p>
        <div className="flex justify-center mb-4 p-4 bg-white inline-block rounded-lg shadow-md">
          <QRCodeCanvas value={pixCode} size={256} />
        </div>
        <p className="font-semibold mb-2">Ou use o PIX Copia e Cola:</p>
        <textarea readOnly value={pixCode} className="w-full max-w-md p-2 border rounded-md bg-gray-100 mb-6" />
        
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md my-6 max-w-md mx-auto text-left">
          <p className="font-bold">Atenção! O seu pedido precisa de confirmação.</p>
          <p className="text-sm mt-1">Para que o seu pedido entre na fila de preparação, por favor, **envie o comprovativo do PIX** para o nosso WhatsApp.</p>
        </div>

        <a 
          href={`https://wa.me/${whatsappNumber}?text=Olá!%20Estou%20enviando%20o%20comprovativo%20do%20meu%20pedido.`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-md hover:bg-green-600 transition-colors"
        >
          <Send size={18} />
          Enviar Comprovativo via WhatsApp
        </a>

        <button onClick={() => { clearCart(); router.push('/'); }} className="block mx-auto mt-4 text-sm text-gray-600 hover:underline">
          Concluir e voltar ao início
        </button>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-bold text-lg mb-4">1. Entrega ou Retirada</h2>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="w-full p-2 border rounded-md">
              <option value="delivery">Entrega</option>
              <option value="pickup">Retirada no Local</option>
            </select>
          </div>

          {orderType === 'delivery' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="font-bold text-lg mb-4">2. Endereço e Taxa</h2>
              <input type="text" placeholder="Rua, Número, Bairro" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border rounded-md mb-4" required />
              <select onChange={(e) => setSelectedFee(Number(e.target.value))} className="w-full p-2 border rounded-md" required>
                <option value={0}>Selecione seu bairro...</option>
                {deliveryFees.map(fee => (
                  <option key={fee.id} value={fee.fee_amount}>
                    {fee.neighborhood_name} - R$ {fee.fee_amount.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-bold text-lg mb-4">3. Forma de Pagamento</h2>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full p-2 border rounded-md">
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão (na entrega)</option>
              <option value="pix">PIX</option>
            </select>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-bold text-lg mb-4">4. Observações</h2>
            <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Ex: Pizza sem cebola, troco para R$50, etc." className="w-full p-2 border rounded-md h-24" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4 border-b pb-3">Resumo do Pedido</h2>
          
          <div className="space-y-2 max-h-60 overflow-y-auto mb-3 pr-2">
            {items.map(item => (
              <div key={item.cartItemId} className="flex justify-between text-sm">
                <span className="flex-1 pr-2">{item.quantity}x {item.product.name}</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between">
                <span>Taxa de Entrega</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedFee)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="text"
                placeholder="Cupom de desconto"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied || isApplyingCoupon}
                className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={couponApplied || isApplyingCoupon}
                className="bg-brand-red text-white font-bold px-4 py-2 rounded-md text-sm hover:bg-brand-red-dark disabled:bg-gray-400"
              >
                {isApplyingCoupon ? '...' : 'Aplicar'}
              </button>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto do Cupom</span>
                <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl border-t pt-3 mt-3">
              <span>Total</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
            </div>
          </div>
          <button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full mt-6 bg-green-500 text-white font-bold py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400">
            {isProcessing ? 'Enviando...' : 'Fazer Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
