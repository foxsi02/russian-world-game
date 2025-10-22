require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// ==================== ЯДРО ИГРОВОГО МИРА ====================

class LivingCityGame {
    constructor() {
        // ОСНОВНЫЕ СТРУКТУРЫ
        this.players = new Map();
        this.districts = new Map(); // Районы города
        this.businesses = new Map();
        this.properties = new Map();

        // СОЦИАЛЬНЫЕ СИСТЕМЫ
        this.relationships = new Map(); // Отношения между игроками
        this.families = new Map(); // Семьи и кланы
        this.chats = new Map(); // Чаты районов/групп

        // ВЛАСТЬ И ПОЛИТИКА
        this.government = new Map(); // Государственные должности
        this.elections = new Map(); // Выборы
        this.laws = new Map(); // Законы города

        // ЭКОНОМИКА
        this.market = new Map(); // Рынок товаров/услуг
        this.contracts = new Map(); // Контракты между игроками

        this.initWorld();
        this.startWorldCycles();
    }

    initWorld() {
        // СОЗДАЕМ РАЙОНЫ ГОРОДА
        this.districts.set(1, {
            id: 1,
            name: "🏙️ Центральный район",
            type: "business",
            wealth: 3, // Уровень богатства 1-5
            safety: 2,  // Уровень безопасности
            population: 0,
            mayor: null,
            chatId: null
        });

        this.districts.set(2, {
            id: 2,
            name: "🏘️ Спальный район",
            type: "residential",
            wealth: 1,
            safety: 3,
            population: 0,
            mayor: null,
            chatId: null
        });

        this.districts.set(3, {
            id: 3,
            name: "🏭 Промышленная зона",
            type: "industrial",
            wealth: 2,
            safety: 1,
            population: 0,
            mayor: null,
            chatId: null
        });

        // БАЗОВАЯ ИНФРАСТРУКТУРА
        this.businesses.set(1, {
            id: 1,
            name: "🏪 Продуктовый магазин",
            type: "food",
            district: 2,
            owner: null,
            employees: [],
            supplies: 100,
            price: 5000,
            income: 200
        });

        this.properties.set(1, {
            id: 1,
            name: "🏠 Квартира в центре",
            type: "apartment",
            district: 1,
            owner: null,
            price: 50000,
            comfort: 3,
            capacity: 1
        });

        console.log('🌍 Игровой мир создан!');
    }

    // ==================== СИСТЕМА ИГРОКОВ ====================

    createPlayer(playerData) {
        // СЛУЧАЙНЫЙ РАЙОН ДЛЯ НОВИЧКА
        const availableDistricts = Array.from(this.districts.values())
            .filter(d => d.type === "residential");
        const startDistrict = availableDistricts[Math.floor(Math.random() * availableDistricts.length)];

        const player = {
            // ОСНОВНЫЕ ДАННЫЕ
            id: playerData.id,
            name: playerData.name,
            username: playerData.username,

            // МЕСТО В МИРЕ
            district: startDistrict.id,
            home: null,
            work: null,

            // РЕСУРСЫ
            balance: 1000,
            energy: 100,
            health: 100,
            reputation: 0,

            // НАВЫКИ И РОЛЬ
            skills: {
                communication: 1, // Общение
                management: 1,    // Управление  
                craft: 1,         // Ремесло
                law: 1,           // Право
                stealth: 1        // Скрытность
            },
            role: null,
            level: 1,
            experience: 0,

            // СОЦИАЛЬНЫЕ СВЯЗИ
            friends: [],
            enemies: [],
            family: null,
            spouse: null,

            // ИМУЩЕСТВО
            properties: [],
            businesses: [],
            vehicles: [],

            // СТАТУС
            needs: {
                food: 100,
                comfort: 100,
                safety: 100
            },
            employed: false,
            arrested: false,

            // СЛУЖЕБНОЕ
            lastActive: Date.now(),
            registeredAt: Date.now(),
            dailyBonus: { lastClaim: 0, streak: 0 }
        };

        this.players.set(player.id, player);
        this.districts.get(startDistrict.id).population++;

        console.log(`👤 Новый игрок: ${player.name} в районе ${startDistrict.name}`);
        return player;
    }

