// backend/index.js

require('dotenv').config(); // Sempre a primeira linha de todas!

// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

// --- [BOA PRÁTICA] DEFININDO CONSTANTES A PARTIR DO PROCESS.ENV ---
// Pegamos os valores do 'quadro de avisos' (process.env) e guardamos em constantes.

// Credenciais do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Credenciais da Twilio
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;



// Outras Configurações do App
const clientPlatformUrl = process.env.CLIENT_PLATFORM_URL || 'forneria360.com.br';
const PORT = process.env.PORT || 3001;

// --- INICIALIZAÇÃO DOS CLIENTES E DO APP ---

// Verificação para garantir que as credenciais críticas foram carregadas
if (!supabaseUrl || !supabaseKey || !twilioAccountSid || !twilioAuthToken || !twilioWhatsappNumber) {
    console.error("ERRO FATAL: Uma ou mais variáveis de ambiente (Supabase ou Twilio) não foram carregadas. Verifique seu arquivo .env");
    process.exit(1); // Encerra o programa se as variáveis críticas não existirem
}

const supabase = createClient(supabaseUrl, supabaseKey);
const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- [ATUALIZADO] FUNÇÃO AUXILIAR PARA ENVIAR MENSAGENS COM TWILIO ---
/**
 * Envia uma mensagem de WhatsApp usando a API da Twilio.
 * @param {string} to - O número do destinatário.
 * @param {string} body - O corpo da mensagem a ser enviada.
 */
