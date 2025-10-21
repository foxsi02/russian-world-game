const { EventEmitter } = require('events');

class GameDB extends EventEmitter {
    constructor() {
        super();
        this.players = new Map();
        this.businesses = new Map();
        this.properties = new Map();
        this.corporations = new Map();
        this.parties = new Map();
        this.elections = new Map();
        this.stockMarket = new Map();
        this.chats = new Map();
        this.games = new Map();

        this.initDefaultData();
        this.startEconomicCycle();
    }

    initDefaultData() {
        // Акции компаний
        this.stockMarket.set('METL', { symbol: 'METL', name: '🏭 МеталлПром', price: 100, volatility: 0.1 });
        this.stockMarket.set('TECH', { symbol: 'TECH', name: '💻 ТехноКорп', price: 150, volatility: 0.15 });
        this.stockMarket.set('OILG', { symbol: 'OILG', name: '🛢️ НефтьГаз', price: 120, volatility: 0.12 });
        this.stockMarket.set('FNBK', { symbol: 'FNBK', name: '🏦 ФинансБанк', price: 200, volatility: 0.08 });

        // Стартовые бизнесы
        this.businesses.set(1, {
            id: 1, name: '🏪 Магазин продуктов', price: 5000, income: 200, type: 'retail',
            requirements: null, ownerId: null
        });
        this.businesses.set(2, {
            id: 2, name: '🏢 Офисное здание', price: 15000, income: 500, type: 'real_estate',
            requirements: null, ownerId: null
        });
    }

