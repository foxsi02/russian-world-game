const PoliticalSystem = require('./political-system');
const EmergencyServices = require('./emergency-services');
const TaxSystem = require('./tax-system');
const ShoppingSystem = require('./shopping-system');
const ChatSystem = require('./chat-system');
const AISystem = require('./ai-system');

// ★★★ ДОБАВЛЯЕМ ЭТИ СТРОКИ ★★★
const SkillsSystem = require('./skills-system');
const VitalSystem = require('./vital-system');
const CorporationSystem = require('./corporation-system');
const RelationshipsSystem = require('./relationships-system');
const InteractiveGames = require('./interactive-games');
// ★★★ КОНЕЦ ДОБАВЛЕНИЯ ★★★

// Временные заглушки для отсутствующих систем
class EconomicSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.businesses = new Map();
        this.stockPrices = new Map();
    }

    getBusinessIncome() { return 0; }
    registerBusinessman() { return { success: true }; }
}

class CrimeSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.criminalNetwork = new Map();
        this.bountyList = new Map();
    }

    joinCriminalNetwork() { return { success: true }; }
    addToWantedList() { return { success: true }; }
}

class LawSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.policeForces = new Map();
    }

    joinPolice() { return { success: true }; }
    createBounty() { return { success: true }; }
}

class SocialSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
    }
}

class QuestSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.quests = new Map();
    }

    createQuest() { return { success: true }; }
}

class GameDB {
    constructor() {
        console.log('🎮 Initializing unified game ecosystem...');
    
        // Основные данные
        this.players = new Map();
        this.transactions = [];
        this.liveEvents = new Map();
        this.activeInteractions = new Map();
        this.realtimeQueue = [];
        this.achievements = new Map();
        this.hallOfFame = [];

        // Игровые системы
        this.politicalSystem = new PoliticalSystem(this);
        this.economicSystem = new EconomicSystem(this);
        this.crimeSystem = new CrimeSystem(this);
        this.lawSystem = new LawSystem(this);
        this.socialSystem = new SocialSystem(this);
        this.questSystem = new QuestSystem(this);
        this.chatSystem = new ChatSystem(this);
        this.aiSystem = new AISystem(this);
        this.skillsSystem = new SkillsSystem(this);
        this.vitalSystem = new VitalSystem(this);
        this.corporationSystem = new CorporationSystem(this);
        this.relationshipsSystem = new RelationshipsSystem(this);
        this.interactiveGames = new InteractiveGames(this);
        // Инициализация
        this.initializeWorld();
        this.startRealtimeEngine();

        console.log('✅ Unified ecosystem ready!');
    }

    initializeWorld() {
        this.initializeAchievements();
        this.createInitialPlayers();
        this.generateWorldEvents();
    }

    initializeAchievements() {
        const achievements = [
            { id: 'first_arrest', name: 'Первый арест', description: 'Задержайте первого преступника', reward: 1000 },
            { id: 'successful_robbery', name: 'Успешное ограбление', description: 'Проведите успешное ограбление', reward: 1500 },
            { id: 'business_owner', name: 'Владелец бизнеса', description: 'Откройте свой первый бизнес', reward: 2000 },
            { id: 'law_passed', name: 'Законодатель', description: 'Примите первый закон', reward: 2500 }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
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
            role: null,
            skills: {},
            friends: [],
            businesses: [],
            properties: [],
            telegramData: playerData.telegramData,
            registeredAt: Date.now(),
            lastActive: Date.now()
        };

        this.players.set(player.id, player);
        return player;
    }

    createInitialPlayers() {
        const demoPlayers = [
            { name: "Алексей Воронов", balance: 15000, level: 12, reputation: 1800 },
            { name: "Ольга Соколова", balance: 25000, level: 15, reputation: 2200 },
            { name: "Дмитрий Орлов", balance: 8000, level: 8, reputation: 1200 },
            { name: "Ирина Лебедева", balance: 30000, level: 18, reputation: 2800 },
            { name: "Сергей Волков", balance: 12000, level: 10, reputation: 1500 }
        ];

        demoPlayers.forEach((playerData, index) => {
            const playerId = index + 1;
            const player = {
                id: playerId,
                name: playerData.name,
                balance: playerData.balance,
                level: playerData.level,
                reputation: playerData.reputation,
                experience: 0,
                status: "Гражданин",
                role: null,
                skills: {},
                job: null,
                lastWork: 0,
                businesses: [],
                properties: [],
                inventory: [],
                followers: [],
                following: [],
                referralCode: `REF${playerId}000`,
                referrals: [],
                lastBonus: null,
                dailyBonusDay: 1,
                adLimits: { '15_sec': 0, '30_sec': 0, '60_sec': 0 },
                achievements: [],
                clanId: null,
                lastLogin: new Date(),
                wantedLevel: 0,
                arrestsCount: 0
            };
            this.players.set(playerId, player);
        });

        console.log(`🎮 Created ${demoPlayers.length} demo players`);
    }