const sendWhatsappMessage = async (to, body) => {
  try {
    // 1. Limpa o número de qualquer caractere não numérico.
    let cleanNumber = String(to).replace(/\D/g, '');

    // 2. Remove o código do país '55' se ele existir, para focar no número local.
    if (cleanNumber.startsWith('55')) {
      cleanNumber = cleanNumber.substring(2);
    }
    // cleanNumber agora é algo como '37999542651'

    // 3. LÓGICA PARA REMOVER O NONO DÍGITO
    // Verifica se o número tem 11 dígitos (DDD + 9 + 8 dígitos) e se o terceiro dígito é '9'
    if (cleanNumber.length === 11 && cleanNumber.charAt(2) === '9') {
        const ddd = cleanNumber.substring(0, 2); // Pega '37'
        const numberWithoutDDD = cleanNumber.substring(2); // Pega '999542651'
        const numberWithoutNine = numberWithoutDDD.substring(1); // Pega '99542651'
        
        // Remonta o número local com 8 dígitos
        cleanNumber = ddd + numberWithoutNine; // vira '3799542651'
        console.log(`Nono dígito removido. Novo número local: ${cleanNumber}`);
    }

    // 4. Adiciona o código do país '55' de volta.
    const finalNumber = `55${cleanNumber}`;

    const messageOptions = {
      body: body,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${finalNumber}`
    };

    console.log(`Tentando enviar via Twilio para ${messageOptions.to}`);
    await twilioClient.messages.create(messageOptions);
    console.log(`Mensagem enviada com sucesso para ${finalNumber}`);

  } catch (error) {
    console.error(`Erro ao enviar mensagem via Twilio para ${to}:`, error.message);
  }
};


// --- [ATUALIZADO] WEBHOOK DO WHATSAPP PARA RECEBER MENSAGENS DA TWILIO ---
app.post('/api/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body.toLowerCase().trim();
    const from = req.body.From.replace('whatsapp:+', '');
    
    console.log(`Mensagem recebida de ${from}: ${incomingMsg}`);
    
    handleIncomingMessage(from, incomingMsg);

    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
});


// --- LÓGICA DE NEGÓCIO (IA) ---
// Esta função não precisa de nenhuma alteração.
const handleIncomingMessage = async (from, incomingMsg) => {
    try {
        const { data: status, error: statusError } = await supabase.from('pizzeria_status').select('is_open').single();
        const { data: hours, error: hoursError } = await supabase.from('operating_hours').select('*').order('day_of_week');
        if (statusError || hoursError) throw new Error('Falha ao buscar informações da pizzaria.');

        const recognizeIntent = (msg) => {
            const intents = {
                ORDER: ['pedido', 'cardápio', 'pizza', 'pedir', 'cardapio', 'quero', 'gostaria'],
                HOURS: ['horário', 'horas', 'aberto', 'abrem', 'fechado', 'funcionamento'],
                ADDRESS: ['endereço', 'local', 'onde fica', 'localização', 'endereco'],
                GREETING: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eai'],
                THANKS: ['obrigado', 'obg', 'valeu', 'vlw', 'agradecido'],
            };
            for (const intent in intents) {
                if (intents[intent].some(k => msg.includes(k))) return intent;
            }
            return 'UNKNOWN';
        };
        
        const intent = recognizeIntent(incomingMsg);
        let responseMsg = '';

        switch (intent) {
            case 'ORDER':
                if (status.is_open) {
                    responseMsg = `Olá! 👋 Que bom que você quer pedir uma pizza!\n\nPara ver nosso cardápio completo e fazer seu pedido de forma rápida e segura, acesse nosso site:\n\n*${clientPlatformUrl}*\n\nÉ só escolher, adicionar no carrinho e finalizar. Estamos te esperando! 😉🍕`;
                } else {
                    const nextOpening = getNextOpeningTime(hours);
                    responseMsg = `Olá! No momento estamos fechados. 😢\n\n${nextOpening}\n\nAssim que abrirmos, será um prazer atender você!`;
                }
                break;
            case 'HOURS':
                const today = new Date().getDay();
                responseMsg = `Nosso horário de funcionamento é:\n`;
                hours.forEach(day => {
                    const isToday = day.day_of_week === today;
                    responseMsg += `\n${isToday ? '*HOJE* - ' : ''}*${day.day_name}:* ${day.is_open ? `${day.open_time} - ${day.close_time}` : 'Fechado'}`;
                });
                break;
            case 'ADDRESS':
                responseMsg = `Claro! Nosso endereço é:\n\n*R. Coronel Tamarindo, 73A - Centro, São João del Rei*\n\nVocê pode ver no mapa e traçar a rota clicando aqui: https://maps.app.goo.gl/exemplo`;
                break;
            case 'GREETING':
                responseMsg = `Olá! Bem-vindo(a) à Pizzaria do Dudo! 🍕\n\nComo posso te ajudar hoje?\n\n`;
                break;
            case 'THANKS':
                responseMsg = `De nada! 😊 Se precisar de mais alguma coisa, é só chamar!`;
                break;
            default: // UNKNOWN
                responseMsg = `Desculpe, não entendi. 🤔`;
                break;
        }
        await sendWhatsappMessage(from, responseMsg);
    } catch (error) {
        console.error("Erro no processamento da IA:", error);
        await sendWhatsappMessage(from, "Ops! Tivemos um probleminha aqui. Tente novamente em alguns instantes.");
    }
};

// Esta função não precisa de nenhuma alteração.
const getNextOpeningTime = (hours) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < 7; i++) {
        const dayToCheckIndex = (currentDay + i) % 7;
        const dayData = hours.find(h => h.day_of_week === dayToCheckIndex);

        if (dayData && dayData.is_open && dayData.open_time) {
            const [openHour, openMinute] = dayData.open_time.split(':').map(Number);
            const openTimeInMinutes = openHour * 60 + openMinute;
            
            if (i === 0 && currentTime < openTimeInMinutes) {
                return `Abrimos *hoje* às ${dayData.open_time}.`;
            }
            if (i > 0) {
                const dayName = i === 1 ? 'amanhã' : `na próxima ${dayData.day_name}`;
                return `Abrimos ${dayName} às ${dayData.open_time}.`;
            }
        }
    }
    return 'Consulte nossos horários para mais detalhes.';
};


