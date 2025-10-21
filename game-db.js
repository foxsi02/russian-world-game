class GameDB {
    constructor() {
        this.players = new Map();
        this.businesses = new Map();
        this.properties = new Map();
        this.corporations = new Map();

        // Добавляем тестового игрока
        this.createPlayer({
            id: 1,
            name: "Тестовый Игрок",
            username: "test",
            balance: 1000,
            level: 1,
            reputation: 0
        });
    }

    // Создание игрока
    createPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            username: playerData.username,
            balance: playerData.balance || 1000,
            level: playerData.level || 1,
            reputation: playerData.reputation || 0,
            role: playerData.role || null,
            skills: playerData.skills || {},
            friends: playerData.friends || [],
            businesses: playerData.businesses || [],
            properties: playerData.properties || [],
            corporationShares: playerData.corporationShares || {},
            status: playerData.status || 'active',
            lastActive: Date.now(),
            registeredAt: Date.now()
        };

        this.players.set(player.id, player);
        return player;
    }

    // Получить игрока
    getPlayer(playerId) {
        return this.players.get(parseInt(playerId));
    }

    // Все игроки
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // Выбор роли
    chooseRole(playerId, role) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.role = role;

            const roleNames = {
                'police': '👮 Полицейский',
                'criminal': '🕵️ Преступник',
                'businessman': '💼 Бизнесмен',
                'politician': '🏛️ Политик'
            };

            return {
                success: true,
                message: `Вы стали ${roleNames[role] || role}`
            };
        }
        return { success: false, message: 'Игрок не найден' };
    }

    // Работа
    workJob(playerId, jobId) {
        const player = this.getPlayer(playerId);
        if (player) {
            const salary = 100; // Базовая зарплата
            player.balance += salary;
            player.lastActive = Date.now();

            return {
                success: true,
                message: `Вы заработали ${salary}Ч`,
                balance: player.balance
            };
        }
        return { success: false, message: 'Ошибка работы' };
    }

    // Статистика
    getStatistics() {
        const players = this.getAllPlayers();
        const totalBalance = players.reduce((sum, player) => sum + player.balance, 0);

        return {
            totalPlayers: players.length,
            totalBalance: totalBalance,
            activeEvents: 0,
            totalArrests: 0
        };
    }

    // Зал славы
    getHallOfFame() {
        return this.getAllPlayers()
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10)
            .map(player => ({
                name: player.name,
                balance: player.balance,
                level: player.level,
                reputation: player.reputation,
                role: player.role
            }));
    }

    // Навыки
    addSkillExperience(playerId, skillId, exp) {
        const player = this.getPlayer(playerId);
        if (player) {
            if (!player.skills[skillId]) {
                player.skills[skillId] = { level: 1, exp: 0 };
            }

            player.skills[skillId].exp += exp;

            // Проверка уровня (1000 опыта за уровень)
            const neededExp = player.skills[skillId].level * 1000;
            if (player.skills[skillId].exp >= neededExp) {
                player.skills[skillId].level++;
                player.skills[skillId].exp = 0;
            }

            return {
                success: true,
                level: player.skills[skillId].level
            };
        }
        return { success: false };
    }

    // Корпорации
    createCorporation(playerId, name, capital, type) {
        const player = this.getPlayer(playerId);
        if (player && player.balance >= capital) {
            player.balance -= capital;

            const corpId = Date.now();
            const corporation = {
                id: corpId,
                name: name,
                capital: capital,
                type: type,
                ownerId: playerId,
                shares: 1000,
                sharePrice: capital / 1000,
                foundedAt: Date.now()
            };

            this.corporations.set(corpId, corporation);

            if (!player.corporationShares) {
                player.corporationShares = {};
            }
            player.corporationShares[corpId] = 200; // 20% основателю

            return { success: true, corporationId: corpId };
        }
        return { success: false, error: 'Недостаточно средств' };
    }

    // Социальные связи
    addFriend(playerId, friendId) {
        const player = this.getPlayer(playerId);
        const friend = this.getPlayer(friendId);

        if (player && friend) {
            if (!player.friends) player.friends = [];
            if (!player.friends.includes(friendId)) {
                player.friends.push(friendId);
            }
            return { success: true };
        }
        return { success: false, error: 'Игрок не найден' };
    }

    // Мини-игры
    startPokerGame(playerId, bet) {
        const player = this.getPlayer(playerId);
        if (player && player.balance >= bet) {
            player.balance -= bet;
            const gameId = Date.now();
            return { success: true, gameId: gameId };
        }
        return { success: false, error: 'Недостаточно средств' };
    }

    // Доступные работы
    getAvailableJobs(playerId) {
        return [
            { id: 1, name: "💼 Офисный работник", salary: 100, requirements: null },
            { id: 2, name: "🚚 Водитель", salary: 150, requirements: null },
            { id: 3, name: "👮 Патрульный", salary: 200, requirements: 'police' },
            { id: 4, name: "💼 Менеджер", salary: 250, requirements: 'businessman' }
        ].filter(job => !job.requirements || this.getPlayer(playerId)?.role === job.requirements);
    }
}

module.exports = GameDB;