    generateWorldEvents() {
        console.log('🌍 World events initialized');
    }

    // ОСНОВНЫЕ МЕТОДЫ ИГРОКА
    createPlayer(name) {
        const playerId = this.players.size + 1;
        const player = {
            id: playerId,
            name: name,
            balance: 1000,
            level: 1,
            reputation: 0,
            experience: 0,
            status: "Новичок",
            role: null,
            skills: {},
            job: null,
            lastWork: 0,
            businesses: [],
            properties: [],
            inventory: [],
            followers: [],
            following: [],
            referralCode: `REF${playerId}000`,
            referrals: [],
            lastBonus: null,
            dailyBonusDay: 1,
            adLimits: { '15_sec': 0, '30_sec': 0, '60_sec': 0 },
            achievements: [],
            clanId: null,
            lastLogin: new Date(),
            wantedLevel: 0,
            arrestsCount: 0
        };
        this.players.set(playerId, player);
        return player;
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getPlayer(playerId) {
        return this.players.get(parseInt(playerId));
    }

    // СИСТЕМА РОЛЕЙ
    chooseRole(playerId, role) {
        const player = this.players.get(playerId);
        if (!player) return { error: "Игрок не найден" };

        const validRoles = ['police', 'criminal', 'businessman', 'politician'];
        if (!validRoles.includes(role)) {
            return { error: "Неверная роль. Доступные: police, criminal, businessman, politician" };
        }

        player.role = role;
        player.roleStarted = new Date();

        // Добавляем в соответствующие системы
        switch (role) {
            case 'police':
                this.lawSystem.joinPolice(playerId);
                this.chatSystem.addToChat(playerId, 'police_chat');
                break;
            case 'criminal':
                this.crimeSystem.joinCriminalNetwork(playerId);
                this.chatSystem.addToChat(playerId, 'underworld_chat');
                break;
            case 'businessman':
                this.economicSystem.registerBusinessman(playerId);
                this.chatSystem.addToChat(playerId, 'business_chat');
                break;
            case 'politician':
                this.politicalSystem.joinPolitics(playerId);
                this.chatSystem.addToChat(playerId, 'politics_chat');
                break;
        }

        this.addToLog(`🎭 ${player.name} стал ${this.getRoleName(role)}`);

        return {
            success: true,
            role: role,
            roleName: this.getRoleName(role),
            message: `Вы стали ${this.getRoleName(role)}!`
        };
    }

    getRoleName(role) {
        const names = {
            'police': '👮 Полицейский',
            'criminal': '🕵️ Преступник',
            'businessman': '💼 Бизнесмен',
            'politician': '🏛️ Политик'
        };
        return names[role] || role;
    }

    // ВЗАИМОДЕЙСТВИЯ МЕЖДУ ИГРОКАМИ
    policeArrestCriminal(policeId, criminalId, evidence = 3) {
        const police = this.players.get(policeId);
        const criminal = this.players.get(criminalId);

        if (!police || !criminal) return { error: "Игроки не найдены" };
        if (police.role !== 'police') return { error: "Вы не полицейский" };
        if (criminal.role !== 'criminal') return { error: "Игрок не преступник" };

        // Проверка доказательств
        const successChance = Math.min(evidence * 20, 95); // Макс 95%
        const isSuccess = Math.random() * 100 < successChance;

        if (isSuccess) {
            // Успешный арест
            criminal.status = 'arrested';
            criminal.arrestTime = Date.now();
            criminal.arrestedBy = policeId;
            criminal.wantedLevel = 0;

            // Награда полицейскому
            const reward = 2000 + (evidence * 500);
            police.balance += reward;
            police.reputation += 100;
            police.arrestsCount = (police.arrestsCount || 0) + 1;

            // Штраф преступнику
            criminal.balance = Math.max(0, criminal.balance - 3000);
            criminal.reputation -= 150;

            // Опыт
            this.addRoleExperience(policeId, 'arrest', true);
            this.addRoleExperience(criminalId, 'caught', false);

            this.unlockAchievement(policeId, 'first_arrest');

            this.createLiveEvent('arrest', {
                police: police.name,
                criminal: criminal.name,
                reward: reward,
                duration: 30
            });

            return {
                success: true,
                reward: reward,
                message: `Вы арестовали ${criminal.name}! Награда: ${reward}Ч`
            };
        } else {
            // Неудачная попытка
            police.reputation -= 20;
            criminal.wantedLevel += 10;

            this.addRoleExperience(policeId, 'arrest', false);
            this.addRoleExperience(criminalId, 'escape', true);

            return { error: "Недостаточно доказательств для ареста" };
        }
    }

    criminalRobBusiness(criminalId, businessOwnerId, amount = 5000) {
        const criminal = this.players.get(criminalId);
        const businessOwner = this.players.get(businessOwnerId);

        if (!criminal || !businessOwner) return { error: "Игроки не найдены" };
        if (criminal.role !== 'criminal') return { error: "Вы не преступник" };
        if (criminal.status === 'arrested') return { error: "Вы в тюрьме" };
        if (businessOwner.balance < amount) return { error: "У бизнесмена недостаточно средств" };

        const risk = 30 + criminal.wantedLevel; // Базовый риск + уровень розыска
        const successChance = Math.max(100 - risk, 10); // Минимум 10% шанс

        const isSuccess = Math.random() * 100 < successChance;

        if (isSuccess) {
            // Успешное ограбление
            const loot = Math.min(amount, businessOwner.balance * 0.3); // Макс 30% баланса
            criminal.balance += loot;
            businessOwner.balance -= loot;

            criminal.wantedLevel += 20;

            // Создаем задание для полиции
            this.crimeSystem.addToWantedList(criminalId, 'ограбление бизнеса', loot * 0.5);

            this.addRoleExperience(criminalId, 'rob', true);
            this.addRoleExperience(businessOwnerId, 'robbed', false);

            this.unlockAchievement(criminalId, 'successful_robbery');

            this.createLiveEvent('robbery', {
                criminal: criminal.name,
                business: `${businessOwner.name}'s бизнес`,
                loot: loot,
                owner: businessOwner.name
            });

            return { success: true, loot: loot };
        } else {
            // Провал
            criminal.wantedLevel += 30;

            this.addRoleExperience(criminalId, 'rob', false);

            return { error: "Ограбление провалилось! Вас ищет полиция" };
        }
    }

    // СИСТЕМА РЕАЛЬНОГО ВРЕМЕНИ
    startRealtimeEngine() {
        setInterval(() => {
            this.processRealtimeInteractions();
            this.processPrisonTime();
            this.generateDynamicEvents();
        }, 10000); // Каждые 10 секунд
    }

    processRealtimeInteractions() {
        // Обработка активных взаимодействий
        this.activeInteractions.forEach((interaction, id) => {
            if (Date.now() - interaction.startTime > 120000) { // 2 минуты максимум
                this.activeInteractions.delete(id);
            }
        });
    }

    processPrisonTime() {
        this.players.forEach(player => {
            if (player.status === 'arrested' && player.arrestTime) {
                const timeServed = Date.now() - player.arrestTime;
                const prisonTime = 30 * 60 * 1000; // 30 минут

                if (timeServed >= prisonTime) {
                    player.status = 'free';
                    player.arrestTime = null;
                    player.arrestedBy = null;
                    this.addToLog(`🔓 ${player.name} вышел из тюрьмы`);
                }
            }
        });
    }

    generateDynamicEvents() {
        if (Math.random() < 0.2) { // 20% шанс каждые 10 секунд
            const events = [
                'economic_boom',
                'crime_wave',
                'election_announcement',
                'natural_disaster'
            ];

            const event = events[Math.floor(Math.random() * events.length)];
            this.createLiveEvent(event, {
                description: this.generateEventDescription(event)
            });
        }
    }

    generateEventDescription(eventType) {
        const descriptions = {
            'economic_boom': '📈 Экономический рост! Бизнесы получают бонусы',
            'crime_wave': '🚨 Волна преступлений! Полиция усиливает патрулирование',
            'election_announcement': '🏛️ Объявлены новые выборы! Кандидаты начинают кампании',
            'natural_disaster': '🌪️ Стихийное бедствие! Все игроки получают урон'
        };
        return descriptions[eventType] || 'Произошло событие';
    }

    createLiveEvent(type, data) {
        const event = {
            id: Date.now(),
            type: type,
            data: data,
            timestamp: new Date(),
            participants: [],
            resolved: false
        };

        this.liveEvents.set(event.id, event);

        // Уведомляем в чатах
        this.broadcastEventToChats(event);

        return event;
    }

    broadcastEventToChats(event) {
        const message = this.formatEventMessage(event);
        this.chatSystem.sendSystemMessage(1, message); // Общий чат
    }

    formatEventMessage(event) {
        switch (event.type) {
            case 'arrest':
                return `🚨 АРЕСТ: ${event.data.police} задержал ${event.data.criminal}! Награда: ${event.data.reward}Ч`;
            case 'robbery':
                return `💸 ОГРАБЛЕНИЕ: ${event.data.criminal} ограбил ${event.data.business}! Ущерб: ${event.data.loot}Ч`;
            case 'economic_boom':
                return `📈 ${event.data.description}`;
            case 'crime_wave':
                return `🚨 ${event.data.description}`;
            default:
                return `ℹ️ ${event.data.description}`;
        }
    }

    // СИСТЕМА НАВЫКОВ И ОПЫТА
    addRoleExperience(playerId, action, success) {
        const player = this.players.get(playerId);
        if (!player.role) return;

        const experienceTable = {
            'police': {
                'arrest': success ? 50 : 10,
                'patrol': 20
            },
            'criminal': {
                'rob': success ? 60 : 15,
                'escape': success ? 40 : 5,
                'caught': 5
            },
            'businessman': {
                'deal': 30,
                'robbed': 10
            },
            'politician': {
                'speech': 25,
                'law': 40
            }
        };

        const exp = experienceTable[player.role]?.[action] || 10;
        this.addPlayerSkill(playerId, player.role, exp);

        if (success) {
            player.reputation += Math.floor(exp / 2);
        }
    }

    addPlayerSkill(playerId, skill, exp) {
        const player = this.players.get(playerId);
        if (!player.skills) player.skills = {};
        if (!player.skills[skill]) player.skills[skill] = 0;

        player.skills[skill] += exp;
    }

    // СИСТЕМА ДОСТИЖЕНИЙ
    unlockAchievement(playerId, achievementId) {
        const player = this.players.get(playerId);
        const achievement = this.achievements.get(achievementId);

        if (!player || !achievement) return;

        if (!player.achievements.includes(achievementId)) {
            player.achievements.push(achievementId);
            player.balance += achievement.reward;
            player.reputation += 100;

            this.addToLog(`🏆 ${player.name} получил достижение "${achievement.name}"!`);
        }
    }

    // СИСТЕМА ЛОГИРОВАНИЯ
    addToLog(message) {
        console.log(`📝 ${message}`);
    }

    // СТАТИСТИКИ
    getStatistics() {
        const totalPlayers = this.players.size;
        const totalBalance = Array.from(this.players.values()).reduce((sum, player) => sum + player.balance, 0);

        const roleCounts = {
            police: 0,
            criminal: 0,
            businessman: 0,
            politician: 0,
            civilian: 0
        };

        this.players.forEach(player => {
            if (player.role) {
                roleCounts[player.role]++;
            } else {
                roleCounts.civilian++;
            }
        });

        return {
            totalPlayers,
            totalBalance,
            roleCounts,
            activeEvents: this.liveEvents.size,
            totalArrests: Array.from(this.players.values()).reduce((sum, player) => sum + (player.arrestsCount || 0), 0)
        };
    }

    getHallOfFame() {
        const players = Array.from(this.players.values());
        return players
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10)
            .map(player => ({
                name: player.name,
                balance: player.balance,
                level: player.level,
                role: player.role ? this.getRoleName(player.role) : 'Гражданин',
                reputation: player.reputation
            }));
    }

    // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ СУЩЕСТВУЮЩЕГО API
    getAvailableJobs(playerId) {
        return [
            { id: 1, name: "👷 Строитель", salary: 100, cooldown: 5 },
            { id: 2, name: "🚛 Водитель", salary: 150, cooldown: 7 },
            { id: 3, name: "💼 Офисный работник", salary: 200, cooldown: 10 }
        ];
    }

    workJob(playerId, jobId) {
        const player = this.players.get(playerId);
        const jobs = this.getAvailableJobs(playerId);
        const job = jobs.find(j => j.id === jobId);

        if (!player || !job) return { error: "Ошибка" };

        const income = job.salary;
        player.balance += income;

        return { success: true, income: income };
    } addSkillExperience(playerId, skillId, exp) {
        return this.skillsSystem.addSkillExperience(playerId, skillId, exp);
    }

    consumeEnergy(playerId, amount, action) {
        return this.vitalSystem.consumeEnergy(playerId, amount, action);
    }

    createCorporation(playerId, name, capital, businessType) {
        return this.corporationSystem.createCorporation(playerId, name, capital, businessType);
    }

    addFriend(playerId, friendId) {
        return this.relationshipsSystem.addFriend(playerId, friendId);
    }

    startPokerGame(playerId, betAmount) {
        return this.interactiveGames.startPokerGame(playerId, betAmount);
    }
}

module.exports = GameDB;