// --- ROTAS DE STATUS ---
app.get('/api/status', async (req, res) => {
  try {
    // A busca continua a mesma, mas agora irá retornar os novos campos
    const { data, error } = await supabase.from('pizzeria_status').select('*').eq('id', 1).single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar status da pizzaria.' }); }
});

app.post('/api/status', async (req, res) => {
  // O objeto de atualização agora pode receber os quatro novos campos de tempo
  const updateObject = { ...req.body, updated_at: new Date().toISOString() };
  
  // Remove a verificação antiga para permitir que apenas um campo seja atualizado se necessário
  // if (Object.keys(updateObject).length <= 1) return res.status(400).json({ error: 'Nenhum dado válido para atualização foi enviado.' });

  try {
    const { data, error } = await supabase.from('pizzeria_status').update(updateObject).eq('id', 1).select().single();
    if (error) throw error;
    res.status(200).json({ message: 'Status atualizado com sucesso!', data });
  } catch (error) { 
    console.error("Erro ao atualizar status:", error);
    res.status(500).json({ error: 'Erro ao atualizar o status da pizzaria.' }); 
  }
});

// --- ROTAS DE PEDIDOS ---

// [CORRIGIDO] Rota para buscar os pedidos ativos
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`)
      // A linha abaixo agora ignora tanto 'Finalizado' como 'Cancelado' de forma mais eficiente
      .not('status', 'in', '("Finalizado")') 
      .not('status', 'in', '("Cancelado")') 
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar pedidos.' }); }
});

// [CORRIGIDO] Rota para criar um novo pedido (manual ou via cliente)
app.post('/api/orders', async (req, res) => {
    // Extrai 'observations' explicitamente do corpo da requisição
    const { items, discount_amount = 0, delivery_fee = 0, observations, ...orderDetails } = req.body;
    
    if (!items || !orderDetails.order_type) {
        return res.status(400).json({ error: 'Dados do pedido incompletos.' });
    }
    try {
        const itemsTotal = items.reduce((acc, item) => {
            const extrasTotal = (item.extras || []).reduce((extraAcc, extra) => extraAcc + extra.price, 0);
            return acc + (item.quantity * item.price_per_item) + extrasTotal;
        }, 0);
        
        const finalPrice = (itemsTotal + delivery_fee) - discount_amount;

        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({ 
                ...orderDetails, 
                observations: observations, // Garante que as observações são salvas
                total_price: itemsTotal, 
                discount_amount: discount_amount,
                final_price: finalPrice,
                status: 'Aguardando Confirmação' 
            })
            .select()
            .single();
        if (orderError) throw orderError;
        
        if (items.length > 0) {
            const orderItemsToInsert = items.map(item => ({
                order_id: newOrder.id,
                item_type: item.item_type,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                price_per_item: item.price_per_item,
                selected_extras: item.extras
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
            if (itemsError) {
                await supabase.from('orders').delete().eq('id', newOrder.id);
                throw itemsError;
            }
        }
        
        const { data: completeOrder } = await supabase.from('orders').select('*, order_items(*)').eq('id', newOrder.id).single();

        /*/
        if (completeOrder.customer_phone) {
            const itemsList = completeOrder.order_items.map(item => `  - ${item.quantity}x ${item.item_name}`).join('\n');
            const confirmationMsg = `Olá, ${completeOrder.customer_name}! ✅\n\nConfirmamos o seu pedido *#${completeOrder.id}*! Ele já está na nossa cozinha.\n\n*Resumo do Pedido:*\n${itemsList}\n\n*Total:* R$ ${completeOrder.final_price.toFixed(2)}\n*Pagamento:* ${completeOrder.payment_method}\n\nVamos te atualizando por aqui! 🍕`;
            await sendWhatsappMessage(completeOrder.customer_phone, confirmationMsg);
        }
        */

        res.status(201).json(completeOrder);
    } catch (error) {
        console.error('Erro ao criar novo pedido:', error);
        res.status(500).json({ error: 'Erro interno ao criar o pedido.' });
    }
});