    // ==================== СИСТЕМА ИГРОКОВ ====================

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
            skills: playerData.skills || {},
            friends: playerData.friends || [],
            businesses: playerData.businesses || [],
            properties: playerData.properties || [],
            corporationShares: playerData.corporationShares || {},
            stockPortfolio: playerData.stockPortfolio || {},
            status: playerData.status || 'active',
            health: playerData.health || 100,
            energy: playerData.energy || 100,
            lastActive: Date.now(),
            registeredAt: Date.now(),
            dailyBonus: playerData.dailyBonus || { lastClaim: 0, streak: 0 },
            telegramData: playerData.telegramData || {}
        };

        this.players.set(player.id, player);
        this.emit('playerCreated', player);
        return player;
    }

    getPlayer(playerId) {
        return this.players.get(parseInt(playerId));
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // ==================== ЭКОНОМИЧЕСКАЯ СИСТЕМА ====================

    workJob(playerId, jobId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, message: 'Игрок не найден' };

        const jobs = {
            1: { name: '💼 Офисный работник', salary: 100, energy: 10 },
            2: { name: '🚚 Водитель', salary: 150, energy: 15 },
            3: { name: '👮 Патрульный', salary: 200, energy: 20, role: 'police' },
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

        // Проверка уровня
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

        // Начальные навыки для роли
        const roleSkills = {
            police: { law_enforcement: 1, investigation: 1 },
            businessman: { negotiation: 1, management: 1 },
            politician: { rhetoric: 1, diplomacy: 1 },
            criminal: { stealth: 1, hacking: 1 }
        };

        player.skills = { ...player.skills, ...roleSkills[role] };
        player.lastActive = Date.now();

        this.emit('roleChanged', { playerId, role });

        return {
            success: true,
            message: `Поздравляем! Вы стали ${this.getRoleName(role)}`,
            role: role,
            skills: roleSkills[role]
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

    addSkillExperience(playerId, skillId, exp) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false };

        if (!player.skills[skillId]) {
            player.skills[skillId] = { level: 1, exp: 0 };
        }

        player.skills[skillId].exp += exp;

        // Проверка уровня (1000 опыта за уровень)
        const neededExp = player.skills[skillId].level * 1000;
        if (player.skills[skillId].exp >= neededExp) {
            player.skills[skillId].level++;
            player.skills[skillId].exp = 0;
            this.emit('skillLevelUp', { playerId, skillId, level: player.skills[skillId].level });
        }

        player.lastActive = Date.now();

        return {
            success: true,
            level: player.skills[skillId].level,
            exp: player.skills[skillId].exp,
            neededExp: neededExp
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

        this.emit('businessBought', { playerId, businessId });

        return {
            success: true,
            message: `Вы купили ${business.name} за ${business.price}Ч`,
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
            message: `Собрано ${totalIncome}Ч с бизнесов`,
            income: totalIncome,
            businesses: collectedBusinesses,
            balance: player.balance
        };
    }

    // ==================== СИСТЕМА КОРПОРАЦИЙ ====================

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

        this.emit('corporationCreated', { playerId, corporation });

        return {
            success: true,
            corporationId: corpId,
            corporation: corporation
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
            message: `Куплено ${quantity} акций ${stock.name} за ${totalCost}Ч`,
            stock: symbol,
            quantity: quantity,
            price: stock.price,
            balance: player.balance
        };
    }

    // ==================== СОЦИАЛЬНЫЕ СВЯЗИ ====================

    addFriend(playerId, friendId) {
        const player = this.getPlayer(playerId);
        const friend = this.getPlayer(friendId);

        if (!player || !friend) {
            return { success: false, error: 'Игрок не найден' };
        }

        if (playerId === friendId) {
            return { success: false, error: 'Нельзя добавить себя в друзья' };
        }

        if (!player.friends) player.friends = [];
        if (player.friends.includes(friendId)) {
            return { success: false, error: 'Уже в друзьях' };
        }

        player.friends.push(friendId);
        player.lastActive = Date.now();

        this.emit('friendAdded', { playerId, friendId });

        return { success: true, message: `Вы добавили ${friend.name} в друзья` };
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
            gameId: gameId,
            game: game
        };
    }

    // ==================== СИСТЕМА ЗДОРОВЬЯ И ЭНЕРГИИ ====================

    consumeEnergy(playerId, amount, action) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false };

        if (player.energy < amount) {
            return { success: false, message: 'Недостаточно энергии' };
        }

        player.energy -= amount;
        player.lastActive = Date.now();

        return {
            success: true,
            energy: player.energy,
            action: action
        };
    }

    // ==================== ПОЛИТИЧЕСКАЯ СИСТЕМА ====================

    createParty(playerId, name, ideology) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        if (player.role !== 'politician') {
            return { success: false, error: 'Только политики могут создавать партии' };
        }

        const partyId = Date.now();
        const party = {
            id: partyId,
            name: name,
            ideology: ideology,
            leaderId: playerId,
            members: [playerId],
            founded: Date.now(),
            rating: 0
        };

        this.parties.set(partyId, party);
        player.lastActive = Date.now();

        return {
            success: true,
            partyId: partyId,
            party: party
        };
    }

    // ==================== СЛУЖЕБНЫЕ МЕТОДЫ ====================

    checkLevelUp(player) {
        const expNeeded = player.level * 1000;
        if (player.experience >= expNeeded) {
            player.level++;
            player.experience = 0;
            player.balance += player.level * 500; // Бонус за уровень
            this.emit('levelUp', { playerId: player.id, level: player.level });
            return true;
        }
        return false;
    }

    startEconomicCycle() {
        // Обновление цен акций каждые 5 минут
        setInterval(() => {
            this.updateStockPrices();
        }, 5 * 60 * 1000);

        // Восстановление энергии каждую минуту
        setInterval(() => {
            this.recoverEnergy();
        }, 60 * 1000);
    }

    updateStockPrices() {
        for (const [symbol, stock] of this.stockMarket) {
            const change = (Math.random() - 0.5) * 2 * stock.volatility * stock.price;
            stock.price = Math.max(10, Math.round(stock.price + change));
        }
        this.emit('stockPricesUpdated', this.stockMarket);
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
            totalCorporations: this.corporations.size,
            activeElections: this.elections.size
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
                reputation: player.reputation,
                role: player.role
            }));
    }

    getAvailableJobs(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return [];

        const jobs = [
            { id: 1, name: "💼 Офисный работник", salary: 100, energy: 10, requirements: null },
            { id: 2, name: "🚚 Водитель", salary: 150, energy: 15, requirements: null },
            { id: 3, name: "👮 Патрульный", salary: 200, energy: 20, requirements: 'police' },
            { id: 4, name: "💼 Менеджер", salary: 250, energy: 25, requirements: 'businessman' },
            { id: 5, name: "🏛️ Помощник депутата", salary: 300, energy: 30, requirements: 'politician' }
        ];

        return jobs.filter(job => !job.requirements || player.role === job.requirements);
    }
}

module.exports = GameDB;