require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// ==================== ПОЛНАЯ БАЗА ДАННЫХ ИГРЫ ====================

class RussianWorldGame {
    constructor() {
        this.players = new Map();
        this.businesses = new Map();
        this.corporations = new Map();
        this.stockMarket = new Map();
        this.parties = new Map();
        this.games = new Map();
        this.initGameWorld();
        this.startGameCycles();
    }

    initGameWorld() {
        // Фондовый рынок
        this.stockMarket.set('METL', { symbol: 'METL', name: '🏭 МеталлПром', price: 100, volatility: 0.1 });
        this.stockMarket.set('TECH', { symbol: 'TECH', name: '💻 ТехноКорп', price: 150, volatility: 0.15 });
        this.stockMarket.set('OILG', { symbol: 'OILG', name: '🛢️ НефтьГаз', price: 120, volatility: 0.12 });
        this.stockMarket.set('FNBK', { symbol: 'FNBK', name: '🏦 ФинансБанк', price: 200, volatility: 0.08 });

        // Бизнесы
        this.businesses.set(1, { id: 1, name: '🏪 Магазин продуктов', price: 5000, income: 200, type: 'retail', ownerId: null });
        this.businesses.set(2, { id: 2, name: '🏢 Офисное здание', price: 15000, income: 500, type: 'real_estate', ownerId: null });
        this.businesses.set(3, { id: 3, name: '🍽️ Ресторан', price: 25000, income: 800, type: 'restaurant', ownerId: null });
        this.businesses.set(4, { id: 4, name: '🏭 Завод', price: 50000, income: 1500, type: 'industrial', ownerId: null });

        // Тестовый игрок
        this.createPlayer({
            id: 1,
            name: "Тестовый Игрок",
            username: "test",
            balance: 5000
        });
    }

    createPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            username: playerData.username,
            balance: playerData.balance || 1000,
            level: playerData.level || 1,
            reputation: playerData.reputation || 0,
            experience: playerData.experience || 0,
            role: playerData.role || null,
            skills: playerData.skills || {
                law_enforcement: { level: 1, exp: 0 },
                investigation: { level: 1, exp: 0 },
                stealth: { level: 1, exp: 0 },
                hacking: { level: 1, exp: 0 },
                negotiation: { level: 1, exp: 0 },
                management: { level: 1, exp: 0 },
                rhetoric: { level: 1, exp: 0 },
                diplomacy: { level: 1, exp: 0 }
            },
            friends: playerData.friends || [],
            businesses: playerData.businesses || [],
            corporationShares: playerData.corporationShares || {},
            stockPortfolio: playerData.stockPortfolio || {},
            energy: playerData.energy || 100,
            health: playerData.health || 100,
            lastActive: Date.now(),
            dailyBonus: playerData.dailyBonus || { lastClaim: 0, streak: 0 },
            telegramData: playerData.telegramData || {}
        };

        this.players.set(player.id, player);
        return player;
    }

    getPlayer(playerId) {
        return this.players.get(parseInt(playerId));
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // ==================== ЭКОНОМИКА ====================

    workJob(playerId, jobId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, message: 'Игрок не найден' };

        const jobs = {
            1: { name: '💼 Офисный работник', salary: 100, energy: 10 },
            2: { name: '🚚 Водитель', salary: 150, energy: 15 },
            3: { name: '👮 Полицейский', salary: 200, energy: 20, role: 'police' },
            4: { name: '💼 Менеджер', salary: 250, energy: 25, role: 'businessman' },
            5: { name: '🏛️ Помощник депутата', salary: 300, energy: 30, role: 'politician' }
        };

        const job = jobs[jobId];
        if (!job) return { success: false, message: 'Работа не найдена' };
        if (job.role && player.role !== job.role) {
            return { success: false, message: 'Эта работа доступна только ' + this.getRoleName(job.role) };
        }
        if (player.energy < job.energy) {
            return { success: false, message: 'Недостаточно энергии' };
        }

        player.balance += job.salary;
        player.energy -= job.energy;
        player.experience += 10;
        player.lastActive = Date.now();

        // Прокачка навыков
        if (job.role === 'police') this.addSkillExp(playerId, 'law_enforcement', 5);
        if (job.role === 'businessman') this.addSkillExp(playerId, 'management', 5);
        if (job.role === 'politician') this.addSkillExp(playerId, 'rhetoric', 5);

        this.checkLevelUp(player);

        return {
            success: true,
            message: `Вы отработали смену и заработали ${job.salary}Ч`,
            salary: job.salary,
            balance: player.balance,
            energy: player.energy
        };
    }

    claimDailyBonus(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, message: 'Игрок не найден' };

        const now = Date.now();
        const lastClaim = player.dailyBonus.lastClaim;
        const isNewDay = !lastClaim || (now - lastClaim) > 24 * 60 * 60 * 1000;

        if (!isNewDay) {
            return { success: false, message: 'Бонус уже получен сегодня' };
        }

        const baseBonus = 100;
        const streakBonus = player.dailyBonus.streak * 50;
        const totalBonus = baseBonus + streakBonus;

        player.balance += totalBonus;
        player.dailyBonus.streak = isNewDay ? (player.dailyBonus.streak + 1) : 1;
        player.dailyBonus.lastClaim = now;

        return {
            success: true,
            message: `Ежедневный бонус! +${totalBonus}Ч (серия: ${player.dailyBonus.streak} дней)`,
            bonus: totalBonus,
            streak: player.dailyBonus.streak,
            balance: player.balance
        };
    }

    // ==================== СИСТЕМА РОЛЕЙ ====================

    chooseRole(playerId, role) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, message: 'Игрок не найден' };

        const validRoles = ['police', 'businessman', 'politician', 'criminal'];
        if (!validRoles.includes(role)) {
            return { success: false, message: 'Неизвестная роль' };
        }

        player.role = role;
        player.lastActive = Date.now();

        // Бонусы за выбор роли
        const roleBonuses = {
            police: { balance: 500, reputation: 50 },
            businessman: { balance: 1000, reputation: 25 },
            politician: { balance: 800, reputation: 75 },
            criminal: { balance: 1500, reputation: -50 }
        };

        const bonus = roleBonuses[role];
        player.balance += bonus.balance;
        player.reputation += bonus.reputation;

        return {
            success: true,
            message: `🎉 Поздравляем! Вы стали ${this.getRoleName(role)}! Бонус: +${bonus.balance}Ч`,
            role: role,
            bonus: bonus
        };
    }

    getRoleName(role) {
        const names = {
            police: '👮 Полицейский',
            criminal: '🕵️ Преступник',
            businessman: '💼 Бизнесмен',
            politician: '🏛️ Политик'
        };
        return names[role] || role;
    }

    // ==================== СИСТЕМА НАВЫКОВ ====================

    addSkillExp(playerId, skillId, exp) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false };

        if (!player.skills[skillId]) {
            player.skills[skillId] = { level: 1, exp: 0 };
        }

        player.skills[skillId].exp += exp;

        const neededExp = player.skills[skillId].level * 1000;
        if (player.skills[skillId].exp >= neededExp) {
            player.skills[skillId].level++;
            player.skills[skillId].exp = 0;
            return {
                success: true,
                levelUp: true,
                level: player.skills[skillId].level
            };
        }

        return {
            success: true,
            levelUp: false,
            level: player.skills[skillId].level,
            exp: player.skills[skillId].exp
        };
    }

    // ==================== БИЗНЕС-СИСТЕМА ====================

    buyBusiness(playerId, businessId) {
        const player = this.getPlayer(playerId);
        const business = this.businesses.get(businessId);

        if (!player || !business) {
            return { success: false, message: 'Игрок или бизнес не найден' };
        }

        if (business.ownerId) {
            return { success: false, message: 'Бизнес уже куплен' };
        }

        if (player.balance < business.price) {
            return { success: false, message: 'Недостаточно средств' };
        }

        player.balance -= business.price;
        business.ownerId = playerId;
        player.businesses.push(businessId);

        return {
            success: true,
            message: `🎉 Вы купили ${business.name} за ${business.price}Ч`,
            business: business,
            balance: player.balance
        };
    }

    collectBusinessIncome(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, message: 'Игрок не найден' };

        let totalIncome = 0;
        const collectedBusinesses = [];

        for (const businessId of player.businesses) {
            const business = this.businesses.get(businessId);
            if (business && business.ownerId === playerId) {
                totalIncome += business.income;
                collectedBusinesses.push(business.name);
            }
        }

        if (totalIncome === 0) {
            return { success: false, message: 'Нет доходов от бизнесов' };
        }

        player.balance += totalIncome;
        player.lastActive = Date.now();

        return {
            success: true,
            message: `💰 Собрано ${totalIncome}Ч с бизнесов: ${collectedBusinesses.join(', ')}`,
            income: totalIncome,
            businesses: collectedBusinesses,
            balance: player.balance
        };
    }

    // ==================== ФОНДОВЫЙ РЫНОК ====================

    buyStock(playerId, symbol, quantity) {
        const player = this.getPlayer(playerId);
        const stock = this.stockMarket.get(symbol);

        if (!player || !stock) {
            return { success: false, message: 'Игрок или акция не найдена' };
        }

        const totalCost = stock.price * quantity;
        if (player.balance < totalCost) {
            return { success: false, message: 'Недостаточно средств' };
        }

        player.balance -= totalCost;

        if (!player.stockPortfolio[symbol]) {
            player.stockPortfolio[symbol] = { quantity: 0, averagePrice: 0 };
        }

        const portfolio = player.stockPortfolio[symbol];
        const totalQuantity = portfolio.quantity + quantity;
        const totalValue = portfolio.averagePrice * portfolio.quantity + totalCost;

        portfolio.quantity = totalQuantity;
        portfolio.averagePrice = Math.round(totalValue / totalQuantity);

        player.lastActive = Date.now();

        return {
            success: true,
            message: `📈 Куплено ${quantity} акций ${stock.name} за ${totalCost}Ч`,
            stock: symbol,
            quantity: quantity,
            price: stock.price,
            balance: player.balance
        };
    }

    // ==================== КОРПОРАЦИИ ====================

    createCorporation(playerId, name, capital, type) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        if (player.balance < capital) {
            return { success: false, error: 'Недостаточно средств' };
        }

        if (capital < 50000) {
            return { success: false, error: 'Минимальный капитал 50,000Ч' };
        }

        player.balance -= capital;

        const corpId = Date.now();
        const corporation = {
            id: corpId,
            name: name,
            capital: capital,
            type: type,
            ownerId: playerId,
            shares: 1000,
            sharePrice: Math.round(capital / 1000),
            foundedAt: Date.now(),
            profit: 0
        };

        this.corporations.set(corpId, corporation);

        if (!player.corporationShares) {
            player.corporationShares = {};
        }
        player.corporationShares[corpId] = 200; // 20% основателю

        return {
            success: true,
            message: `🏢 Корпорация "${name}" создана!`,
            corporationId: corpId,
            corporation: corporation
        };
    }

    // ==================== МИНИ-ИГРЫ ====================

    startPokerGame(playerId, bet) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        if (player.balance < bet) {
            return { success: false, error: 'Недостаточно средств' };
        }

        player.balance -= bet;
        const gameId = Date.now();

        const game = {
            id: gameId,
            type: 'poker',
            players: [playerId],
            bet: bet,
            pot: bet,
            status: 'waiting',
            created: Date.now()
        };

        this.games.set(gameId, game);
        player.lastActive = Date.now();

        return {
            success: true,
            message: `🎰 Покерная игра создана! Ставка: ${bet}Ч`,
            gameId: gameId,
            game: game
        };
    }

    // ==================== СЛУЖЕБНЫЕ МЕТОДЫ ====================

    checkLevelUp(player) {
        const expNeeded = player.level * 1000;
        if (player.experience >= expNeeded) {
            player.level++;
            player.experience = 0;
            player.balance += player.level * 500;
            return true;
        }
        return false;
    }

    startGameCycles() {
        // Обновление цен акций
        setInterval(() => {
            this.updateStockPrices();
        }, 5 * 60 * 1000);

        // Восстановление энергии
        setInterval(() => {
            this.recoverEnergy();
        }, 60 * 1000);
    }

    updateStockPrices() {
        for (const [symbol, stock] of this.stockMarket) {
            const change = (Math.random() - 0.5) * 2 * stock.volatility * stock.price;
            stock.price = Math.max(10, Math.round(stock.price + change));
        }
    }

    recoverEnergy() {
        for (const player of this.players.values()) {
            if (player.energy < 100) {
                player.energy = Math.min(100, player.energy + 1);
            }
            if (player.health < 100) {
                player.health = Math.min(100, player.health + 0.2);
            }
        }
    }

    getStatistics() {
        const players = this.getAllPlayers();
        const totalBalance = players.reduce((sum, player) => sum + player.balance, 0);
        const activePlayers = players.filter(p => (Date.now() - p.lastActive) < 24 * 60 * 60 * 1000).length;

        return {
            totalPlayers: players.length,
            totalBalance: totalBalance,
            activePlayers: activePlayers,
            totalBusinesses: Array.from(this.businesses.values()).filter(b => b.ownerId).length,
            totalCorporations: this.corporations.size
        };
    }

    getHallOfFame() {
        return this.getAllPlayers()
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10)
            .map(player => ({
                id: player.id,
                name: player.name,
                balance: player.balance,
                level: player.level,
                role: player.role
            }));
    }

    getAvailableJobs(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return [];

        const jobs = [
            { id: 1, name: "💼 Офисный работник", salary: 100, energy: 10, requirements: null },
            { id: 2, name: "🚚 Водитель", salary: 150, energy: 15, requirements: null },
            { id: 3, name: "👮 Полицейский", salary: 200, energy: 20, requirements: 'police' },
            { id: 4, name: "💼 Менеджер", salary: 250, energy: 25, requirements: 'businessman' },
            { id: 5, name: "🏛️ Помощник депутата", salary: 300, energy: 30, requirements: 'politician' }
        ];

        return jobs.filter(job => !job.requirements || player.role === job.requirements);
    }
}