app.post('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { newStatus, motoboyId } = req.body;
    if (!newStatus) return res.status(400).json({ error: 'O novo status é obrigatório.' });
    try {
        const { data: updatedOrder, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id).select('*, order_items(*)').single();
        if (error) throw error;

        if (newStatus === 'Finalizado') {
            await supabase.from('cash_flow').insert([{ description: `Venda do Pedido #${updatedOrder.id}`, type: 'income', amount: updatedOrder.final_price, order_id: updatedOrder.id }]);
        }

        if (newStatus === 'Pronto para Retirada' && updatedOrder.customer_phone) {
            const msg = `Boas notícias! 🎉\n\nSeu pedido *#${updatedOrder.id}* está pronto para retirada!`;
            await sendWhatsappMessage(updatedOrder.customer_phone, msg);
        }
        if (newStatus === 'Saiu para Entrega') {
            if (updatedOrder.customer_phone) {
                const customerMsg = `Seu pedido *#${updatedOrder.id}* saiu para entrega! 🛵\n\nLogo logo chega aí!`;
                await sendWhatsappMessage(updatedOrder.customer_phone, customerMsg);
            }
            if (motoboyId) {
                const { data: motoboy } = await supabase.from('motoboys').select('name, whatsapp_number').eq('id', motoboyId).single();
                if (motoboy && motoboy.whatsapp_number) {
                    const itemsList = Array.isArray(updatedOrder.order_items) 
                        ? updatedOrder.order_items.map(item => {
                            let extrasText = '';
                            if (item.selected_extras && item.selected_extras.length > 0) {
                                extrasText = ` (Adicionais: ${item.selected_extras.map(e => e.name).join(', ')})`;
                            }
                            return `  - ${item.quantity}x ${item.item_name}${extrasText}`;
                        }).join('\n')
                        : 'Itens não detalhados.';

                    const cleanAddress = (updatedOrder.address || '').split('(Taxa:')[0].trim();
                    const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`;
                    const finalizeLink = `https://pizzaria-do-dudu.onrender.com/api/orders/${updatedOrder.id}/finalize`;
                    
                    const message = `*Novo Pedido para Entrega: #${updatedOrder.id}* 🛵\n\n*Cliente:* ${updatedOrder.customer_name}\n*Telefone:* ${updatedOrder.customer_phone}\n\n*Endereço:* ${cleanAddress}\n*Link do Mapa:* ${mapsLink}\n\n---\n*Itens:*\n${itemsList}\n---\n\n*Pagamento na Entrega:*\n*Total:* R$ ${updatedOrder.final_price.toFixed(2)}\n*Forma:* ${updatedOrder.payment_method}\n\n---\n👇 *AO ENTREGAR, CLIQUE AQUI:* 👇\n${finalizeLink}`;
                    await sendWhatsappMessage(motoboy.whatsapp_number, message);
                }
            }
        }
        res.status(200).json({ message: `Pedido #${id} atualizado para ${newStatus}`, data: updatedOrder });
    } catch (error) { 
        console.error(`Erro detalhado ao atualizar o pedido #${id}:`, error);
        res.status(500).json({ error: `Erro ao atualizar o pedido #${id}.` }); 
    }
});

app.get('/api/orders/:id/finalize', async (req, res) => {
    const { id } = req.params;
    try {
        await supabase.from('orders').update({ status: 'Finalizado' }).eq('id', id);
        res.send('<h1>Pedido finalizado com sucesso! Obrigado!</h1>');
    } catch (error) {
        res.status(500).send('<h1>Erro ao finalizar o pedido.</h1>');
    }
});

// ROTA PARA ACEITAR PEDIDO
app.post('/api/orders/:id/accept', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Atualiza o status do pedido para 'Em Preparo'
        const { data: updatedOrder, error } = await supabase
            .from('orders')
            .update({ status: 'Em Preparo' })
            .eq('id', id)
            .select('*, order_items(*)') // Pega o pedido completo com os itens
            .single();

        if (error) throw error;
        if (!updatedOrder) return res.status(404).json({ error: 'Pedido não encontrado.' });

        // 2. MOVE A LÓGICA DE NOTIFICAÇÃO PARA CÁ
        if (updatedOrder.customer_phone) {
            const itemsList = updatedOrder.order_items.map(item => `   - ${item.quantity}x ${item.item_name}`).join('\n');
            const confirmationMsg = `Olá, ${updatedOrder.customer_name}! ✅\n\nConfirmamos o seu pedido *#${updatedOrder.id}*! Ele já está na nossa cozinha.\n\n*Resumo do Pedido:*\n${itemsList}\n\n*Total:* R$ ${updatedOrder.final_price.toFixed(2)}\n*Pagamento:* ${updatedOrder.payment_method}\n\nVamos te atualizando por aqui! 🍕`;
            await sendWhatsappMessage(updatedOrder.customer_phone, confirmationMsg);
        }

        res.status(200).json({ message: 'Pedido aceito com sucesso!', data: updatedOrder });

    } catch (error) {
        console.error(`Erro ao aceitar o pedido #${id}:`, error);
        res.status(500).json({ error: `Erro ao aceitar o pedido #${id}.` });
    }
});

