// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

// --- CONFIGURAÇÃO DO SUPABASE E EXPRESS ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÃO DO TWILIO ---
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const clientPlatformUrl = process.env.CLIENT_PLATFORM_URL || 'forneria360.com.br';

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(helmet());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));


// --- FUNÇÃO AUXILIAR PARA ENVIAR MENSAGENS (CORRIGIDA) ---
const sendWhatsappMessage = async (to, body) => {
  try {
    // 1. Remove todos os caracteres que não são dígitos
    let sanitizedNumber = to.replace(/\D/g, '');

    // 2. Remove o código do país (55) se ele existir, para focar no número local
    if (sanitizedNumber.startsWith('55')) {
        sanitizedNumber = sanitizedNumber.substring(2);
    }

    // 3. Verifica se é um número de celular com 11 dígitos (DDD + 9 + número)
    if (sanitizedNumber.length === 11) {
      const ddd = sanitizedNumber.substring(0, 2);
      const numberPart = sanitizedNumber.substring(2);

      // Se o número após o DDD começar com '9', removemos este dígito
      if (numberPart.startsWith('9')) {
        const finalNumber = numberPart.substring(1); // Pega os 8 dígitos restantes
        sanitizedNumber = `${ddd}${finalNumber}`;
      }
    }
    
    // 4. Adiciona o código do país (55) de volta para o formato final
    const formattedTo = `55${sanitizedNumber}`;
    
    await axios.post(
      `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedTo, // Envia o número limpo e com código do país, sem '+'
        text: { body: body },
      },
      {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Mensagem enviada para ${formattedTo} via Meta API`);
  } catch (error) {
    console.error(`Erro ao enviar mensagem via Meta API para ${to}:`, error.response ? error.response.data.error.message : error.message);
  }
};


// --- WEBHOOK DO WHATSAPP PARA A META ---
app.use('/api/whatsapp', (req, res) => {
    // Rota GET para verificação do Webhook
    if (req.method === 'GET') {
        if (
            req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === META_VERIFY_TOKEN
        ) {
            console.log("Webhook verificado com sucesso!");
            res.send(req.query['hub.challenge']);
        } else {
            console.error("Falha na verificação do Webhook. Tokens não correspondem.");
            res.sendStatus(400);
        }
    }

    // Rota POST para receber mensagens
    if (req.method === 'POST') {
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];

        if (message && message.type === 'text') {
            const from = message.from; // Número do cliente
            const incomingMsg = message.text.body.toLowerCase().trim();
            
            console.log(`Mensagem recebida de ${from}: ${incomingMsg}`);
            handleIncomingMessage(from, incomingMsg);
        }
        
        res.sendStatus(200);
    }
});

