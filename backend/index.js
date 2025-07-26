// backend/index.js

require('dotenv').config(); // Sempre a primeira linha de todas!

// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

// --- [BOA PRÁTICA] DEFININDO CONSTANTES A PARTIR DO PROCESS.ENV ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const clientPlatformUrl = process.env.CLIENT_PLATFORM_URL || 'forneria360.com.br';
const PORT = process.env.PORT || 3001;

// --- INICIALIZAÇÃO DOS CLIENTES E DO APP ---
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


// --- FUNÇÕES AUXILIARES DE MENSAGERIA ---
const sendWhatsappMessage = async (to, body) => {
    try {
        let cleanNumber = String(to).replace(/\D/g, '');
        if (cleanNumber.startsWith('55')) {
            cleanNumber = cleanNumber.substring(2);
        }
        if (cleanNumber.length === 11 && cleanNumber.charAt(2) === '9') {
            const ddd = cleanNumber.substring(0, 2);
            const numberWithoutNine = cleanNumber.substring(3);
            cleanNumber = ddd + numberWithoutNine;
        }
        const finalNumber = `whatsapp:+55${cleanNumber}`;
        const messageOptions = {
            body: body,
            from: twilioWhatsappNumber,
            to: finalNumber
        };
        console.log(`Tentando enviar MENSAGEM LIVRE para ${finalNumber}`);
        await twilioClient.messages.create(messageOptions);
        console.log(`Mensagem livre enviada com sucesso para ${finalNumber}`);
    } catch (error) {
        console.error(`Erro ao enviar mensagem livre para ${to}:`, error.message);
    }
};

const sendWhatsappTemplateMessage = async (to, templateSid, variables) => {
    try {
        let cleanNumber = String(to).replace(/\D/g, '');
        if (cleanNumber.startsWith('55')) {
            cleanNumber = cleanNumber.substring(2);
        }
        if (cleanNumber.length === 11 && cleanNumber.charAt(2) === '9') {
            const ddd = cleanNumber.substring(0, 2);
            const numberWithoutNine = cleanNumber.substring(3);
            cleanNumber = ddd + numberWithoutNine;
        }
        const finalNumber = `whatsapp:+55${cleanNumber}`;
        const messageOptions = {
            contentSid: templateSid,
            contentVariables: JSON.stringify(variables),
            from: twilioWhatsappNumber,
            to: finalNumber
        };
        console.log(`Tentando enviar TEMPLATE ${templateSid} para ${finalNumber} com variáveis:`, JSON.stringify(variables));
        await twilioClient.messages.create(messageOptions);
        console.log(`Template ${templateSid} enviado com sucesso para ${finalNumber}`);
    } catch (error) {
        console.error(`Erro ao enviar template ${templateSid} para ${to}:`, error.message);
        throw error;
    }
};

// --- WEBHOOK DO WHATSAPP ---
app.post('/api/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body.toLowerCase().trim();
    const from = req.body.From.replace('whatsapp:+', '');
    console.log(`Mensagem recebida de ${from}: ${incomingMsg}`);
    handleIncomingMessage(from, incomingMsg);
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
});


// --- LÓGICA DO ATENDENTE AUTOMÁTICO ---
const getGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
};

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
                return `Hoje nós abrimos às *${dayData.open_time}*.`;
            }
            if (i > 0) {
                const dayName = i === 1 ? 'amanhã' : `na próxima ${dayData.day_name}`;
                return `Nosso próximo dia de funcionamento é ${dayName}, a partir das *${dayData.open_time}*.`;
            }
        }
    }
    return 'No momento não temos um próximo horário de funcionamento definido.';
};