// --- ROTAS DE ESTOQUE: INGREDIENTES ---
app.get('/api/ingredients', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ingredients').select('*').order('name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar ingredientes.' }); }
});
app.post('/api/ingredients', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ingredients').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar ingrediente.' }); }
});
app.put('/api/ingredients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('ingredients').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar ingrediente.' }); }
});
app.delete('/api/ingredients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') {
                return res.status(409).json({ error: 'Não é possível apagar este ingrediente, pois ele está a ser utilizado numa ou mais pizzas. Remova-o primeiro das receitas.' });
            }
            return res.status(400).json({ error: error.message });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro inesperado ao apagar ingrediente:', error);
        res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
    }
});

// --- ROTAS DE ESTOQUE: INGREDIENTES ---
app.get('/api/ingredients', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ingredients').select('*').order('name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar ingredientes.' }); }
});
app.post('/api/ingredients', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ingredients').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar ingrediente.' }); }
});
app.put('/api/ingredients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('ingredients').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar ingrediente.' }); }
});
app.delete('/api/ingredients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) {
            if (error.code === '23503') {
                return res.status(409).json({ error: 'Não é possível apagar este ingrediente, pois ele está a ser utilizado numa ou mais pizzas. Remova-o primeiro das receitas.' });
            }
            return res.status(400).json({ error: error.message });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro inesperado ao apagar ingrediente:', error);
        res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
    }
});

// --- ROTAS DE ESTOQUE: BEBIDAS ---
app.get('/api/drinks', async (req, res) => {
  try {
    const { data, error } = await supabase.from('drinks').select('*').order('name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar bebidas.' }); }
});
app.post('/api/drinks', async (req, res) => {
  try {
    const { data, error } = await supabase.from('drinks').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar bebida.' }); }
});
app.put('/api/drinks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('drinks').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar bebida.' }); }
});
app.delete('/api/drinks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('drinks').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar bebida.' }); }
});

// --- ROTAS DE MOTOBOYS ---
app.get('/api/motoboys', async (req, res) => {
    try {
        const { data, error } = await supabase.from('motoboys').select('*').eq('is_active', true);
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar motoboys.' }); }
});
app.post('/api/motoboys', async (req, res) => {
    try {
        const { data, error } = await supabase.from('motoboys').insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao adicionar motoboy.' }); }
});
app.put('/api/motoboys/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('motoboys').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar motoboy.' }); }
});
app.delete('/api/motoboys/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('motoboys').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar motoboy.' }); }
});

// --- ROTAS DO LIVRO CAIXA ---
app.get('/api/cashflow', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = supabase.from('cash_flow').select('*').order('transaction_date', { ascending: false });
        if (startDate) {
            query = query.gte('transaction_date', new Date(startDate).toISOString());
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setDate(endOfDay.getDate() + 1);
            query = query.lt('transaction_date', endOfDay.toISOString());
        }
        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro ao buscar fluxo de caixa:', error);
        res.status(500).json({ error: 'Erro ao buscar fluxo de caixa.' });
    }
});
app.post('/api/cashflow', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cash_flow').insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao adicionar transação.' }); }
});

