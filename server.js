require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const GameDB = require('./game-db');

const app = express();
const port = process.env.PORT || 3000;

const gameDB = new GameDB();

// ==================== TELEGRAM BOT SETUP ====================

let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
        const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL || `https://${process.env.RAILWAY_STATIC_URL}`;

        bot.setWebHook(`${WEBAPP_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

        app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });

        console.log('🤖 Telegram Bot запущен через Webhook');
    } else {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        console.log('🤖 Telegram Bot запущен через Polling');
    }

    // Команда /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name;

        const welcomeText = `🎮 Добро пожаловать в Русский Мир, ${username}!

🇷🇺 Создай свою империю в альтернативной реальности!

✨ Возможности:
• 💰 Зарабатывай деньги и строй бизнес-империю
• 🎭 Выбери роль: Полицейский, Бизнесмен, Политик или Преступник
• 🏛️ Участвуй в выборах и принимай законы
• 👥 Общайся с другими игроками
• 🏢 Создавай корпорации и торгуй на бирже
• 🎯 Прокачивай навыки и становись лучше

🎁 Начни игру прямо сейчас!`;

        const keyboard = {
            inline_keyboard: [[
                {
                    text: '🎮 Начать игру',
                    web_app: { url: process.env.TELEGRAM_WEBAPP_URL || `http://localhost:${port}` }
                }
            ]]
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
            const profileText = `👤 Ваш профиль:

💰 Баланс: ${player.balance.toLocaleString()}Ч
🎯 Уровень: ${player.level}
⭐ Репутация: ${player.reputation}
⚡ Энергия: ${player.energy}/100
❤️ Здоровье: ${Math.round(player.health)}/100
🎭 Роль: ${player.role ? gameDB.getRoleName(player.role) : 'Не выбрана'}

💼 Бизнесов: ${player.businesses.length}
👥 Друзей: ${player.friends.length}`;

            bot.sendMessage(chatId, profileText);
        } else {
            bot.sendMessage(chatId, '❌ Вы еще не начали игру. Нажмите /start');
        }
    });

    // Команда /top
    bot.onText(/\/top/, (msg) => {
        const chatId = msg.chat.id;
        const topPlayers = gameDB.getHallOfFame().slice(0, 5);

        let topText = '🏆 Топ-5 игроков:\n\n';
        topPlayers.forEach((player, index) => {
            topText += `${index + 1}. ${player.name} - 💰 ${player.balance.toLocaleString()}Ч\n`;
        });

        bot.sendMessage(chatId, topText);
    });
}

app.use(express.static('public'));
app.use(express.json());

// CORS для WebApp
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// ==================== TELEGRAM WEBAPP ROUTE ====================