const gameDB = new RussianWorldGame();

// ==================== TELEGRAM BOT ====================

let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('🤖 Telegram Bot ЗАПУЩЕН И РАБОТАЕТ!');

    // Команда /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const username = msg.from.first_name;

        let player = gameDB.getPlayer(userId);
        if (!player) {
            player = gameDB.createPlayer({
                id: userId,
                name: username,
                username: msg.from.username,
                balance: 1000
            });
        }

        const welcomeText = `🎮 Добро пожаловать в РУССКИЙ МИР, ${username}!

🇷🇺 Твоя виртуальная империя ждет тебя!

✨ Доступные возможности:
• 💰 Зарабатывай деньги и строй бизнес-империю
• 🎭 Выбери роль и развивай навыки
• 🏢 Покупай бизнесы и создавай корпорации
• 📈 Играй на бирже и становись миллионером
• 👥 Общайся с другими игроками
• 🎯 Участвуй в выборах и влияй на экономику

💰 Твой стартовый капитал: ${player.balance}Ч
🎯 Уровень: ${player.level}
⚡ Энергия: ${player.energy}/100

🚀 Нажми "🎮 ВОЙТИ В ИГРУ" чтобы начать!`;

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '🎮 ВОЙТИ В ИГРУ',
                        web_app: { url: process.env.TELEGRAM_WEBAPP_URL || `https://${process.env.RAILWAY_STATIC_URL}` }
                    }
                ],
                [
                    { text: '👤 Профиль', callback_data: 'profile' },
                    { text: '💼 Работа', callback_data: 'work' },
                    { text: '🏆 Топ игроков', callback_data: 'top' }
                ]
            ]
        };

        bot.sendMessage(chatId, welcomeText, {
            reply_markup: keyboard,
            parse_mode: 'HTML'
        });
    });

    // Команда /profile
    bot.onText(/\/profile/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const player = gameDB.getPlayer(userId);
        if (player) {
            const roleText = player.role ? gameDB.getRoleName(player.role) : 'Не выбрана';
            const businessesText = player.businesses.length > 0 ? `💼 Бизнесов: ${player.businesses.length}` : '💼 Бизнесов: нет';
            const stocksText = Object.keys(player.stockPortfolio).length > 0 ? `📈 Акций: ${Object.keys(player.stockPortfolio).length}` : '📈 Акций: нет';

            const profileText = `👤 ТВОЙ ПРОФИЛЬ:

💰 Баланс: ${player.balance.toLocaleString()}Ч
🎯 Уровень: ${player.level}
⭐ Репутация: ${player.reputation}
⚡ Энергия: ${player.energy}/100
❤️ Здоровье: ${Math.round(player.health)}/100
🎭 Роль: ${roleText}

${businessesText}
${stocksText}
👥 Друзей: ${player.friends.length}

💪 Навыки:
${Object.entries(player.skills).map(([skill, data]) =>
                `${this.getSkillName(skill)}: ур. ${data.level}`
            ).join('\n')}`;

            bot.sendMessage(chatId, profileText);
        } else {
            bot.sendMessage(chatId, '❌ Ты еще не начал игру. Нажми /start');
        }
    });

    // Команда /work
    bot.onText(/\/work/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const jobs = gameDB.getAvailableJobs(userId);
        const keyboard = {
            inline_keyboard: jobs.map(job => [{
                text: `${job.name} - ${job.salary}Ч (⚡${job.energy})`,
                callback_data: `work_${job.id}`
            }])
        };

        bot.sendMessage(chatId, '💼 Выбери работу для заработка:', {
            reply_markup: keyboard
        });
    });

    // Команда /bonus
    bot.onText(/\/bonus/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const result = gameDB.claimDailyBonus(userId);
        if (result.success) {
            bot.sendMessage(chatId, `🎁 ${result.message}`);
        } else {
            bot.sendMessage(chatId, `❌ ${result.message}`);
        }
    });

    // Команда /top
    bot.onText(/\/top/, (msg) => {
        const chatId = msg.chat.id;
        const topPlayers = gameDB.getHallOfFame().slice(0, 5);

        let topText = '🏆 ТОП-5 ИГРОКОВ:\n\n';
        topPlayers.forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
            topText += `${medal} ${player.name} - 💰 ${player.balance.toLocaleString()}Ч\n`;
        });

        bot.sendMessage(chatId, topText);
    });

    // Обработка callback кнопок
    bot.on('callback_query', (callbackQuery) => {
        const msg = callbackQuery.message;
        const data = callbackQuery.data;
        const userId = callbackQuery.from.id;

        if (data === 'profile') {
            bot.sendMessage(msg.chat.id, 'Используй команду /profile для просмотра профиля');
        }
        else if (data === 'work') {
            bot.sendMessage(msg.chat.id, 'Используй команду /work для выбора работы');
        }
        else if (data === 'top') {
            bot.sendMessage(msg.chat.id, 'Используй команду /top для просмотра топа игроков');
        }
        else if (data.startsWith('work_')) {
            const jobId = parseInt(data.split('_')[1]);
            const result = gameDB.workJob(userId, jobId);

            if (result.success) {
                bot.sendMessage(msg.chat.id, `✅ ${result.message}\n💵 Баланс: ${result.balance}Ч\n⚡ Энергия: ${result.energy}/100`);
            } else {
                bot.sendMessage(msg.chat.id, `❌ ${result.message}`);
            }
        }
    });

    // Вспомогательная функция для названий навыков
    bot.getSkillName = function (skill) {
        const names = {
            'law_enforcement': '👮 Правоприменение',
            'investigation': '🔍 Расследование',
            'stealth': '🕵️ Скрытность',
            'hacking': '💻 Взлом',
            'negotiation': '💬 Переговоры',
            'management': '📊 Управление',
            'rhetoric': '🎤 Риторика',
            'diplomacy': '🕊️ Дипломатия'
        };
        return names[skill] || skill;
    };
}