// --- ROTA DE RELATÓRIOS ---
app.get('/api/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query = query.lt('created_at', endOfDay.toISOString());
    }
    const { data: allOrdersInPeriod, error: ordersError } = await query;
    if (ordersError) throw ordersError;
    const finalizedOrders = allOrdersInPeriod.filter(order => order.status === 'Finalizado');
    const totalRevenue = finalizedOrders.reduce((acc, order) => acc + order.final_price, 0);
    const totalFinalizedOrders = finalizedOrders.length;
    const finalizedOrderIds = finalizedOrders.map(order => order.id);
    let bestSellers = [];
    if (finalizedOrderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase.from('order_items').select('item_name, quantity').in('order_id', finalizedOrderIds);
        if (itemsError) throw itemsError;
        const productCounts = items.reduce((acc, item) => {
            acc[item.item_name] = (acc[item.item_name] || 0) + item.quantity;
            return acc;
        }, {});
        bestSellers = Object.entries(productCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    }
    res.status(200).json({
      totalRevenue,
      totalOrders: totalFinalizedOrders,
      bestSellers,
      orders: allOrdersInPeriod
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

// --- ROTAS DE CARDÁPIO (PIZZAS) ---
app.get('/api/pizzas', async (req, res) => {
  try {
    const { data, error } = await supabase.from('pizzas').select(`*, pizza_ingredients (ingredient_id)`).order('name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar as pizzas.' }); }
});
app.post('/api/pizzas', async (req, res) => {
  const { ingredient_ids, ...pizzaData } = req.body;
  try {
    const { data: newPizza, error: pizzaError } = await supabase.from('pizzas').insert(pizzaData).select().single();
    if (pizzaError) throw pizzaError;
    if (ingredient_ids && ingredient_ids.length > 0) {
      const ingredientsToInsert = ingredient_ids.map((id) => ({ pizza_id: newPizza.id, ingredient_id: id }));
      const { error: ingredientsError } = await supabase.from('pizza_ingredients').insert(ingredientsToInsert);
      if (ingredientsError) throw ingredientsError;
    }
    res.status(201).json(newPizza);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar a pizza.' }); }
});
app.put('/api/pizzas/:id', async (req, res) => {
  const { id } = req.params;
  const { ingredient_ids, ...pizzaData } = req.body;
  try {
    const { data: updatedPizza, error: pizzaError } = await supabase.from('pizzas').update(pizzaData).eq('id', id).select().single();
    if (pizzaError) throw pizzaError;
    await supabase.from('pizza_ingredients').delete().eq('pizza_id', id);
    if (ingredient_ids && ingredient_ids.length > 0) {
      const ingredientsToInsert = ingredient_ids.map((ing_id) => ({ pizza_id: id, ingredient_id: ing_id }));
      await supabase.from('pizza_ingredients').insert(ingredientsToInsert);
    }
    res.status(200).json(updatedPizza);
  } catch (error) { res.status(500).json({ error: 'Erro ao atualizar a pizza.' }); }
});
app.delete('/api/pizzas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('pizzas').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar a pizza.' }); }
});

// --- ROTAS DE ADICIONAIS (EXTRAS) ---
app.get('/api/extras', async (req, res) => {
  try {
    const { data, error } = await supabase.from('extras').select(`id, price, is_available, ingredients (id, name)`);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar os adicionais.' }); }
});
app.post('/api/extras', async (req, res) => {
  const { ingredient_id, price, name } = req.body;
  try {
    const { data, error } = await supabase.from('extras').insert([{ ingredient_id, price, name, is_available: true }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar o adicional.' }); }
});
app.put('/api/extras/:id', async (req, res) => {
    const { id } = req.params;
    const { price, is_available } = req.body;
    try {
        const { data, error } = await supabase.from('extras').update({ price, is_available }).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar o adicional.' }); }
});
app.delete('/api/extras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('extras').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar o adicional.' }); }
});

// --- ROTAS DE TAXAS DE ENTREGA ---
app.get('/api/delivery-fees', async (req, res) => {
  try {
    const { data, error } = await supabase.from('delivery_fees').select('*').order('neighborhood_name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar taxas de entrega.' }); }
});
app.post('/api/delivery-fees', async (req, res) => {
  try {
    const { data, error } = await supabase.from('delivery_fees').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar taxa de entrega.' }); }
});
app.put('/api/delivery-fees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('delivery_fees').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar taxa de entrega.' }); }
});
app.delete('/api/delivery-fees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('delivery_fees').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar taxa de entrega.' }); }
});

// --- ROTAS DE CUPÕES DE DESCONTO ---
app.get('/api/coupons', async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar cupões.' }); }
});
app.post('/api/coupons', async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao adicionar cupão.' }); }
});
app.put('/api/coupons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('coupons').update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar cupão.' }); }
});
app.delete('/api/coupons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Erro ao apagar cupão.' }); }
});

