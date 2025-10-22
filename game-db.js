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

        // НОВЫЕ СИСТЕМЫ
        this.messages = new Map(); // Личные сообщения
        this.relationships = new Map(); // Отношения
        this.crimes = new Map(); // Преступления
        this.police = new Map(); // Полиция
        this.realEstate = new Map(); // Недвижимость
        this.vehicles = new Map(); // Транспорт
        this.casino = new Map(); // Казино
        this.events = new Map(); // Мероприятия

        this.initDefaultData();
        this.startEconomicCycle();
    }

    initDefaultData() {
        // Акции компаний
        this.stockMarket.set('METL', { symbol: 'METL', name: '🏭 МеталлПром', price: 100, volatility: 0.1 });
        this.stockMarket.set('TECH', { symbol: 'TECH', name: '💻 ТехноКорп', price: 150, volatility: 0.15 });

        // Бизнесы
        this.businesses.set(1, {
            id: 1, name: '🏪 Магазин продуктов', price: 5000, income: 200, type: 'retail',
            requirements: null, ownerId: null
        });

        // НЕДВИЖИМОСТЬ
        this.realEstate.set(1, {
            id: 1, name: '🏠 Квартира в центре', price: 50000, type: 'apartment',
            location: 'Центр', rooms: 2, ownerId: null, luxury: 1
        });
        this.realEstate.set(2, {
            id: 2, name: '🏡 Загородный дом', price: 150000, type: 'house',
            location: 'Пригород', rooms: 4, ownerId: null, luxury: 2
        });

        // АВТОМОБИЛИ
        this.vehicles.set(1, {
            id: 1, name: '🚗 Седан', price: 30000, type: 'sedan', speed: 120, luxury: 1
        });
        this.vehicles.set(2, {
            id: 2, name: '🚙 Внедорожник', price: 80000, type: 'suv', speed: 140, luxury: 2
        });
        this.vehicles.set(3, {
            id: 3, name: '🏎️ Спорткар', price: 200000, type: 'sports', speed: 300, luxury: 3
        });

        // Тестовый игрок
        this.createPlayer({
            id: 1,
            name: "Тестовый Игрок",
            username: "test",
            balance: 5000
        });
    }

    // ==================== СОЦИАЛЬНАЯ СИСТЕМА ====================

    sendMessage(senderId, receiverId, text) {
        const message = {
            id: Date.now(),
            senderId: parseInt(senderId),
            receiverId: parseInt(receiverId),
            text: text,
            timestamp: Date.now(),
            read: false
        };

        if (!this.messages.has(receiverId)) {
            this.messages.set(receiverId, []);
        }
        this.messages.get(receiverId).push(message);

        this.emit('messageSent', message);
        return { success: true, message: 'Сообщение отправлено', messageId: message.id };
    }

    getMessages(userId) {
        return this.messages.get(parseInt(userId)) || [];
    }

    addRelationship(player1Id, player2Id, type) {
        const relationship = {
            id: Date.now(),
            player1Id: parseInt(player1Id),
            player2Id: parseInt(player2Id),
            type: type, // 'friend', 'family', 'spouse'
            created: Date.now(),
            level: 1
        };

        if (!this.relationships.has(player1Id)) {
            this.relationships.set(player1Id, []);
        }
        this.relationships.get(player1Id).push(relationship);

        // Добавляем обратную связь
        if (!this.relationships.has(player2Id)) {
            this.relationships.set(player2Id, []);
        }
        this.relationships.get(player2Id).push({
            ...relationship,
            player1Id: player2Id,
            player2Id: player1Id
        });

        this.emit('relationshipAdded', relationship);
        return { success: true, relationship };
    }

    marryPlayers(player1Id, player2Id) {
        const player1 = this.getPlayer(player1Id);
        const player2 = this.getPlayer(player2Id);

        if (!player1 || !player2) {
            return { success: false, error: 'Игроки не найдены' };
        }

        // Проверяем, не женаты ли уже
        if (player1.spouse || player2.spouse) {
            return { success: false, error: 'Один из игроков уже в браке' };
        }

        player1.spouse = player2Id;
        player2.spouse = player1Id;

        this.addRelationship(player1Id, player2Id, 'spouse');

        this.emit('playersMarried', { player1Id, player2Id });
        return {
            success: true,
            message: `🎉 ${player1.name} и ${player2.name} теперь муж и жена!`
        };
    }

    // ==================== ПОЛИТИЧЕСКАЯ СИСТЕМА ====================

    startElection(position) {
        const election = {
            id: Date.now(),
            position: position, // 'mayor', 'governor'
            candidates: [],
            votes: new Map(),
            startTime: Date.now(),
            endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 неделя
            status: 'active'
        };

        this.elections.set(election.id, election);
        this.emit('electionStarted', election);
        return { success: true, election };
    }

    registerCandidate(electionId, playerId) {
        const election = this.elections.get(electionId);
        const player = this.getPlayer(playerId);

        if (!election || !player) {
            return { success: false, error: 'Выборы или игрок не найдены' };
        }

        if (election.candidates.some(c => c.playerId === playerId)) {
            return { success: false, error: 'Уже зарегистрирован кандидатом' };
        }

        const candidate = {
            playerId: playerId,
            name: player.name,
            votes: 0,
            program: 'Обещаю улучшить город!',
            registeredAt: Date.now()
        };

        election.candidates.push(candidate);
        this.emit('candidateRegistered', { electionId, candidate });
        return { success: true, candidate };
    }

    vote(electionId, voterId, candidatePlayerId) {
        const election = this.elections.get(electionId);
        const voter = this.getPlayer(voterId);

        if (!election || !voter) {
            return { success: false, error: 'Выборы или избиратель не найдены' };
        }

        if (election.votes.has(voterId)) {
            return { success: false, error: 'Вы уже голосовали' };
        }

        const candidate = election.candidates.find(c => c.playerId === candidatePlayerId);
        if (!candidate) {
            return { success: false, error: 'Кандидат не найден' };
        }

        candidate.votes++;
        election.votes.set(voterId, candidatePlayerId);

        this.emit('voteCast', { electionId, voterId, candidatePlayerId });
        return { success: true, message: 'Голос учтен!' };
    }

    // ==================== КРИМИНАЛЬНАЯ СИСТЕМА ====================

    commitCrime(playerId, crimeType) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        const crimes = {
            'theft': { name: '👜 Карманная кража', reward: 500, risk: 0.3, policeChance: 0.4 },
            'robbery': { name: '🏪 Ограбление магазина', reward: 2000, risk: 0.6, policeChance: 0.7 },
            'bank': { name: '🏦 Ограбление банка', reward: 10000, risk: 0.9, policeChance: 0.9 }
        };

        const crime = crimes[crimeType];
        if (!crime) return { success: false, error: 'Неизвестное преступление' };

        // Проверка навыков
        const stealthSkill = player.skills.stealth?.level || 1;
        const successChance = Math.min(0.9, crime.risk * (1 - stealthSkill * 0.1));

        if (Math.random() > successChance) {
            // Провал - попадание в полицию
            if (Math.random() < crime.policeChance) {
                this.arrestPlayer(playerId, crime.name);
                return {
                    success: false,
                    message: `❌ Провал! ${crime.name}. Вы арестованы!`
                };
            }
            return {
                success: false,
                message: `❌ Провал! ${crime.name}. Вам удалось скрыться.`
            };
        }

        // Успех
        player.balance += crime.reward;
        player.reputation -= 10;
        this.addSkillExp(playerId, 'stealth', 20);

        const crimeRecord = {
            id: Date.now(),
            playerId: playerId,
            type: crimeType,
            reward: crime.reward,
            timestamp: Date.now()
        };
        this.crimes.set(crimeRecord.id, crimeRecord);

        this.emit('crimeCommitted', crimeRecord);
        return {
            success: true,
            message: `✅ Успех! ${crime.name}. Добыча: ${crime.reward}Ч`,
            reward: crime.reward
        };
    }

    arrestPlayer(playerId, crime) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        player.arrested = true;
        player.arrestTime = Date.now();
        player.arrestDuration = 30 * 60 * 1000; // 30 минут
        player.arrestReason = crime;

        this.emit('playerArrested', { playerId, crime });
    }

    // ==================== НЕДВИЖИМОСТЬ И ТРАНСПОРТ ====================

    buyRealEstate(playerId, propertyId) {
        const player = this.getPlayer(playerId);
        const property = this.realEstate.get(propertyId);

        if (!player || !property) {
            return { success: false, error: 'Игрок или недвижимость не найдены' };
        }

        if (property.ownerId) {
            return { success: false, error: 'Недвижимость уже куплена' };
        }

        if (player.balance < property.price) {
            return { success: false, error: 'Недостаточно средств' };
        }

        player.balance -= property.price;
        property.ownerId = playerId;

        if (!player.properties) player.properties = [];
        player.properties.push(propertyId);

        this.emit('realEstateBought', { playerId, property });
        return {
            success: true,
            message: `🏠 Поздравляем! Вы купили ${property.name} за ${property.price}Ч`,
            property: property
        };
    }

    buyVehicle(playerId, vehicleId) {
        const player = this.getPlayer(playerId);
        const vehicle = this.vehicles.get(vehicleId);

        if (!player || !vehicle) {
            return { success: false, error: 'Игрок или транспорт не найдены' };
        }

        if (player.balance < vehicle.price) {
            return { success: false, error: 'Недостаточно средств' };
        }

        player.balance -= vehicle.price;

        if (!player.vehicles) player.vehicles = [];
        player.vehicles.push(vehicleId);

        this.emit('vehicleBought', { playerId, vehicle });
        return {
            success: true,
            message: `🚗 Поздравляем! Вы купили ${vehicle.name} за ${vehicle.price}Ч`,
            vehicle: vehicle
        };
    }

    // ==================== КАЗИНО И РАЗВЛЕЧЕНИЯ ====================

    playRoulette(playerId, bet, number) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        if (player.balance < bet) {
            return { success: false, error: 'Недостаточно средств' };
        }

        const winningNumber = Math.floor(Math.random() * 37); // 0-36
        let winAmount = 0;

        if (number === winningNumber) {
            winAmount = bet * 36; // Выигрыш 35 к 1
        } else if (number % 2 === winningNumber % 2) {
            winAmount = bet * 2; // Цвет
        }

        player.balance -= bet;
        player.balance += winAmount;

        const gameRecord = {
            id: Date.now(),
            playerId: playerId,
            game: 'roulette',
            bet: bet,
            win: winAmount,
            timestamp: Date.now()
        };

        this.emit('casinoGamePlayed', gameRecord);
        return {
            success: true,
            message: winAmount > 0 ?
                `🎰 Выигрыш! Выпало ${winningNumber}. Ваш выигрыш: ${winAmount}Ч` :
                `❌ Проигрыш! Выпало ${winningNumber}. Потеря: ${bet}Ч`,
            winAmount: winAmount,
            winningNumber: winningNumber
        };
    }

    // ==================== ОСНОВНЫЕ МЕТОДЫ (из предыдущей версии) ====================

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
            properties: playerData.properties || [],
            vehicles: playerData.vehicles || [],
            corporationShares: playerData.corporationShares || {},
            stockPortfolio: playerData.stockPortfolio || {},
            energy: playerData.energy || 100,
            health: playerData.health || 100,
            lastActive: Date.now(),
            dailyBonus: playerData.dailyBonus || { lastClaim: 0, streak: 0 },
            telegramData: playerData.telegramData || {},
            // НОВЫЕ ПОЛЯ
            spouse: playerData.spouse || null,
            arrested: playerData.arrested || false,
            arrestTime: playerData.arrestTime || null,
            achievements: playerData.achievements || []
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

    workJob(playerId, jobId) {
        // ... существующий код работы ...
    }

    claimDailyBonus(playerId) {
        // ... существующий код бонусов ...
    }

    chooseRole(playerId, role) {
        // ... существующий код выбора роли ...
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

    buyBusiness(playerId, businessId) {
        // ... существующий код покупки бизнеса ...
    }

    collectBusinessIncome(playerId) {
        // ... существующий код сбора доходов ...
    }

    buyStock(playerId, symbol, quantity) {
        // ... существующий код покупки акций ...
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
            // НОВАЯ СТАТИСТИКА
            totalProperties: Array.from(this.realEstate.values()).filter(p => p.ownerId).length,
            totalVehicles: players.reduce((sum, player) => sum + (player.vehicles?.length || 0), 0),
            marriedPlayers: players.filter(p => p.spouse).length,
            arrestedPlayers: players.filter(p => p.arrested).length
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
                role: player.role,
                // НОВЫЕ ПОЛЯ
                properties: player.properties?.length || 0,
                vehicles: player.vehicles?.length || 0
            }));
    }

    startEconomicCycle() {
        setInterval(() => {
            this.updateStockPrices();
        }, 5 * 60 * 1000);

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
}

module.exports = GameDB;