const handleIncomingMessage = async (from, incomingMsg) => {
    try {
        const { data: status, error: statusError } = await supabase.from('pizzeria_status').select('is_open').single();
        const { data: hours, error: hoursError } = await supabase.from('operating_hours').select('*').order('day_of_week');
        if (statusError || hoursError) throw new Error('Falha ao buscar informações da pizzaria.');

        const recognizeIntent = (msg) => {
            const lowerCaseMsg = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const intents = {
                TALK_TO_HUMAN: ['falar com', 'atendente', 'ligar', 'telefone', 'contato', 'problema', 'humano', 'falar com alguem', 'ajuda'],
                ORDER: ['pedido', 'pedir', 'cardapio', 'pizza', 'quero', 'gostaria', 'fazer um pedido', 'ver as pizzas', 'menu', 'sabor', 'sabores'],
                HOURS: ['horario', 'horas', 'aberto', 'abrem', 'fechado', 'funcionamento', 'que horas', 'tao aberto', 'ate que horas'],
                ADDRESS: ['endereco', 'local', 'onde fica', 'localizacao', 'rua', 'pegar ai', 'buscar ai', 'retirar'],
                GREETING: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eai', 'tudo bem'],
                THANKS: ['obrigado', 'obg', 'valeu', 'vlw', 'agradecido', 'grato', 'blz', 'beleza'],
            };
            for (const intent in intents) {
                if (intents[intent].some(keyword => lowerCaseMsg.includes(keyword))) return intent;
            }
            return 'UNKNOWN';
        };
        
        const intent = recognizeIntent(incomingMsg);
        let responseMsg = '';
        const greeting = getGreetingByTime();

        switch (intent) {
            case 'TALK_TO_HUMAN':
                const phoneNumber = "(32) 99941-3289"; // Substitua pelo seu telefone
                responseMsg = `Com certeza! Se for algo que precise resolver diretamente com a gente, nosso telefone é o *${phoneNumber}* 📞\n\nNosso atendimento por telefone funciona durante nosso horário de funcionamento, ok?`;
                break;
            case 'ORDER':
                if (status.is_open) {
                    responseMsg = `Opa, que bom que bateu a fome! 🍕\n\nPara ver nosso cardápio completo e fazer seu pedido rapidinho, é só acessar nosso site:\n\n➡️ *${clientPlatformUrl}*\n\nLá você escolhe tudo com calma e o pedido já cai direto na nossa cozinha. Estamos te esperando! 😉`;
                } else {
                    const nextOpening = getNextOpeningTime(hours);
                    responseMsg = `${greeting}! No momento nossa cozinha está descansando. 😴\n\n${nextOpening}\n\nSalve nosso site e, assim que abrirmos, será um prazer te atender!`;
                }
                break;
            case 'HOURS':
                const today = new Date().getDay();
                let hoursText = hours.map(day => {
                    const isToday = day.day_of_week === today;
                    return `${isToday ? '▶️ *HOJE* - ' : ''}*${day.day_name}:* ${day.is_open ? `${day.open_time} às ${day.close_time}` : 'Fechado'}`;
                }).join('\n');
                responseMsg = `Claro! Nosso horário de funcionamento é este aqui:\n\n${hoursText}\n\nQualquer dúvida, é só chamar! 👍`;
                break;
            case 'ADDRESS':
                responseMsg = `Estamos te esperando! Nosso endereço para retirada é:\n\n📍 *R. Coronel Tamarindo, 73A - Centro, São João del Rei*\n\nPara facilitar, aqui está o link direto para o mapa:\nhttps://maps.app.goo.gl/HTKU9ooFeibhL7yz5`;
                break;
            case 'GREETING':
                responseMsg = `${greeting}! Aqui é da Forneria 360, tudo bem? 😊\n\nComo posso te ajudar?`;
                break;
            case 'THANKS':
                responseMsg = `Imagina, por nada! Precisando, é só chamar. 😉`;
                break;
            default:
                responseMsg = `Desculpe, não entendi sua mensagem. 🤔\n\nSe precisar de ajuda com o cardápio, nosso horário ou endereço, pode me perguntar que eu te ajudo! Se preferir, pode pedir para **falar com um atendente**.`;
                break;
        }
        await sendWhatsappMessage(from, responseMsg);
    } catch (error) {
        console.error("Erro no processamento da mensagem:", error);
        await sendWhatsappMessage(from, "Ops! Tivemos um probleminha no nosso sistema. 🤖 Por favor, tente novamente em alguns instantes.");
    }
};