app.get('/api/coupons/validate/:code', async (req, res) => {
  const { code } = req.params;
  
  if (!code) {
    return res.status(400).json({ error: 'O código do cupom é obrigatório.' });
  }

  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return res.status(404).json({ error: 'Cupom inválido ou não encontrado.' });
    }

    if (!coupon.is_active) {
      return res.status(400).json({ error: 'Este cupom não está mais ativo.' });
    }

    res.status(200).json(coupon);

  } catch (err) {
    console.error('Erro ao validar cupom:', err);
    res.status(500).json({ error: 'Erro interno ao validar o cupom.' });
  }
});

// --- ROTAS DE HORÁRIO DE FUNCIONAMENTO ---
app.get('/api/operating-hours', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('operating_hours')
      .select('*')
      .order('day_of_week', { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar horário de funcionamento.' }); }
});
app.put('/api/operating-hours/:day', async (req, res) => {
    const { day } = req.params;
    const { is_open, open_time, close_time } = req.body;
    try {
        const { data, error } = await supabase
            .from('operating_hours')
            .update({ is_open, open_time, close_time })
            .eq('day_of_week', day)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar horário.' }); }
});

// [NOVO] Rota para cancelar um pedido
app.post('/api/orders/:id/cancel', async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'Cancelado' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      
      if (data.customer_phone) {
          const msg = `Olá, ${data.customer_name}. Gostaríamos de informar que o seu pedido *#${data.id}* foi cancelado"`;
          await sendWhatsappMessage(data.customer_phone, msg);
      }

      res.status(200).json({ message: 'Pedido cancelado com sucesso!', data });
    } catch (error) {
      res.status(500).json({ error: `Erro ao cancelar o pedido #${id}.` });
    }
});

app.get('/api/orders/:id/finalize', async (req, res) => {
    const { id } = req.params;
    try {
        await supabase.from('orders').update({ status: 'Finalizado' }).eq('id', id);
        res.send('<h1>Pedido finalizado com sucesso! Obrigado!</h1>');
    } catch (error) {
        res.status(500).send('<h1>Erro ao finalizar o pedido.</h1>');
    }
});

// --- [NOVO] ROTA DE CLIENTES ---
// Adicione esta rota ao seu backend/index.js

app.post('/api/customers', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
  }

  // Limpa o número de telefone para guardar um formato consistente
  const sanitizedPhone = phone.replace(/\D/g, '');

  try {
    // A função "upsert" tenta atualizar se o telefone já existir,
    // ou insere um novo registo se não existir.
    const { data, error } = await supabase
      .from('customers')
      .upsert(
        { name: name, phone: sanitizedPhone },
        { onConflict: 'phone' } // A coluna 'phone' é usada para detetar conflitos
      )
      .select()
      .single();

    if (error) throw error;
    
    res.status(200).json({ message: 'Cliente salvo com sucesso!', data });
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    res.status(500).json({ error: 'Erro interno ao salvar o cliente.' });
  }
});

// --- [NOVO] ROTA PARA ATUALIZAR UMA TRANSAÇÃO ---
app.put('/api/cashflow/:id', async (req, res) => {
    const { id } = req.params;
    const { description, amount } = req.body; // Apenas permite a atualização da descrição e do valor

    if (!description || !amount) {
        return res.status(400).json({ error: 'Descrição e valor são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('cash_flow')
            .update({ description, amount })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ message: 'Transação atualizada com sucesso!', data });
    } catch (err) {
        console.error(`Erro ao atualizar transação #${id}:`, err);
        res.status(500).json({ error: 'Erro interno ao atualizar a transação.' });
    }
});

// --- [NOVO] ROTA PARA APAGAR UMA TRANSAÇÃO ---
app.delete('/api/cashflow/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('cash_flow')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).send(); // 204 No Content indica sucesso sem corpo de resposta
    } catch (err) {
        console.error(`Erro ao apagar transação #${id}:`, err);
        res.status(500).json({ error: 'Erro interno ao apagar a transação.' });
    }
});

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