    // ==================== СОЦИАЛЬНЫЕ ВЗАИМОДЕЙСТВИЯ ====================

    addRelationship(player1Id, player2Id, type, strength = 1) {
        const relationship = {
            id: Date.now(),
            player1: parseInt(player1Id),
            player2: parseInt(player2Id),
            type: type, // 'friend', 'business', 'family', 'rival', 'enemy'
            strength: strength,
            created: Date.now(),
            lastInteraction: Date.now()
        };

        if (!this.relationships.has(player1Id)) {
            this.relationships.set(player1Id, []);
        }
        this.relationships.get(player1Id).push(relationship);

        return relationship;
    }

    // Игроки могут помогать друг другу
    helpPlayer(helperId, targetId, helpType) {
        const helper = this.getPlayer(helperId);
        const target = this.getPlayer(targetId);

        if (!helper || !target) {
            return { success: false, error: 'Игрок не найден' };
        }

        const helpActions = {
            'money': { cost: 100, effect: 50 },
            'food': { cost: 20, effect: 30 },
            'protection': { cost: 30, effect: 40 }
        };

        const action = helpActions[helpType];
        if (!action) {
            return { success: false, error: 'Неизвестный тип помощи' };
        }

        if (helper.balance < action.cost) {
            return { success: false, error: 'Недостаточно средств' };
        }

        // Передача помощи
        helper.balance -= action.cost;

        if (helpType === 'money') {
            target.balance += action.effect;
        } else if (helpType === 'food') {
            target.needs.food = Math.min(100, target.needs.food + action.effect);
        }

        // Улучшение отношений
        this.addRelationship(helperId, targetId, 'friend', 1);

        return {
            success: true,
            message: `Вы помогли ${target.name}`,
            relationship: this.getRelationship(helperId, targetId)
        };
    }

    // ==================== СИСТЕМА РАБОТЫ ====================