app.get('/', (req, res) => {
    const isTelegramWebApp = req.get('sec-ch-ua')?.includes('Telegram') ||
        req.get('user-agent')?.includes('Telegram');

    if (isTelegramWebApp) {
        res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🇷🇺 Русский Мир</title>
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
            .container { 
                max-width: 100%; 
            }
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
            .nav-btn:hover { 
                background: rgba(255,255,255,0.3); 
            }
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
                <h1>🇷🇺 Русский Мир</h1>
                <p>Ваша виртуальная империя в Telegram!</p>
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
                <button class="nav-btn" onclick="showSection('social')">👥 Социальное</button>
                <button class="nav-btn" onclick="showSection('games')">🎮 Игры</button>
            </div>

            <!-- Dashboard Section -->
            <div id="dashboard" class="section active">
                <h3>📊 Обзор игрока</h3>
                <div id="playerOverview" class="stats-grid"></div>
                
                <h3>🏆 Топ игроки</h3>
                <div id="topPlayers"></div>
                
                <button class="btn btn-telegram" onclick="shareGame()">
                    📤 Пригласить друзей
                </button>
            </div>

            <!-- Economy Section -->
            <div id="economy" class="section">
                <h3>💰 Экономика</h3>
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
                
                <h4>💼 Доступные работы</h4>
                <div id="availableJobs"></div>
            </div>

            <!-- Roles Section -->
            <div id="roles" class="section">
                <h3>🎭 Система Ролей</h3>
                <div id="currentRoleInfo"></div>
                
                <h4>Выберите роль:</h4>
                <button class="btn" onclick="chooseRole('police')">👮 Полицейский</button>
                <button class="btn" onclick="chooseRole('businessman')">💼 Бизнесмен</button>
                <button class="btn" onclick="chooseRole('politician')">🏛️ Политик</button>
                <button class="btn btn-warning" onclick="chooseRole('criminal')">🕵️ Преступник</button>
                
                <div id="roleDescription" style="margin-top: 15px;"></div>
            </div>

            <!-- Skills Section -->
            <div id="skills" class="section">
                <h3>🎯 Навыки и Прокачка</h3>
                <div id="skillsList"></div>
                
                <h4>💪 Прокачать навык</h4>
                <select id="skillSelect" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                    <option value="law_enforcement">Правоприменение</option>
                    <option value="investigation">Расследование</option>
                    <option value="stealth">Скрытность</option>
                    <option value="hacking">Взлом</option>
                    <option value="negotiation">Переговоры</option>
                    <option value="management">Управление</option>
                    <option value="rhetoric">Риторика</option>
                    <option value="diplomacy">Дипломатия</option>
                </select>
                <input type="number" id="skillExp" placeholder="Опыт для добавления" value="100" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;">
                <button class="btn" onclick="addSkillExperience()">🎯 Прокачать навык</button>
            </div>

            <!-- Business Section -->
            <div id="business" class="section">
                <h3>🏢 Бизнес-империя</h3>
                <button class="btn" onclick="loadBusinesses()">🔄 Обновить список</button>
                <button class="btn" onclick="collectBusinessIncome()">💰 Собрать доход</button>
                
                <h4>🛒 Доступные бизнесы</h4>
                <div id="availableBusinesses"></div>
                
                <h4>🏭 Мои бизнесы</h4>
                <div id="myBusinesses"></div>
                
                <h4>🏢 Корпорации</h4>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 10px 0;">
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

            <!-- Stocks Section -->
            <div id="stocks" class="section">
                <h3>📈 Фондовый рынок</h3>
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

            <!-- Social Section -->
            <div id="social" class="section">
                <h3>👥 Социальная сеть</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>👥 Друзья</h4>
                        <div id="friendsCount">0</div>
                    </div>
                    <div class="stat-card">
                        <h4>🤝 Отношения</h4>
                        <div>Уровень: 0</div>
                    </div>
                </div>
                
                <h4>👤 Добавить друга</h4>
                <select id="friendSelect" style="width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none;"></select>
                <button class="btn" onclick="addFriend()">🤝 Добавить друга</button>
                
                <h4>📊 Мои друзья</h4>
                <div id="friendsList"></div>
            </div>

            <!-- Games Section -->
            <div id="games" class="section">
                <h3>🎮 Мини-игры</h3>
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
            let tg = window.Telegram.WebApp;
            let currentPlayerId = null;
            let currentPlayer = null;
            
            // Инициализация Telegram WebApp
            tg.expand();
            tg.enableClosingConfirmation();
            tg.BackButton.show();
            
            // Получаем данные пользователя
            const user = tg.initDataUnsafe?.user;
            if (user) {
                document.getElementById('userName').textContent = user.first_name + (user.username ? ' (@' + user.username + ')' : '');
                currentPlayerId = user.id;
                
                // Регистрируем/авторизуем пользователя
                registerTelegramUser(user);
            }

            async function registerTelegramUser(userData) {
                try {
                    const response = await fetch('/api/telegram/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: userData.id,
                            first_name: userData.first_name,
                            username: userData.username,
                            language_code: userData.language_code
                        })
                    });
                    
                    const player = await response.json();
                    currentPlayer = player;
                    updatePlayerDisplay(player);
                    loadAllData();
                } catch (error) {
                    console.error('Ошибка регистрации:', error);
                    tg.showPopup({ title: 'Ошибка', message: 'Не удалось загрузить данные' });
                }
            }

            function updatePlayerDisplay(player) {
                document.getElementById('userStats').innerHTML = 
                    '<div class="stat-card">💰 Баланс<br>' + player.balance.toLocaleString() + 'Ч</div>' +
                    '<div class="stat-card">🎯 Уровень<br>' + player.level + '</div>' +
                    '<div class="stat-card">⚡ Энергия<br>' + player.energy + '/100</div>' +
                    '<div class="stat-card">❤️ Здоровье<br>' + Math.round(player.health) + '/100</div>';
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
                    case 'social':
                        loadSocial();
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
                loadSocial();
                loadGames();
            }

            // Базовые функции API
            async function apiCall(endpoint, options = {}) {
                try {
                    const response = await fetch(endpoint, {
                        headers: { 'Content-Type': 'application/json' },
                        ...options
                    });
                    return await response.json();
                } catch (error) {
                    console.error('API Error:', error);
                    tg.showPopup({ title: 'Ошибка', message: 'Ошибка соединения' });
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
                    document.getElementById('topPlayers').innerHTML = topPlayers.slice(0, 5).map((player, index) => 
                        '<div class="player-card">' +
                        '<strong>' + (index + 1) + '. ' + player.name + '</strong><br>' +
                        '💰 ' + player.balance.toLocaleString() + 'Ч | ' + 
                        (player.role ? getRoleName(player.role) : 'Нет роли') +
                        '</div>'
                    ).join('');
                }
            }

            // ==================== ECONOMY FUNCTIONS ====================

            async function loadEconomy() {
                const jobs = await apiCall('/api/available-jobs/' + currentPlayerId);
                if (jobs) {
                    document.getElementById('availableJobs').innerHTML = jobs.map(job => 
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
                    tg.showPopup({ title: 'Успех!', message: result.message });
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                    loadEconomy();
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.message });
                }
            }

            async function claimDailyBonus() {
                const result = await apiCall('/api/daily-bonus/' + currentPlayerId);
                if (result && result.success) {
                    tg.showPopup({ title: 'Бонус!', message: result.message });
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Инфо', message: result.message });
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
                } else {
                    document.getElementById('currentRoleInfo').innerHTML = 
                        '<div class="stat-card">' +
                        '<h4>Роль не выбрана</h4>' +
                        '<p>Выберите роль чтобы получить специальные возможности!</p>' +
                        '</div>';
                }

                // Описания ролей
                document.getElementById('roleDescription').innerHTML = 
                    '<div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">' +
                    '<h5>👮 Полицейский</h5>' +
                    '<p>Охрана порядка, аресты, патрулирование</p>' +
                    '<h5>💼 Бизнесмен</h5>' +
                    '<p>Развитие бизнеса, защита от грабителей</p>' +
                    '<h5>🏛️ Политик</h5>' +
                    '<p>Принятие законов, влияние на экономику</p>' +
                    '<h5>🕵️ Преступник</h5>' +
                    '<p>Ограбления, уклонение от правосудия</p>' +
                    '</div>';
            }

            async function chooseRole(role) {
                if (currentPlayer && currentPlayer.role) {
                    tg.showPopup({ title: 'Внимание', message: 'Вы уже выбрали роль!' });
                    return;
                }

                const result = await apiCall('/api/choose-role/' + currentPlayerId + '/' + role);
                if (result && result.success) {
                    tg.showPopup({ title: 'Поздравляем!', message: result.message });
                    currentPlayer = await apiCall('/api/player/' + currentPlayerId);
                    loadRoles();
                    loadSkills();
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.message });
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
                    tg.showPopup({ title: 'Ошибка', message: 'Введите корректное значение опыта' });
                    return;
                }

                const result = await apiCall('/api/skills/add-exp/' + currentPlayerId + '/' + skillId + '/' + exp);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: 'Навык прокачан до уровня ' + result.level });
                    loadSkills();
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else {
                    tg.showPopup({ title: 'Ошибка', message: 'Не удалось прокачать навык' });
                }
            }

            // ==================== BUSINESS FUNCTIONS ====================

            async function loadBusiness() {
                // Загрузка доступных бизнесов
                const businesses = [
                    { id: 1, name: '🏪 Магазин продуктов', price: 5000, income: 200 },
                    { id: 2, name: '🏢 Офисное здание', price: 15000, income: 500 },
                    { id: 3, name: '🍽️ Ресторан', price: 25000, income: 800 },
                    { id: 4, name: '🏭 Завод', price: 50000, income: 1500 }
                ];

                document.getElementById('availableBusinesses').innerHTML = businesses.map(business => 
                    '<div class="business-card">' +
                    '<strong>' + business.name + '</strong><br>' +
                    '💰 Цена: ' + business.price.toLocaleString() + 'Ч<br>' +
                    '📈 Доход: ' + business.income + 'Ч/сбор<br>' +
                    '<button class="btn" onclick="buyBusiness(' + business.id + ')">🛒 Купить</button>' +
                    '</div>'
                ).join('');

                // Загрузка моих бизнесов
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

                // Загрузка корпораций
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

            async function buyBusiness(businessId) {
                const result = await apiCall('/api/buy-business/' + currentPlayerId + '/' + businessId);
                if (result && result.success) {
                    tg.showPopup({ title: 'Поздравляем!', message: result.message });
                    loadBusiness();
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.message });
                }
            }

            async function collectBusinessIncome() {
                const result = await apiCall('/api/collect-business-income/' + currentPlayerId);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: result.message });
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Инфо', message: result.message });
                }
            }

            async function createCorporation() {
                const name = document.getElementById('corpName').value;
                const capital = parseInt(document.getElementById('corpCapital').value);
                const type = document.getElementById('corpType').value;

                if (!name || capital < 50000) {
                    tg.showPopup({ title: 'Ошибка', message: 'Заполните название и капитал (мин. 50,000Ч)' });
                    return;
                }

                const result = await apiCall('/api/corporation/create/' + currentPlayerId + '/' + encodeURIComponent(name) + '/' + capital + '/' + type);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: 'Корпорация "' + name + '" создана!' });
                    document.getElementById('corpName').value = '';
                    document.getElementById('corpCapital').value = '50000';
                    loadBusiness();
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.error });
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
                    tg.showPopup({ title: 'Ошибка', message: 'Введите корректное количество' });
                    return;
                }

                const result = await apiCall('/api/stocks/buy/' + currentPlayerId + '/' + symbol + '/' + quantity);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: result.message });
                    loadStocks();
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.message });
                }
            }

            // ==================== SOCIAL FUNCTIONS ====================

            async function loadSocial() {
                const player = await apiCall('/api/player/' + currentPlayerId);
                if (!player) return;

                document.getElementById('friendsCount').textContent = player.friends.length;

                // Загрузка списка игроков для добавления в друзья
                const allPlayers = await apiCall('/api/all-players');
                if (allPlayers) {
                    const availableFriends = allPlayers.filter(p => 
                        p.id !== currentPlayerId && 
                        !player.friends.includes(p.id)
                    );
                    
                    document.getElementById('friendSelect').innerHTML = availableFriends.map(p => 
                        '<option value="' + p.id + '">' + p.name + ' (' + (p.role ? getRoleName(p.role) : 'Нет роли') + ')</option>'
                    ).join('');
                }

                // Загрузка списка друзей
                if (player.friends.length > 0) {
                    const friends = allPlayers.filter(p => player.friends.includes(p.id));
                    document.getElementById('friendsList').innerHTML = friends.map(friend => 
                        '<div class="player-card">' +
                        '<strong>' + friend.name + '</strong><br>' +
                        '💰 ' + friend.balance.toLocaleString() + 'Ч | ' + 
                        (friend.role ? getRoleName(friend.role) : 'Нет роли') +
                        '</div>'
                    ).join('');
                } else {
                    document.getElementById('friendsList').innerHTML = '<p>У вас пока нет друзей</p>';
                }
            }

            async function addFriend() {
                const friendId = document.getElementById('friendSelect').value;
                if (!friendId) {
                    tg.showPopup({ title: 'Ошибка', message: 'Выберите друга' });
                    return;
                }

                const result = await apiCall('/api/relationships/add-friend/' + currentPlayerId + '/' + friendId);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: result.message });
                    loadSocial();
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.error });
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
                    tg.showPopup({ title: 'Ошибка', message: 'Введите корректную ставку' });
                    return;
                }

                const result = await apiCall('/api/games/poker/start/' + currentPlayerId + '/' + bet);
                if (result && result.success) {
                    tg.showPopup({ title: 'Успех!', message: 'Покерная игра создана! ID: ' + result.gameId });
                    updatePlayerDisplay(await apiCall('/api/player/' + currentPlayerId));
                } else if (result) {
                    tg.showPopup({ title: 'Ошибка', message: result.error });
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

            // Функция для приглашения друзей
            function shareGame() {
                tg.shareUrl(
                    'https://t.me/russian_world_game_bot',
                    '🎮 Присоединяйся к Русскому Миру! Строй свою империю в Telegram!'
                );
            }

            // Кнопка назад в Telegram
            tg.BackButton.onClick(() => {
                showSection('dashboard');
            });

            // Инициализация при загрузке
            tg.ready();
        </script>
    </body>
    </html>
    `);
    } else {
        // Версия для обычного браузера
        res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🇷🇺 Русский Мир</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .btn {
                background: #0088cc;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 10px;
                font-size: 18px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
            }
            .status {
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 10px;
                margin: 20px auto;
                max-width: 500px;
            }
        </style>
    </head>
    <body>
        <h1>🎮 Русский Мир - Виртуальная Империя</h1>
        
        <div class="status">
            <p><strong>🚀 Полная версия игры!</strong></p>
            <p>Все механики восстановлены и готовы к работе</p>
            <p>Для полного доступа откройте игру в Telegram</p>
        </div>
        
        <a href="https://t.me/russian_world_game_bot" class="btn">
            📲 Открыть в Telegram
        </a>
        
        <a href="/admin" class="btn" style="background: #27ae60;">
            🔧 Админ Панель
        </a>
        
        <div style="margin-top: 30px;">
            <p><strong>Статус:</strong> ✅ Полная версия активна</p>
            <p><strong>Игроков:</strong> <span id="playersCount">0</span></p>
        </div>

        <script>
            fetch('/api/statistics')
                .then(r => r.json())
                .then(stats => {
                    document.getElementById('playersCount').textContent = stats.totalPlayers;
                });
        </script>
    </body>
    </html>
    `);
    }
});