// Função de IA para processar a mensagem
const handleIncomingMessage = async (from, incomingMsg) => {
    try {
        const { data: status, error: statusError } = await supabase.from('pizzeria_status').select('is_open').single();
        const { data: hours, error: hoursError } = await supabase.from('operating_hours').select('*').order('day_of_week');

        if (statusError || hoursError) throw new Error('Falha ao buscar informações da pizzaria.');

        let responseMsg;
        const wantsToOrder = ['pedido', 'cardápio', 'pizza', 'pedir'].some(k => incomingMsg.includes(k));
        const wantsHours = ['horário', 'horas', 'aberto', 'abrem', 'fechado'].some(k => incomingMsg.includes(k));
        const wantsAddress = ['endereço', 'local', 'onde fica'].some(k => incomingMsg.includes(k));

        if (wantsToOrder) {
            if (status.is_open) {
                responseMsg = `Olá! 👋 Que bom que você quer pedir uma pizza!\n\nPara ver nosso cardápio completo e fazer seu pedido de forma rápida, acesse nosso site:\n\n*${clientPlatformUrl}*\n\nÉ só escolher, adicionar no carrinho e finalizar! 😉🍕`;
            } else {
                responseMsg = `Olá! No momento estamos fechados. 😔\n\nNosso horário de funcionamento é:\n`;
                hours.forEach(day => {
                    if (day.is_open) responseMsg += `\n*${day.day_name}:* ${day.open_time} - ${day.close_time}`;
                });
                responseMsg += `\n\nAssim que abrirmos, será um prazer atender você!`;
            }
        } else if (wantsHours) {
            responseMsg = `Nosso horário de funcionamento é:\n`;
            hours.forEach(day => {
                responseMsg += `\n*${day.day_name}:* ${day.is_open ? `${day.open_time} - ${day.close_time}` : 'Fechado'}`;
            });
        } else if (wantsAddress) {
            responseMsg = `Claro! Nosso endereço é:\n\n*Rua Fictícia, 123 - Centro, Sua Cidade*\n\nVocê pode ver no mapa clicando aqui: https://www.google.com/maps/place/Sua+Pizzaria`;
        } else {
            responseMsg = `Olá! Bem-vindo(a) à Pizzaria do Dudo! 🍕\n\nComo posso te ajudar hoje?\n\n1️⃣ Para fazer um *pedido*, digite "pedido".\n2️⃣ Para ver nosso *horário*, digite "horário".`;
        }

        await sendWhatsappMessage(from, responseMsg);

    } catch (error) {
        console.error("Erro no processamento da IA:", error);
        await sendWhatsappMessage(from, "Ops! Tivemos um probleminha aqui. Tente novamente em alguns instantes.");
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
  if (Object.keys(updateObject).length <= 1) return res.status(400).json({ error: 'Nenhum dado válido para atualização foi enviado.' });
  try {
    const { data, error } = await supabase.from('pizzeria_status').update(updateObject).eq('id', 1).select().single();
    if (error) throw error;
    res.status(200).json({ message: 'Status atualizado com sucesso!', data });
  } catch (error) { res.status(500).json({ error: 'Erro ao atualizar o status da pizzaria.' }); }
});

// --- ROTAS DE PEDIDOS ---
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select(`*, order_items (*)`).not('status', 'eq', 'Finalizado').order('created_at', { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar pedidos.' }); }
});

app.post('/api/orders', async (req, res) => {
    const { items, ...orderDetails } = req.body;
    if (!items || items.length === 0 || !orderDetails.order_type) {
        return res.status(400).json({ error: 'Dados do pedido incompletos.' });
    }
    try {
        const totalPrice = items.reduce((acc, item) => {
            const extrasTotal = (item.extras || []).reduce((extraAcc, extra) => extraAcc + extra.price, 0);
            return acc + (item.quantity * item.price_per_item) + extrasTotal;
        }, 0);
        const finalPrice = totalPrice;
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({ ...orderDetails, total_price: totalPrice, final_price: finalPrice, status: 'Em Preparo' })
            .select()
            .single();
        if (orderError) throw orderError;
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
        const { data: completeOrder } = await supabase.from('orders').select('*, order_items(*)').eq('id', newOrder.id).single();

        if (completeOrder.customer_phone) {
            const confirmationMsg = `Olá, ${completeOrder.customer_name}! ✅\n\nSeu pedido *#${completeOrder.id}* foi recebido e já está em preparo.\n\nVamos te atualizando por aqui! 🍕`;
            await sendWhatsappMessage(completeOrder.customer_phone, confirmationMsg);
        }

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
                    const itemsList = updatedOrder.order_items.map(item => `${item.quantity}x ${item.item_name}`).join('\n');
                    const mapsLink = `https://www.google.com/maps/place/${encodeURIComponent(updatedOrder.address || '')}`;
                    const finalizeLink = `https://seu-backend.onrender.com/api/orders/${updatedOrder.id}/finalize`;
                    const message = `*Pedido #${updatedOrder.id}* para entrega!\n\n*CLIENTE:* ${updatedOrder.customer_name}\n*FONE:* ${updatedOrder.customer_phone}\n\n*ENDEREÇO:* ${updatedOrder.address}\n*Maps:* ${mapsLink}\n\n*ITENS:*\n${itemsList}\n\n*TOTAL:* R$ ${updatedOrder.final_price.toFixed(2)}\n\n---\n*Clique para marcar como entregue:*\n${finalizeLink}`;
                    await sendWhatsappMessage(motoboy.whatsapp_number, message);
                }
            }
        }
        res.status(200).json({ message: `Pedido #${id} atualizado para ${newStatus}`, data: updatedOrder });
    } catch (error) { res.status(500).json({ error: `Erro ao atualizar o pedido #${id}.` }); }
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
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
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



// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