// --- ROTAS DE STATUS ---
app.get('/api/status', async (req, res) => {
    try {
        const { data, error } = await supabase.from('pizzeria_status').select('*').eq('id', 1).single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar status da pizzaria.' }); }
});

app.post('/api/status', async (req, res) => {
    const updateObject = { ...req.body, updated_at: new Date().toISOString() };
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
app.get('/api/orders', async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').select(`*, order_items (*)`).not('status', 'in', '("Finalizado", "Cancelado")').order('created_at', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar pedidos.' }); }
});

app.post('/api/orders', async (req, res) => {
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
        const { data: newOrder, error: orderError } = await supabase.from('orders').insert({ 
            ...orderDetails, 
            observations: observations,
            total_price: itemsTotal, 
            discount_amount: discount_amount,
            delivery_fee: delivery_fee,
            final_price: finalPrice,
            status: 'Aguardando Confirmação'
        }).select().single();
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
        res.status(201).json(completeOrder);
    } catch (error) {
        console.error('ERRO CRÍTICO na rota de criação de pedido:', error);
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

        // --- LÓGICA DE NOTIFICAÇÕES REESTRUTURADA ---
        // IMPORTANTE: Substitua os SIDs pelos seus templates REAIS da Twilio!

        if (newStatus === 'Em Preparo' && updatedOrder.customer_phone) {
            const itemsList = updatedOrder.order_items.map(item => `  - ${item.quantity}x ${item.item_name}`).join('\n');
            await sendWhatsappTemplateMessage(
                updatedOrder.customer_phone,
                'HXb862a844d4eec105b4599954955b87db', // SID para 'confirmacao_preparo'
                {
                    '1': updatedOrder.customer_name,
                    '2': String(updatedOrder.id),
                    '3': itemsList
                }
            );
        }
        
        if (newStatus === 'Pronto para Retirada' && updatedOrder.customer_phone) {
            await sendWhatsappTemplateMessage(
                updatedOrder.customer_phone,
                'HX976f2c60e3c42d8c0c3300f9a726999c', // SID para 'pronto_para_retirada'
                {
                    '1': updatedOrder.customer_name,
                    '2': String(updatedOrder.id)
                }
            );
        }
        
        if (newStatus === 'Saiu para Entrega') {
            if (updatedOrder.customer_phone) {
                await sendWhatsappTemplateMessage(
                    updatedOrder.customer_phone,
                    'HX54b87a9b3d1edbdf621e26c6f1f2b66a', // SID para 'saiu_para_entrega_cliente'
                    {
                        '1': updatedOrder.customer_name,
                        '2': String(updatedOrder.id)
                    }
                );
            }
            if (motoboyId) {
                const { data: motoboy } = await supabase.from('motoboys').select('name, whatsapp_number').eq('id', motoboyId).single();
                if (motoboy && motoboy.whatsapp_number) {
                    const itemsList = updatedOrder.order_items.map(item => `  - ${item.quantity}x ${item.item_name}`).join('\n');
                    const cleanAddress = (updatedOrder.address || '').split('(Taxa:')[0].trim();
                    const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`;
                    const finalizeLink = `https://pizzaria-do-dudu.onrender.com/api/orders/${updatedOrder.id}/finalize`;
                    await sendWhatsappTemplateMessage(
                        motoboy.whatsapp_number,
                        'HXbae18f6ab37cc84be22657bde99aa7f9', // SID para 'nova_entrega_motoboy'
                        {
                            '1': String(updatedOrder.id),
                            '2': updatedOrder.customer_name,
                            '3': updatedOrder.customer_phone,
                            '4': cleanAddress,
                            '5': mapsLink,
                            '6': itemsList,
                            '7': updatedOrder.final_price.toFixed(2),
                            '8': updatedOrder.payment_method,
                            '9': finalizeLink
                        }
                    );
                }
            }
        }
        
        if (newStatus === 'Finalizado' && updatedOrder.customer_phone) {
            const pizzeriaIncome = updatedOrder.final_price - (updatedOrder.delivery_fee || 0);
            await supabase.from('cash_flow').insert([{ description: `Venda do Pedido #${updatedOrder.id}`, type: 'income', amount: pizzeriaIncome, order_id: updatedOrder.id }]);
            setTimeout(async () => {
                try {
                    await sendWhatsappTemplateMessage(
                        updatedOrder.customer_phone,
                        'HX4f53242e7c369f2ad722095c41cd0f46', // SID para 'pedido_feedback'
                        { '1': updatedOrder.customer_name }
                    );
                } catch (e) {
                    console.error(`Erro ao agendar mensagem de feedback para o pedido #${id}:`, e);
                }
            }, 7200000); // 2 horas
        }
        
        if (newStatus === 'Cancelado' && updatedOrder.customer_phone) {
            await sendWhatsappTemplateMessage(
                updatedOrder.customer_phone,
                'HX14009d44439ba3f7981ea7ff7a02ce70', // SID para 'pedido_cancelado'
                {
                    '1': updatedOrder.customer_name,
                    '2': String(updatedOrder.id)
                }
            );
        }
        
        res.status(200).json({ message: `Pedido #${id} atualizado para ${newStatus}`, data: updatedOrder });
    } catch (error) { 
        console.error(`Erro detalhado ao atualizar o pedido #${id}:`, error);
        res.status(500).json({ error: `Erro ao atualizar o pedido #${id}.` }); 
    }
});