// ==================== API ENDPOINTS ====================

// Telegram аутентификация
app.post('/api/telegram/auth', express.json(), (req, res) => {
    const { id, first_name, username, language_code } = req.body;

    let player = gameDB.getPlayer(id);
    if (!player) {
        player = gameDB.createPlayer({
            id: id,
            name: first_name,
            username: username,
            balance: 1000,
            level: 1,
            reputation: 0,
            telegramData: req.body
        });
    } else {
        player.lastActive = Date.now();
    }

    res.json(player);
});

// Основные endpoints для игроков
app.get('/api/all-players', (req, res) => {
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

// Экономика
app.get('/api/available-jobs/:playerId', (req, res) => {
    const jobs = gameDB.getAvailableJobs(parseInt(req.params.playerId));
    res.json(jobs);
});

app.get('/api/work/:playerId/:jobId', (req, res) => {
    const result = gameDB.workJob(
        parseInt(req.params.playerId),
        parseInt(req.params.jobId)
    );
    res.json(result);
});

app.get('/api/daily-bonus/:playerId', (req, res) => {
    const result = gameDB.claimDailyBonus(parseInt(req.params.playerId));
    res.json(result);
});

// Роли и навыки
app.get('/api/choose-role/:playerId/:role', (req, res) => {
    const result = gameDB.chooseRole(
        parseInt(req.params.playerId),
        req.params.role
    );
    res.json(result);
});

app.get('/api/skills/add-exp/:playerId/:skillId/:exp', (req, res) => {
    const result = gameDB.addSkillExperience(
        parseInt(req.params.playerId),
        req.params.skillId,
        parseInt(req.params.exp)
    );
    res.json(result);
});

// Бизнес и корпорации
app.get('/api/buy-business/:playerId/:businessId', (req, res) => {
    const result = gameDB.buyBusiness(
        parseInt(req.params.playerId),
        parseInt(req.params.businessId)
    );
    res.json(result);
});

app.get('/api/collect-business-income/:playerId', (req, res) => {
    const result = gameDB.collectBusinessIncome(parseInt(req.params.playerId));
    res.json(result);
});

app.get('/api/corporation/create/:playerId/:name/:capital/:type', (req, res) => {
    const result = gameDB.createCorporation(
        parseInt(req.params.playerId),
        req.params.name,
        parseInt(req.params.capital),
        req.params.type
    );
    res.json(result);
});

// Фондовый рынок
app.get('/api/stocks/market', (req, res) => {
    res.json(Array.from(gameDB.stockMarket.values()));
});

app.get('/api/stocks/buy/:playerId/:symbol/:quantity', (req, res) => {
    const result = gameDB.buyStock(
        parseInt(req.params.playerId),
        req.params.symbol,
        parseInt(req.params.quantity)
    );
    res.json(result);
});

// Социальные связи
app.get('/api/relationships/add-friend/:playerId/:friendId', (req, res) => {
    const result = gameDB.addFriend(
        parseInt(req.params.playerId),
        parseInt(req.params.friendId)
    );
    res.json(result);
});

// Мини-игры
app.get('/api/games/poker/start/:playerId/:bet', (req, res) => {
    const result = gameDB.startPokerGame(
        parseInt(req.params.playerId),
        parseInt(req.params.bet)
    );
    res.json(result);
});

// Здоровье и энергия
app.get('/api/vitals/consume-energy/:playerId/:amount/:action', (req, res) => {
    const result = gameDB.consumeEnergy(
        parseInt(req.params.playerId),
        parseInt(req.params.amount),
        req.params.action
    );
    res.json(result);
});

// ==================== ADMIN PANEL ====================

app.get('/admin', (req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
      <title>Админ Панель - Русский Мир</title>
      <style>
          body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: #2c3e50;
              color: white;
          }
          .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 15px; 
              margin-bottom: 20px; 
          }
          .stat-card { 
              background: rgba(255,255,255,0.1); 
              padding: 20px; 
              border-radius: 10px; 
              text-align: center; 
          }
          .btn { 
              background: #3498db; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer; 
              margin: 5px; 
          }
      </style>
  </head>
  <body>
      <h1>🔧 Админ Панель - Русский Мир</h1>
      
      <div class="stats-grid" id="adminStats"></div>
      
      <div>
          <button class="btn" onclick="loadAdminStats()">🔄 Обновить</button>
          <button class="btn" style="background: #e74c3c;" onclick="sendGlobalNotification()">📢 Уведомление</button>
      </div>

      <script>
          async function loadAdminStats() {
              const response = await fetch('/api/statistics');
              const stats = await response.json();
              
              document.getElementById('adminStats').innerHTML = 
                  '<div class="stat-card">👥 Игроков<br>' + stats.totalPlayers + '</div>' +
                  '<div class="stat-card">💰 Общий баланс<br>' + stats.totalBalance.toLocaleString() + 'Ч</div>' +
                  '<div class="stat-card">🎮 Активных<br>' + stats.activePlayers + '</div>' +
                  '<div class="stat-card">🏢 Бизнесов<br>' + stats.totalBusinesses + '</div>' +
                  '<div class="stat-card">🏭 Корпораций<br>' + stats.totalCorporations + '</div>' +
                  '<div class="stat-card">🏛️ Выборов<br>' + stats.activeElections + '</div>';
          }

          function sendGlobalNotification() {
              const message = prompt('Введите сообщение для всех игроков:');
              if (message) {
                  alert('Уведомление отправлено: ' + message);
              }
          }

          loadAdminStats();
      </script>
  </body>
  </html>
  `);
});

// ==================== START SERVER ====================

app.listen(port, () => {
    console.log('🎮 Русский Мир - Полная версия запущена!');
    console.log('📍 Порт:', port);
    console.log('🌐 Среда:', process.env.NODE_ENV || 'development');
    console.log('🤖 Telegram Bot:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Активен' : '❌ Отключен');
    console.log('🚀 Готов к работе!');
});