    findJob(playerId, jobType) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, error: 'Игрок не найден' };

        // РАБОТА ТРЕБУЕТ:
        // 1. Проживания в районе
        // 2. Соответствующих навыков  
        // 3. Свободных мест
        // 4. Иногда - рекомендаций

        const availableJobs = this.getAvailableJobs(player.district, jobType);

        if (availableJobs.length === 0) {
            return {
                success: false,
                error: 'Нет доступных вакансий в вашем районе'
            };
        }

        // ПРОВЕРКА НАВЫКОВ
        const suitableJobs = availableJobs.filter(job =>
            player.skills[job.requiredSkill] >= job.requiredLevel
        );

        if (suitableJobs.length === 0) {
            return {
                success: false,
                error: 'Недостаточно навыков для доступных вакансий'
            };
        }

        return {
            success: true,
            jobs: suitableJobs,
            message: `Найдено ${suitableJobs.length} вакансий`
        };
    }

    applyForJob(playerId, businessId) {
        const player = this.getPlayer(playerId);
        const business = this.businesses.get(businessId);

        if (!player || !business) {
            return { success: false, error: 'Не найдено' };
        }

        // ПРОВЕРКА РАССТОЯНИЯ ДО РАБОТЫ
        if (player.district !== business.district) {
            // Нужен транспорт для работы в другом районе
            if (!player.vehicles || player.vehicles.length === 0) {
                return {
                    success: false,
                    error: 'Нужен транспорт для работы в другом районе'
                };
            }
        }

        // СОБЕСЕДОВАНИЕ (зависит от навыка общения)
        const interviewSuccess = Math.random() < (player.skills.communication * 0.2);

        if (!interviewSuccess) {
            return {
                success: false,
                error: 'Вам отказали после собеседования'
            };
        }

        player.work = businessId;
        player.employed = true;
        business.employees.push(playerId);

        return {
            success: true,
            message: `Поздравляем! Вы устроились на работу в ${business.name}`,
            salary: this.calculateSalary(business.type, player.skills)
        };
    }

    // ==================== СИСТЕМА ЖИЛЬЯ ====================

    buyProperty(playerId, propertyId) {
        const player = this.getPlayer(playerId);
        const property = this.properties.get(propertyId);

        if (!player || !property) {
            return { success: false, error: 'Не найдено' };
        }

        // ПРОВЕРКИ:
        // 1. Деньги
        if (player.balance < property.price) {
            return { success: false, error: 'Недостаточно средств' };
        }

        // 2. Уже есть жилье?
        if (player.home) {
            return { success: false, error: 'У вас уже есть жилье' };
        }

        // 3. Репутация в районе?
        const district = this.districts.get(property.district);
        if (district.wealth > 2 && player.reputation < 10) {
            return {
                success: false,
                error: 'Недостаточно репутации для покупки в этом районе'
            };
        }

        // ПОКУПКА
        player.balance -= property.price;
        player.home = propertyId;
        player.district = property.district; // Переезд!
        property.owner = playerId;

        // ОБНОВЛЯЕМ СТАТИСТИКУ РАЙОНА
        this.updateDistrictStats(property.district);

        return {
            success: true,
            message: `🎉 Вы купили ${property.name}! Теперь вы житель ${district.name}`,
            property: property,
            newDistrict: district
        };
    }

    // ==================== ПОЛИТИЧЕСКАЯ СИСТЕМА ====================

    startElection(districtId, position) {
        const district = this.districts.get(districtId);
        if (!district) return { success: false, error: 'Район не найден' };

        const election = {
            id: Date.now(),
            district: districtId,
            position: position, // 'mayor', 'council'
            candidates: [],
            voters: new Map(),
            startTime: Date.now(),
            endTime: Date.now() + 24 * 60 * 60 * 1000, // 24 часа
            status: 'active'
        };

        this.elections.set(election.id, election);

        // УВЕДОМЛЯЕМ ВСЕХ ЖИТЕЛЕЙ РАЙОНА
        this.notifyDistrict(districtId,
            `🗳️ Начались выборы ${position} в ${district.name}!`);

        return { success: true, election };
    }

    registerCandidate(electionId, playerId, program) {
        const election = this.elections.get(electionId);
        const player = this.getPlayer(playerId);

        if (!election || !player) {
            return { success: false, error: 'Не найдено' };
        }

        // ПРОВЕРКА: игрок должен жить в этом районе
        if (player.district !== election.district) {
            return {
                success: false,
                error: 'Вы не житель этого района'
            };
        }

        // ПРОВЕРКА РЕПУТАЦИИ
        if (player.reputation < 20) {
            return {
                success: false,
                error: 'Недостаточно репутации для выдвижения'
            };
        }

        const candidate = {
            playerId: playerId,
            name: player.name,
            program: program || 'Улучшим наш район!',
            votes: 0,
            promises: [],
            registeredAt: Date.now()
        };

        election.candidates.push(candidate);

        return { success: true, candidate };
    }

    // ==================== ЭКОНОМИКА ВЗАИМОДЕЙСТВИЯ ====================

    createBusinessContract(employerId, employeeId, terms) {
        const employer = this.getPlayer(employerId);
        const employee = this.getPlayer(employeeId);

        if (!employer || !employee) {
            return { success: false, error: 'Игрок не найден' };
        }

        // РАБОТОДАТЕЛЬ ДОЛЖЕН ИМЕТЬ БИЗНЕС
        if (!employer.businesses || employer.businesses.length === 0) {
            return { success: false, error: 'У вас нет бизнеса' };
        }

        const contract = {
            id: Date.now(),
            employer: employerId,
            employee: employeeId,
            terms: terms,
            salary: terms.salary,
            duration: terms.duration,
            signed: false,
            created: Date.now()
        };

        this.contracts.set(contract.id, contract);

        // УВЕДОМЛЯЕМ СОИСКАТЕЛЯ
        this.notifyPlayer(employeeId,
            `${employer.name} предлагает вам работу! Условия: ${terms.salary}Ч/день`);

        return { success: true, contract };
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    getPlayer(playerId) {
        return this.players.get(parseInt(playerId));
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getAvailableJobs(districtId, type) {
        // В реальной игре здесь сложная логика подбора работы
        return Array.from(this.businesses.values())
            .filter(b => b.district === districtId && b.owner && b.employees.length < 5)
            .map(b => ({
                id: b.id,
                name: b.name,
                type: b.type,
                salary: this.calculateSalary(b.type, { management: 1 }),
                requiredSkill: 'management',
                requiredLevel: 1
            }));
    }

    calculateSalary(businessType, skills) {
        const baseSalaries = {
            'food': 100,
            'retail': 120,
            'industrial': 150
        };
        return baseSalaries[businessType] || 100;
    }

    getRelationship(player1Id, player2Id) {
        const relationships = this.relationships.get(player1Id) || [];
        return relationships.find(r => r.player2 === parseInt(player2Id));
    }

    notifyPlayer(playerId, message) {
        // В реальной игре - отправка в Telegram
        console.log(`📨 Игроку ${playerId}: ${message}`);
    }

    notifyDistrict(districtId, message) {
        const playersInDistrict = this.getAllPlayers()
            .filter(p => p.district === districtId);

        playersInDistrict.forEach(player => {
            this.notifyPlayer(player.id, message);
        });
    }

    updateDistrictStats(districtId) {
        const district = this.districts.get(districtId);
        const playersInDistrict = this.getAllPlayers()
            .filter(p => p.district === districtId);

        district.population = playersInDistrict.length;
        district.wealth = Math.round(
            playersInDistrict.reduce((sum, p) => sum + p.balance, 0) /
            Math.max(1, playersInDistrict.length) / 1000
        );
    }

    startWorldCycles() {
        // ОБНОВЛЕНИЕ МИРА КАЖДЫЙ ЧАС
        setInterval(() => {
            this.updateWorld();
        }, 60 * 60 * 1000);

        // ВЫБОРЫ КАЖДУЮ НЕДЕЛЮ
        setInterval(() => {
            this.startRandomElection();
        }, 7 * 24 * 60 * 60 * 1000);
    }

    updateWorld() {
        // ОБНОВЛЕНИЕ ЭКОНОМИКИ, ПОТРЕБНОСТЕЙ И Т.Д.
        this.getAllPlayers().forEach(player => {
            // ТРАТЫ НА ЖИЗНЬ
            if (player.home) {
                player.balance -= 50; // Коммунальные платежи
            }

            // ПОТРЕБНОСТИ
            player.needs.food = Math.max(0, player.needs.food - 10);

            if (player.needs.food < 30) {
                this.notifyPlayer(player.id, '🍽️ Вы голодны! Купите еды.');
            }
        });

        console.log('🌍 Мир обновлен');
    }

    startRandomElection() {
        const districts = Array.from(this.districts.values());
        const randomDistrict = districts[Math.floor(Math.random() * districts.length)];

        this.startElection(randomDistrict.id, 'mayor');
    }

    getStatistics() {
        const players = this.getAllPlayers();
        return {
            totalPlayers: players.length,
            activePlayers: players.filter(p => Date.now() - p.lastActive < 24 * 60 * 60 * 1000).length,
            totalBusinesses: Array.from(this.businesses.values()).filter(b => b.owner).length,
            totalProperties: Array.from(this.properties.values()).filter(p => p.owner).length,
            marriedPlayers: players.filter(p => p.spouse).length,
            employedPlayers: players.filter(p => p.employed).length
        };
    }
}

const gameWorld = new LivingCityGame();

// ==================== TELEGRAM BOT ====================

let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('🤖 Telegram Bot запущен!');

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const username = msg.from.first_name;

        let player = gameWorld.getPlayer(userId);
        if (!player) {
            player = gameWorld.createPlayer({
                id: userId,
                name: username,
                username: msg.from.username
            });
        }

        const district = gameWorld.districts.get(player.district);

        const welcomeText = `🎮 Добро пожаловать в ЖИВОЙ ГОРОД, ${username}!

🏠 Ваш район: ${district.name}
💰 Баланс: ${player.balance}Ч
⚡ Энергия: ${player.energy}/100

🌍 Вы - часть живого мира, где каждый игрок важен!
Взаимодействуйте с соседями, стройте карьеру, влияйте на развитие города.

🚀 Используйте команды:
/help - помощь
/profile - ваш профиль  
/jobs - найти работу
/district - информация о районе`;

        bot.sendMessage(chatId, welcomeText);
    });

    bot.onText(/\/profile/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const player = gameWorld.getPlayer(userId);
        if (player) {
            const district = gameWorld.districts.get(player.district);
            const home = player.home ? 'Есть' : 'Нет';
            const work = player.work ? 'Работает' : 'Безработный';
            const spouse = player.spouse ? 'В браке' : 'Холост';

            const profileText = `👤 ВАШ ПРОФИЛЬ:

🏠 Район: ${district.name}
💼 Работа: ${work}
🏡 Жилье: ${home}
💍 Семья: ${spouse}

💰 Финансы: ${player.balance}Ч
⚡ Энергия: ${player.energy}/100
❤️ Здоровье: ${player.health}/100
⭐ Репутация: ${player.reputation}

👥 Социальные связи:
Друзей: ${player.friends.length}
Врагов: ${player.enemies.length}`;

            bot.sendMessage(chatId, profileText);
        }
    });

    bot.onText(/\/district/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const player = gameWorld.getPlayer(userId);
        if (player) {
            const district = gameWorld.districts.get(player.district);
            const stats = gameWorld.getStatistics();

            const districtText = `🏙️ ВАШ РАЙОН: ${district.name}

📊 Статистика:
👥 Население: ${district.population} человек
💰 Уровень жизни: ${district.wealth}/5
🛡️ Безопасность: ${district.safety}/5

💬 Общайтесь с соседями, участвуйте в выборах, улучшайте свой район!`;

            bot.sendMessage(chatId, districtText);
        }
    });

    bot.onText(/\/jobs/, (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const player = gameWorld.getPlayer(userId);
        if (player) {
            const jobs = gameWorld.findJob(userId, 'any');

            if (jobs.success) {
                let jobsText = '💼 ДОСТУПНЫЕ ВАКАНСИИ:\n\n';
                jobs.jobs.forEach(job => {
                    jobsText += `${job.name}\n💰 ${job.salary}Ч/день\n\n`;
                });

                const keyboard = {
                    inline_keyboard: jobs.jobs.map(job => [{
                        text: `Устроиться в ${job.name}`,
                        callback_data: `apply_job_${job.id}`
                    }])
                };

                bot.sendMessage(chatId, jobsText, { reply_markup: keyboard });
            } else {
                bot.sendMessage(chatId, `❌ ${jobs.error}`);
            }
        }
    });

    bot.on('callback_query', (callbackQuery) => {
        const msg = callbackQuery.message;
        const data = callbackQuery.data;
        const userId = callbackQuery.from.id;

        if (data.startsWith('apply_job_')) {
            const jobId = parseInt(data.split('_')[2]);
            const result = gameWorld.applyForJob(userId, jobId);

            if (result.success) {
                bot.sendMessage(msg.chat.id, `✅ ${result.message}\n💰 Зарплата: ${result.salary}Ч/день`);
            } else {
                bot.sendMessage(msg.chat.id, `❌ ${result.error}`);
            }
        }
    });
}