// ROTA PARA O MOTOBOY FINALIZAR A ENTREGA (VIA LINK)
app.get('/api/orders/:id/finalize', async (req, res) => {
    const { id } = req.params;
    try {
        // Esta rota apenas atualiza o status. A notificação de feedback é
        // disparada pela rota principal quando o status muda para 'Finalizado'.
        await supabase.from('orders').update({ status: 'Finalizado' }).eq('id', id);
        res.send('<h1>Pedido finalizado com sucesso! Obrigado!</h1>');
    } catch (error) {
        res.status(500).send('<h1>Erro ao finalizar o pedido.</h1>');
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
app.put('/api/cashflow/:id', async (req, res) => {
    const { id } = req.params;
    const { description, amount } = req.body;
    if (!description || !amount) {
        return res.status(400).json({ error: 'Descrição e valor são obrigatórios.' });
    }
    try {
        const { data, error } = await supabase.from('cash_flow').update({ description, amount }).eq('id', id).select().single();
        if (error) throw error;
        res.status(200).json({ message: 'Transação atualizada com sucesso!', data });
    } catch (err) {
        console.error(`Erro ao atualizar transação #${id}:`, err);
        res.status(500).json({ error: 'Erro interno ao atualizar a transação.' });
    }
});
app.delete('/api/cashflow/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('cash_flow').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        console.error(`Erro ao apagar transação #${id}:`, err);
        res.status(500).json({ error: 'Erro interno ao apagar a transação.' });
    }
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

app.post('/api/coupons/validate', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'O código do cupom é obrigatório.' });
    }
    try {
        const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).single();
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
        const { data, error } = await supabase.from('operating_hours').select('*').order('day_of_week', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao buscar horário de funcionamento.' }); }
});
app.put('/api/operating-hours/:day', async (req, res) => {
    const { day } = req.params;
    const { is_open, open_time, close_time } = req.body;
    try {
        const { data, error } = await supabase.from('operating_hours').update({ is_open, open_time, close_time }).eq('day_of_week', day).select().single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) { res.status(500).json({ error: 'Erro ao atualizar horário.' }); }
});

// --- [NOVO] ROTA DE CLIENTES ---
app.post('/api/customers', async (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    const sanitizedPhone = phone.replace(/\D/g, '');
    try {
        const { data, error } = await supabase.from('customers').upsert({ name: name, phone: sanitizedPhone }, { onConflict: 'phone' }).select().single();
        if (error) throw error;
        res.status(200).json({ message: 'Cliente salvo com sucesso!', data });
    } catch (err) {
        console.error('Erro ao salvar cliente:', err);
        res.status(500).json({ error: 'Erro interno ao salvar o cliente.' });
    }
});

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