// ==================== EXPRESS SETUP ====================

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// ==================== WEBAPP ROUTE ====================

app.get('/', (req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html lang="ru">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🇷🇺 Русский Мир - Виртуальная Империя</title>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              padding: 15px;
          }
          .container { max-width: 100%; }
          .header { 
              text-align: center; 
              padding: 20px 0; 
              background: rgba(0,0,0,0.3); 
              border-radius: 15px; 
              margin-bottom: 20px; 
          }
          .user-info {
              background: rgba(255,255,255,0.2);
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 15px;
              text-align: center;
          }
          .stats-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin-bottom: 15px; 
          }
          .stat-card { 
              background: rgba(255,255,255,0.2); 
              padding: 12px; 
              border-radius: 10px; 
              text-align: center; 
              font-size: 14px;
          }
          .nav { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px; 
              margin-bottom: 20px; 
          }
          .nav-btn { 
              padding: 15px; 
              background: rgba(255,255,255,0.2); 
              border: none; 
              border-radius: 10px; 
              color: white; 
              cursor: pointer; 
              font-size: 14px; 
              transition: all 0.3s;
          }
          .nav-btn:hover { background: rgba(255,255,255,0.3); }
          .section { 
              background: rgba(255,255,255,0.1); 
              padding: 15px; 
              border-radius: 15px; 
              margin-bottom: 15px; 
              display: none; 
          }
          .section.active { display: block; }
          .btn { 
              background: #4CAF50; 
              color: white; 
              padding: 12px; 
              border: none; 
              border-radius: 8px; 
              cursor: pointer; 
              margin: 5px 0;
              font-size: 14px;
              width: 100%;
              transition: all 0.3s;
          }
          .btn:hover { background: #45a049; }
          .btn-warning { background: #ff9800; }
          .btn-warning:hover { background: #e68900; }
          .btn-danger { background: #f44336; }
          .btn-danger:hover { background: #da190b; }
          .btn-telegram { 
              background: #0088cc; 
              margin: 10px 0;
          }
          .btn-telegram:hover { background: #006699; }
          .player-card { 
              background: rgba(255,255,255,0.15); 
              padding: 12px; 
              border-radius: 10px; 
              border-left: 4px solid #4CAF50;
              margin-bottom: 10px;
          }
          .business-card, .stock-card {
              background: rgba(255,255,255,0.15);
              padding: 12px;
              border-radius: 10px;
              margin-bottom: 10px;
              border-left: 4px solid #2196F3;
          }
          .skill-bar {
              background: rgba(255,255,255,0.2);
              border-radius: 10px;
              padding: 8px;
              margin: 5px 0;
          }
          .skill-level {
              background: #4CAF50;
              height: 8px;
              border-radius: 4px;
              margin-top: 5px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🇷🇺 РУССКИЙ МИР</h1>
              <p>Виртуальная экономическая империя</p>
          </div>

          <div class="user-info">
              <h3 id="userName">Загрузка...</h3>
              <div id="userStats" class="stats-grid"></div>
          </div>

          <div class="nav">
              <button class="nav-btn" onclick="showSection('dashboard')">📊 Дашборд</button>
              <button class="nav-btn" onclick="showSection('economy')">💰 Экономика</button>
              <button class="nav-btn" onclick="showSection('roles')">🎭 Роли</button>
              <button class="nav-btn" onclick="showSection('skills')">🎯 Навыки</button>
              <button class="nav-btn" onclick="showSection('business')">🏢 Бизнес</button>
              <button class="nav-btn" onclick="showSection('stocks')">📈 Акции</button>
              <button class="nav-btn" onclick="showSection('corporations')">🏭 Корпорации</button>
              <button class="nav-btn" onclick="showSection('games')">🎮 Игры</button>
          </div>

          <!-- Dashboard Section -->
          <div id="dashboard" class="section active">
              <h3>📊 ОБЗОР ИМПЕРИИ</h3>
              <button class="btn btn-telegram" onclick="claimDailyBonus()">🎁 ПОЛУЧИТЬ ЕЖЕДНЕВНЫЙ БОНУС</button>
              <div id="playerOverview" class="stats-grid"></div>
              
              <h3>🏆 ТОП ИГРОКОВ</h3>
              <div id="topPlayers"></div>
          </div>

          <!-- Economy Section -->
          <div id="economy" class="section">
              <h3>💰 ЭКОНОМИКА</h3>
              <div class="stats-grid">
                  <div class="stat-card">
                      <h4>💼 Работа</h4>
                      <div id="jobsList"></div>
                  </div>
                  <div class="stat-card">
                      <h4>🎁 Бонусы</h4>
                      <button class="btn" onclick="claimDailyBonus()">🎁 Ежедневный бонус</button>
                  </div>
              </div>
          </div>

          <!-- Roles Section -->
          <div id="roles" class="section">
              <h3>🎭 ВЫБЕРИ СВОЮ РОЛЬ</h3>
              <div class="stats-grid">
                  <button class="btn" onclick="chooseRole('police')">👮 Полицейский</button>
                  <button class="btn" onclick="chooseRole('businessman')">💼 Бизнесмен</button>
                  <button class="btn" onclick="chooseRole('politician')">🏛️ Политик</button>
                  <button class="btn btn-warning" onclick="chooseRole('criminal')">🕵️ Преступник</button>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-top: 15px;">
                  <h4>ℹ️ Описание ролей:</h4>
                  <p><strong>👮 Полицейский</strong> - охрана порядка, аресты, патрулирование</p>
                  <p><strong>💼 Бизнесмен</strong> - развитие бизнеса, инвестиции, корпорации</p>
                  <p><strong>🏛️ Политик</strong> - принятие законов, влияние на экономику</p>
                  <p><strong>🕵️ Преступник</strong> - ограбления, теневая экономика</p>
              </div>
          </div>

          <!-- Skills Section -->
          <div id="skills" class="section">
              <h3>🎯 НАВЫКИ И ПРОКАЧКА</h3>
              <div id="skillsList"></div>
              
              <h4>💪 Тренировать навык</h4>
              <select id="skillSelect" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                  <option value="law_enforcement">👮 Правоприменение</option>
                  <option value="investigation">🔍 Расследование</option>
                  <option value="stealth">🕵️ Скрытность</option>
                  <option value="hacking">💻 Взлом</option>
                  <option value="negotiation">💬 Переговоры</option>
                  <option value="management">📊 Управление</option>
                  <option value="rhetoric">🎤 Риторика</option>
                  <option value="diplomacy">🕊️ Дипломатия</option>
              </select>
              <input type="number" id="skillExp" placeholder="Опыт для добавления" value="100" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
              <button class="btn" onclick="addSkillExperience()">🎯 Прокачать навык</button>
          </div>

          <!-- Business Section -->
          <div id="business" class="section">
              <h3>🏢 БИЗНЕС-ИМПЕРИЯ</h3>
              <button class="btn" onclick="loadBusinesses()">🔄 Обновить список</button>
              <button class="btn" onclick="collectBusinessIncome()">💰 Собрать доход</button>
              
              <h4>🛒 Доступные бизнесы</h4>
              <div id="availableBusinesses"></div>
              
              <h4>🏭 Мои бизнесы</h4>
              <div id="myBusinesses"></div>
          </div>

          <!-- Stocks Section -->
          <div id="stocks" class="section">
              <h3>📈 ФОНДОВЫЙ РЫНОК</h3>
              <div id="stockMarket" class="stats-grid"></div>
              
              <h4>💼 Мой портфель</h4>
              <div id="stockPortfolio"></div>
              
              <h4>💰 Купить акции</h4>
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                  <select id="stockSymbol" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                      <option value="METL">🏭 МеталлПром (METL)</option>
                      <option value="TECH">💻 ТехноКорп (TECH)</option>
                      <option value="OILG">🛢️ НефтьГаз (OILG)</option>
                      <option value="FNBK">🏦 ФинансБанк (FNBK)</option>
                  </select>
                  <input type="number" id="stockQuantity" placeholder="Количество" value="1" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                  <button class="btn" onclick="buyStock()">💰 Купить акции</button>
              </div>
          </div>

          <!-- Corporations Section -->
          <div id="corporations" class="section">
              <h3>🏭 КОРПОРАЦИИ</h3>
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 10px 0;">
                  <h4>Создать корпорацию</h4>
                  <input type="text" id="corpName" placeholder="Название корпорации" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                  <input type="number" id="corpCapital" placeholder="Капитал (мин. 50,000)" value="50000" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                  <select id="corpType" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                      <option value="industrial">Промышленность</option>
                      <option value="technology">Технологии</option>
                      <option value="finance">Финансы</option>
                  </select>
                  <button class="btn" onclick="createCorporation()">🏢 Создать корпорацию</button>
              </div>
              <div id="myCorporations"></div>
          </div>

          <!-- Games Section -->
          <div id="games" class="section">
              <h3>🎮 МИНИ-ИГРЫ</h3>
              <div class="stats-grid">
                  <div class="stat-card">
                      <h4>🎰 Покер</h4>
                      <p>Техасский Холдем</p>
                      <input type="number" id="pokerBet" placeholder="Ставка" value="1000" style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 5px; border: none;">
                      <button class="btn" onclick="startPokerGame()">🎰 Начать игру</button>
                  </div>
              </div>
              
              <h4>🎯 Активные игры</h4>
              <div id="activeGames"></div>
          </div>
      </div>

      <script>
          let currentPlayerId = null;
          let currentPlayer = null;

          // Инициализация
          function init() {
              // Если в Telegram - используем данные пользователя
              if (window.Telegram && Telegram.WebApp) {
                  const tg = Telegram.WebApp;
                  tg.expand();
                  tg.ready();
                  
                  const user = tg.initDataUnsafe?.user;
                  if (user) {
                      currentPlayerId = user.id;
                      document.getElementById('userName').textContent = user.first_name + (user.username ? ' (@' + user.username + ')' : '');
                      registerUser(user);
                  }
              } else {
                  // Для браузера - создаем тестового пользователя
                  currentPlayerId = 1;
                  document.getElementById('userName').textContent = 'Тестовый Игрок';
                  registerUser({ id: 1, first_name: 'Тестовый Игрок' });
              }
              loadAllData();
          }

          async function registerUser(userData) {
              try {
                  const response = await fetch('/api/telegram/auth', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(userData)
                  });
                  currentPlayer = await response.json();
                  updatePlayerDisplay();
              } catch (error) {
                  console.error('Ошибка регистрации:', error);
              }
          }

          function updatePlayerDisplay() {
              if (currentPlayer) {
                  document.getElementById('userStats').innerHTML = 
                      '<div class="stat-card">💰 Баланс<br>' + currentPlayer.balance.toLocaleString() + 'Ч</div>' +
                      '<div class="stat-card">🎯 Уровень<br>' + currentPlayer.level + '</div>' +
                      '<div class="stat-card">⚡ Энергия<br>' + currentPlayer.energy + '/100</div>' +
                      '<div class="stat-card">❤️ Здоровье<br>' + Math.round(currentPlayer.health) + '/100</div>';
              }
          }

          function showSection(sectionId) {
              document.querySelectorAll('.section').forEach(section => {
                  section.classList.remove('active');
              });
              document.getElementById(sectionId).classList.add('active');
              
              // Загружаем данные для секции
              switch(sectionId) {
                  case 'dashboard':
                      loadDashboard();
                      break;
                  case 'economy':
                      loadEconomy();
                      break;
                  case 'roles':
                      loadRoles();
                      break;
                  case 'skills':
                      loadSkills();
                      break;
                  case 'business':
                      loadBusiness();
                      break;
                  case 'stocks':
                      loadStocks();
                      break;
                  case 'corporations':
                      loadCorporations();
                      break;
                  case 'games':
                      loadGames();
                      break;
              }
          }

          async function loadAllData() {
              loadDashboard();
              loadEconomy();
              loadRoles();
              loadSkills();
              loadBusiness();
              loadStocks();
              loadCorporations();
              loadGames();
          }

          // Базовые функции API
          async function apiCall(endpoint) {
              try {
                  const response = await fetch(endpoint);
                  return await response.json();
              } catch (error) {
                  alert('Ошибка соединения: ' + error.message);
                  return null;
              }
          }

          // ==================== DASHBOARD FUNCTIONS ====================

          async function loadDashboard() {
              const player = await apiCall('/api/player/' + currentPlayerId);
              if (!player) return;

              document.getElementById('playerOverview').innerHTML = 
                  '<div class="stat-card">💼 Бизнесов<br>' + player.businesses.length + '</div>' +
                  '<div class="stat-card">🏢 Корпораций<br>' + (player.corporationShares ? Object.keys(player.corporationShares).length : 0) + '</div>' +
                  '<div class="stat-card">📈 Акций<br>' + (player.stockPortfolio ? Object.keys(player.stockPortfolio).length : 0) + '</div>' +
                  '<div class="stat-card">👥 Друзей<br>' + player.friends.length + '</div>';

              const topPlayers = await apiCall('/api/hall-of-fame');
              if (topPlayers) {
                  document.getElementById('topPlayers').innerHTML = topPlayers.slice(0, 5).map((player, index) => {
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
                      return '<div class="player-card">' +
                             '<strong>' + medal + ' ' + player.name + '</strong><br>' +
                             '💰 ' + player.balance.toLocaleString() + 'Ч | ' + 
                             (player.role ? getRoleName(player.role) : 'Нет роли') +
                             '</div>';
                  }).join('');
              }
          }

          // ==================== ECONOMY FUNCTIONS ====================

          async function loadEconomy() {
              const jobs = await apiCall('/api/available-jobs/' + currentPlayerId);
              if (jobs) {
                  document.getElementById('jobsList').innerHTML = jobs.map(job => 
                      '<div class="player-card">' +
                      '<strong>' + job.name + '</strong><br>' +
                      '💰 Зарплата: ' + job.salary + 'Ч<br>' +
                      '⚡ Энергия: ' + job.energy + '<br>' +
                      '<button class="btn" onclick="work(' + job.id + ')">💼 Работать</button>' +
                      '</div>'
                  ).join('');
              }
          }

          async function work(jobId) {
              const result = await apiCall('/api/work/' + currentPlayerId + '/' + jobId);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance = result.balance;
                  currentPlayer.energy = result.energy;
                  updatePlayerDisplay();
                  loadEconomy();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          async function claimDailyBonus() {
              const result = await apiCall('/api/daily-bonus/' + currentPlayerId);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance = result.balance;
                  updatePlayerDisplay();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          // ==================== ROLES FUNCTIONS ====================

          async function loadRoles() {
              const player = await apiCall('/api/player/' + currentPlayerId);
              if (!player) return;

              if (player.role) {
                  document.getElementById('currentRoleInfo').innerHTML = 
                      '<div class="stat-card">' +
                      '<h4>Текущая роль: ' + getRoleName(player.role) + '</h4>' +
                      '<p>Вы уже выбрали роль. Для смены обратитесь к администратору.</p>' +
                      '</div>';
              }
          }

          async function chooseRole(role) {
              if (currentPlayer && currentPlayer.role) {
                  alert('⚠️ Вы уже выбрали роль!');
                  return;
              }

              const result = await apiCall('/api/choose-role/' + currentPlayerId + '/' + role);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer = await apiCall('/api/player/' + currentPlayerId);
                  updatePlayerDisplay();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          // ==================== SKILLS FUNCTIONS ====================

          async function loadSkills() {
              const player = await apiCall('/api/player/' + currentPlayerId);
              if (!player || !player.skills) {
                  document.getElementById('skillsList').innerHTML = '<p>Навыки появятся после выбора роли</p>';
                  return;
              }

              document.getElementById('skillsList').innerHTML = Object.entries(player.skills).map(([skill, data]) => {
                  const skillNames = {
                      'law_enforcement': '👮 Правоприменение',
                      'investigation': '🔍 Расследование', 
                      'stealth': '🕵️ Скрытность',
                      'hacking': '💻 Взлом',
                      'negotiation': '💬 Переговоры',
                      'management': '📊 Управление',
                      'rhetoric': '🎤 Риторика',
                      'diplomacy': '🕊️ Дипломатия'
                  };
                  
                  const progress = (data.exp / (data.level * 1000)) * 100;
                  
                  return '<div class="skill-bar">' +
                         '<strong>' + (skillNames[skill] || skill) + '</strong>' +
                         '<div>Уровень ' + data.level + ' (' + data.exp + '/' + (data.level * 1000) + ' опыта)</div>' +
                         '<div class="skill-level" style="width: ' + progress + '%"></div>' +
                         '</div>';
              }).join('');
          }

          async function addSkillExperience() {
              const skillId = document.getElementById('skillSelect').value;
              const exp = parseInt(document.getElementById('skillExp').value);
              
              if (!exp || exp <= 0) {
                  alert('❌ Введите корректное значение опыта');
                  return;
              }

              const result = await apiCall('/api/skills/add-exp/' + currentPlayerId + '/' + skillId + '/' + exp);
              if (result && result.success) {
                  if (result.levelUp) {
                      alert('🎉 Навык прокачан до уровня ' + result.level + '!');
                  } else {
                      alert('✅ Опыт добавлен! Текущий уровень: ' + result.level);
                  }
                  loadSkills();
              } else {
                  alert('❌ Не удалось прокачать навык');
              }
          }

          // ==================== BUSINESS FUNCTIONS ====================

          async function loadBusiness() {
              const businesses = await apiCall('/api/businesses');
              if (businesses) {
                  document.getElementById('availableBusinesses').innerHTML = businesses.map(business => 
                      '<div class="business-card">' +
                      '<strong>' + business.name + '</strong><br>' +
                      '💰 Цена: ' + business.price.toLocaleString() + 'Ч<br>' +
                      '📈 Доход: ' + business.income + 'Ч/сбор<br>' +
                      '<button class="btn" onclick="buyBusiness(' + business.id + ')">🛒 Купить</button>' +
                      '</div>'
                  ).join('');
              }

              const player = await apiCall('/api/player/' + currentPlayerId);
              if (player && player.businesses.length > 0) {
                  document.getElementById('myBusinesses').innerHTML = player.businesses.map(businessId => 
                      '<div class="business-card">' +
                      '<strong>Бизнес #' + businessId + '</strong><br>' +
                      '💰 Приносит доход<br>' +
                      '<button class="btn" onclick="collectBusinessIncome()">💰 Собрать</button>' +
                      '</div>'
                  ).join('');
              } else {
                  document.getElementById('myBusinesses').innerHTML = '<p>У вас пока нет бизнесов</p>';
              }
          }

          async function buyBusiness(businessId) {
              const result = await apiCall('/api/buy-business/' + currentPlayerId + '/' + businessId);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance = result.balance;
                  updatePlayerDisplay();
                  loadBusiness();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          async function collectBusinessIncome() {
              const result = await apiCall('/api/collect-business-income/' + currentPlayerId);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance = result.balance;
                  updatePlayerDisplay();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          // ==================== STOCKS FUNCTIONS ====================

          async function loadStocks() {
              const stocks = await apiCall('/api/stocks/market');
              if (stocks) {
                  document.getElementById('stockMarket').innerHTML = stocks.map(stock => 
                      '<div class="stat-card">' +
                      '<strong>' + stock.name + '</strong><br>' +
                      '📊 ' + stock.symbol + '<br>' +
                      '💰 ' + stock.price + 'Ч<br>' +
                      '📈 Волатильность: ' + (stock.volatility * 100).toFixed(1) + '%' +
                      '</div>'
                  ).join('');
              }

              const player = await apiCall('/api/player/' + currentPlayerId);
              if (player && player.stockPortfolio && Object.keys(player.stockPortfolio).length > 0) {
                  document.getElementById('stockPortfolio').innerHTML = Object.entries(player.stockPortfolio).map(([symbol, data]) => {
                      const stock = stocks.find(s => s.symbol === symbol);
                      const currentValue = stock ? data.quantity * stock.price : 0;
                      const investment = data.quantity * data.averagePrice;
                      const profit = currentValue - investment;
                      
                      return '<div class="stock-card">' +
                             '<strong>' + (stock ? stock.name : symbol) + '</strong><br>' +
                             '📊 ' + data.quantity + ' акций<br>' +
                             '💰 Средняя цена: ' + data.averagePrice + 'Ч<br>' +
                             '💵 Текущая стоимость: ' + currentValue + 'Ч<br>' +
                             (profit >= 0 ? '📈' : '📉') + ' Прибыль: ' + profit + 'Ч' +
                             '</div>';
                  }).join('');
              } else {
                  document.getElementById('stockPortfolio').innerHTML = '<p>Портфель пуст</p>';
              }
          }

          async function buyStock() {
              const symbol = document.getElementById('stockSymbol').value;
              const quantity = parseInt(document.getElementById('stockQuantity').value);

              if (!quantity || quantity <= 0) {
                  alert('❌ Введите корректное количество');
                  return;
              }

              const result = await apiCall('/api/stocks/buy/' + currentPlayerId + '/' + symbol + '/' + quantity);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance = result.balance;
                  updatePlayerDisplay();
                  loadStocks();
              } else if (result) {
                  alert('❌ ' + result.message);
              }
          }

          // ==================== CORPORATIONS FUNCTIONS ====================

          async function loadCorporations() {
              const player = await apiCall('/api/player/' + currentPlayerId);
              if (player && player.corporationShares) {
                  document.getElementById('myCorporations').innerHTML = Object.entries(player.corporationShares).map(([corpId, shares]) => 
                      '<div class="business-card">' +
                      '<strong>Корпорация #' + corpId + '</strong><br>' +
                      '📊 Акций: ' + shares + '<br>' +
                      '💰 Доля: ' + (shares / 1000 * 100).toFixed(1) + '%' +
                      '</div>'
                  ).join('');
              } else {
                  document.getElementById('myCorporations').innerHTML = '<p>У вас пока нет корпораций</p>';
              }
          }

          async function createCorporation() {
              const name = document.getElementById('corpName').value;
              const capital = parseInt(document.getElementById('corpCapital').value);
              const type = document.getElementById('corpType').value;

              if (!name || capital < 50000) {
                  alert('❌ Заполните название и капитал (мин. 50,000Ч)');
                  return;
              }

              const result = await apiCall('/api/corporation/create/' + currentPlayerId + '/' + encodeURIComponent(name) + '/' + capital + '/' + type);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  document.getElementById('corpName').value = '';
                  document.getElementById('corpCapital').value = '50000';
                  currentPlayer.balance -= capital;
                  updatePlayerDisplay();
                  loadCorporations();
              } else if (result) {
                  alert('❌ ' + result.error);
              }
          }

          // ==================== GAMES FUNCTIONS ====================

          async function loadGames() {
              document.getElementById('activeGames').innerHTML = 
                  '<div class="player-card">' +
                  '<p>🎮 Активных игр пока нет</p>' +
                  '<p>Начните новую игру чтобы увидеть ее здесь</p>' +
                  '</div>';
          }

          async function startPokerGame() {
              const bet = parseInt(document.getElementById('pokerBet').value);
              
              if (!bet || bet <= 0) {
                  alert('❌ Введите корректную ставку');
                  return;
              }

              const result = await apiCall('/api/games/poker/start/' + currentPlayerId + '/' + bet);
              if (result && result.success) {
                  alert('✅ ' + result.message);
                  currentPlayer.balance -= bet;
                  updatePlayerDisplay();
              } else if (result) {
                  alert('❌ ' + result.error);
              }
          }

          // Вспомогательная функция для получения названия роли
          function getRoleName(role) {
              const names = {
                  'police': '👮 Полицейский',
                  'criminal': '🕵️ Преступник', 
                  'businessman': '💼 Бизнесмен',
                  'politician': '🏛️ Политик'
              };
              return names[role] || role;
          }

          // Запускаем при загрузке
          init();
      </script>
  </body>
  </html>
  `);
});

// ==================== API ENDPOINTS ====================

app.post('/api/telegram/auth', express.json(), (req, res) => {
    const { id, first_name, username } = req.body;

    let player = gameDB.getPlayer(id);
    if (!player) {
        player = gameDB.createPlayer({
            id: id,
            name: first_name,
            username: username,
            balance: 1000
        });
    }

    res.json(player);
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        message: '🚀 РУССКИЙ МИР - ПОЛНАЯ ВЕРСИЯ РАБОТАЕТ!',
        timestamp: new Date().toISOString(),
        players: gameDB.getAllPlayers().length,
        environment: process.env.NODE_ENV || 'production'
    });
});

app.get('/api/players', (req, res) => {
    res.json(gameDB.getAllPlayers());
});

app.get('/api/player/:playerId', (req, res) => {
    const player = gameDB.getPlayer(parseInt(req.params.playerId));
    res.json(player || { error: 'Player not found' });
});

app.get('/api/statistics', (req, res) => {
    res.json(gameDB.getStatistics());
});

app.get('/api/hall-of-fame', (req, res) => {
    res.json(gameDB.getHallOfFame());
});

app.get('/api/available-jobs/:playerId', (req, res) => {
    const jobs = gameDB.getAvailableJobs(parseInt(req.params.playerId));
    res.json(jobs);
});

app.get('/api/work/:playerId/:jobId', (req, res) => {
    const result = gameDB.workJob(parseInt(req.params.playerId), parseInt(req.params.jobId));
    res.json(result);
});

app.get('/api/daily-bonus/:playerId', (req, res) => {
    const result = gameDB.claimDailyBonus(parseInt(req.params.playerId));
    res.json(result);
});

app.get('/api/choose-role/:playerId/:role', (req, res) => {
    const result = gameDB.chooseRole(parseInt(req.params.playerId), req.params.role);
    res.json(result);
});

app.get('/api/skills/add-exp/:playerId/:skillId/:exp', (req, res) => {
    const result = gameDB.addSkillExp(parseInt(req.params.playerId), req.params.skillId, parseInt(req.params.exp));
    res.json(result);
});

app.get('/api/businesses', (req, res) => {
    res.json(Array.from(gameDB.businesses.values()));
});

app.get('/api/buy-business/:playerId/:businessId', (req, res) => {
    const result = gameDB.buyBusiness(parseInt(req.params.playerId), parseInt(req.params.businessId));
    res.json(result);
});

app.get('/api/collect-business-income/:playerId', (req, res) => {
    const result = gameDB.collectBusinessIncome(parseInt(req.params.playerId));
    res.json(result);
});

app.get('/api/stocks/market', (req, res) => {
    res.json(Array.from(gameDB.stockMarket.values()));
});

app.get('/api/stocks/buy/:playerId/:symbol/:quantity', (req, res) => {
    const result = gameDB.buyStock(parseInt(req.params.playerId), req.params.symbol, parseInt(req.params.quantity));
    res.json(result);
});

app.get('/api/corporation/create/:playerId/:name/:capital/:type', (req, res) => {
    const result = gameDB.createCorporation(parseInt(req.params.playerId), req.params.name, parseInt(req.params.capital), req.params.type);
    res.json(result);
});

app.get('/api/games/poker/start/:playerId/:bet', (req, res) => {
    const result = gameDB.startPokerGame(parseInt(req.params.playerId), parseInt(req.params.bet));
    res.json(result);
});

// ==================== START SERVER ====================

app.listen(port, () => {
    console.log('🎮 РУССКИЙ МИР - ПОЛНАЯ ВЕРСИЯ ЗАПУЩЕНА!');
    console.log('📍 Порт:', port);
    console.log('🌐 Среда:', process.env.NODE_ENV || 'production');
    console.log('🤖 Telegram Bot:', process.env.TELEGRAM_BOT_TOKEN ? '✅ АКТИВЕН И РАБОТАЕТ' : '❌ ОТКЛЮЧЕН');
    console.log('🚀 ИГРА ГОТОВА К ЗАПУСКУ!');
    console.log('📱 Открывай в браузере или через Telegram бота!');
});