// ==================== EXPRESS API ====================

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// API endpoints будут здесь...

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🌍 Живой Город - RPG</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .header { 
                text-align: center; 
                padding: 30px 0; 
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                margin-bottom: 30px;
                backdrop-filter: blur(10px);
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr 1fr; 
                gap: 15px; 
                margin-bottom: 25px;
            }
            .stat-card { 
                background: rgba(255,255,255,0.15);
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .nav-grid { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }
            .nav-btn { 
                padding: 20px;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 15px;
                color: white;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
                border: 1px solid rgba(255,255,255,0.3);
            }
            .nav-btn:hover { 
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            .section { 
                background: rgba(255,255,255,0.1);
                padding: 25px;
                border-radius: 20px;
                margin-bottom: 25px;
                display: none;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .section.active { display: block; }
            .btn { 
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                padding: 15px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                margin: 10px 0;
                font-size: 16px;
                width: 100%;
                transition: all 0.3s;
            }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            .player-card { 
                background: rgba(255,255,255,0.15);
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 15px;
                border-left: 4px solid #4CAF50;
            }
            h1 { font-size: 2.5em; margin-bottom: 10px; }
            h2 { margin-bottom: 20px; color: #4CAF50; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌍 ЖИВОЙ ГОРОД</h1>
                <p>Онлайн-RPG где каждый игрок важен</p>
            </div>

            <div class="stats-grid" id="worldStats">
                <!-- Статистика мира будет здесь -->
            </div>

            <div class="nav-grid">
                <button class="nav-btn" onclick="showSection('world')">🌍 Мой мир</button>
                <button class="nav-btn" onclick="showSection('social')">👥 Социальное</button>
                <button class="nav-btn" onclick="showSection('work')">💼 Карьера</button>
                <button class="nav-btn" onclick="showSection('politics')">🏛️ Политика</button>
                <button class="nav-btn" onclick="showSection('economy')">💰 Экономика</button>
                <button class="nav-btn" onclick="showSection('property')">🏠 Имущество</button>
            </div>

            <div id="world" class="section active">
                <h2>🌍 ВАШ МИР</h2>
                <div id="playerStats"></div>
                <button class="btn" onclick="updateWorld()">🔄 Обновить</button>
            </div>

            <div id="social" class="section">
                <h2>👥 СОЦИАЛЬНЫЕ СВЯЗИ</h2>
                <div id="socialContent">Загрузка...</div>
            </div>

            <div id="work" class="section">
                <h2>💼 КАРЬЕРА</h2>
                <div id="workContent">Загрузка...</div>
            </div>

            <!-- Остальные секции... -->
        </div>

        <script>
            let currentPlayer = null;

            async function init() {
                await loadWorldStats();
                await loadPlayerData();
            }

            async function loadWorldStats() {
                const stats = await fetch('/api/world/stats').then(r => r.json());
                document.getElementById('worldStats').innerHTML = 
                    '<div class="stat-card">👥 Игроков<br>' + stats.totalPlayers + '</div>' +
                    '<div class="stat-card">🏢 Бизнесов<br>' + stats.totalBusinesses + '</div>' +
                    '<div class="stat-card">🏠 Недвижимости<br>' + stats.totalProperties + '</div>';
            }

            async function loadPlayerData() {
                // Загрузка данных игрока
                document.getElementById('playerStats').innerHTML = 
                    '<div class="player-card">' +
                    '<h3>Загрузка вашего профиля...</h3>' +
                    '<p>Подключаемся к миру...</p>' +
                    '</div>';
            }

            function showSection(sectionId) {
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(sectionId).classList.add('active');
            }

            init();
        </script>
    </body>
    </html>
    `);
});

// ==================== API ENDPOINTS ====================

app.post('/api/player/auth', express.json(), (req, res) => {
    const { id, name, username } = req.body;

    let player = gameWorld.getPlayer(id);
    if (!player) {
        player = gameWorld.createPlayer({
            id: id,
            name: name,
            username: username
        });
    }

    res.json(player);
});

app.get('/api/world/stats', (req, res) => {
    res.json(gameWorld.getStatistics());
});

app.get('/api/player/:playerId', (req, res) => {
    const player = gameWorld.getPlayer(parseInt(req.params.playerId));
    res.json(player || { error: 'Player not found' });
});

app.get('/api/district/:districtId', (req, res) => {
    const district = gameWorld.districts.get(parseInt(req.params.districtId));
    res.json(district || { error: 'District not found' });
});

app.get('/api/jobs/:playerId', (req, res) => {
    const result = gameWorld.findJob(parseInt(req.params.playerId), 'any');
    res.json(result);
});

app.post('/api/jobs/apply', express.json(), (req, res) => {
    const { playerId, jobId } = req.body;
    const result = gameWorld.applyForJob(playerId, jobId);
    res.json(result);
});

// ==================== START SERVER ====================

app.listen(port, () => {
    console.log('🌍 ЖИВОЙ ГОРОД - RPG ЗАПУЩЕН!');
    console.log('📍 Порт:', port);
    console.log('🤖 Telegram Bot:', process.env.TELEGRAM_BOT_TOKEN ? '✅ АКТИВЕН' : '❌ ОТКЛЮЧЕН');
    console.log('🚀 ОСНОВНЫЕ СИСТЕМЫ:');
    console.log('   🌍 Динамический мир с районами');
    console.log('   👥 Реальные социальные взаимодействия');
    console.log('   💼 Сложная система работы и карьеры');
    console.log('   🏛️ Политика с выборами и законами');
    console.log('   🏠 Осмысленная система имущества');
    console.log('📱 ИГРА ГОТОВА К ТЕСТИРОВАНИЮ!');
});