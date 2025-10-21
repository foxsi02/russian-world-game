require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const GameDB = require('./game-db');

const app = express();
const port = process.env.PORT || 3000;

const gameDB = new GameDB();

// Инициализация Telegram Bot
let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

    // Команда /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name;

        const welcomeText = `🎮 Добро пожаловать в Русский Мир, ${username}!

🇷🇺 Создай свою империю в альтернативной реальности!

✨ Возможности:
• 🏛️ Стань политиком или бизнесменом
• 💰 Строй экономическую империю  
• 👥 Общайся с другими игроками
• 🎯 Участвуй в политических выборах

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

    console.log('🤖 Telegram Bot запущен!');
}

app.use(express.static('public'));
app.use(express.json());

// ==================== TELEGRAM WEBAPP ROUTE ====================

app.get('/', (req, res) => {
    // Проверяем, открыто ли в Telegram WebApp
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
                padding: 10px;
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
            .telegram-btn {
                background: #0088cc;
                color: white;
                padding: 15px 25px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                margin: 10px 0;
                width: 100%;
                cursor: pointer;
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
            }
            .section { 
                background: rgba(255,255,255,0.1); 
                padding: 15px; 
                border-radius: 15px; 
                margin-bottom: 15px; 
                display: none; 
            }
            .section.active { display: block; }
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
            }
            .player-card { 
                background: rgba(255,255,255,0.15); 
                padding: 12px; 
                border-radius: 10px; 
                border-left: 4px solid #4CAF50;
                margin-bottom: 10px;
            }
            .user-info {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 15px;
                text-align: center;
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
                <p id="userBalance">Баланс: 0Ч</p>
            </div>

            <div class="nav">
                <button class="nav-btn" onclick="showSection('dashboard')">📊 Статистика</button>
                <button class="nav-btn" onclick="showSection('roles')">🎭 Роли</button>
                <button class="nav-btn" onclick="showSection('economy')">💰 Экономика</button>
                <button class="nav-btn" onclick="showSection('politics')">🏛️ Политика</button>
                <button class="nav-btn" onclick="showSection('business')">🏢 Бизнес</button>
                <button class="nav-btn" onclick="showSection('social')">👥 Соц. сеть</button>
            </div>

            <!-- Dashboard Section -->
            <div id="dashboard" class="section active">
                <h3>📊 Ваш профиль</h3>
                <div id="playerStats" class="stats-grid"></div>
                
                <h3>🏆 Топ игроки</h3>
                <div id="topPlayers"></div>
                
                <button class="telegram-btn" onclick="shareGame()">
                    📤 Пригласить друзей
                </button>
            </div>

            <!-- Roles Section -->
            <div id="roles" class="section">
                <h3>🎭 Выберите роль</h3>
                <button class="btn" onclick="chooseRole('police')">👮 Полицейский</button>
                <button class="btn" onclick="chooseRole('businessman')">💼 Бизнесмен</button>
                <button class="btn" onclick="chooseRole('politician')">🏛️ Политик</button>
                <button class="btn" onclick="chooseRole('criminal')">🕵️ Преступник</button>
                
                <div id="currentRole" style="margin-top: 15px;"></div>
            </div>

            <!-- Economy Section -->
            <div id="economy" class="section">
                <h3>💰 Экономика</h3>
                <button class="btn" onclick="work()">💼 Работать (+100Ч)</button>
                <button class="btn" onclick="dailyBonus()">🎁 Ежедневный бонус</button>
                <div id="economyInfo" style="margin-top: 15px;"></div>
            </div>

            <!-- Politics Section -->
            <div id="politics" class="section">
                <h3>🏛️ Политика</h3>
                <p>Скоро будет доступно!</p>
            </div>

            <!-- Business Section -->
            <div id="business" class="section">
                <h3>🏢 Бизнес</h3>
                <p>Скоро будет доступно!</p>
            </div>

            <!-- Social Section -->
            <div id="social" class="section">
                <h3>👥 Социальная сеть</h3>
                <p>Скоро будет доступно!</p>
            </div>
        </div>

        <script>
            let tg = window.Telegram.WebApp;
            let currentPlayerId = null;
            
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

            function registerTelegramUser(userData) {
                fetch('/api/telegram/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: userData.id,
                        first_name: userData.first_name,
                        username: userData.username,
                        language_code: userData.language_code
                    })
                })
                .then(r => r.json())
                .then(player => {
                    document.getElementById('userBalance').textContent = 'Баланс: ' + player.balance + 'Ч';
                    loadPlayerStats();
                    loadTopPlayers();
                });
            }

            function showSection(sectionId) {
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(sectionId).classList.add('active');
            }

            function loadPlayerStats() {
                fetch('/api/player/' + currentPlayerId)
                    .then(r => r.json())
                    .then(player => {
                        document.getElementById('playerStats').innerHTML = 
                            '<div class="stat-card">💰 Баланс<br>' + player.balance + 'Ч</div>' +
                            '<div class="stat-card">🎯 Уровень<br>' + (player.level || 1) + '</div>' +
                            '<div class="stat-card">⭐ Репутация<br>' + (player.reputation || 0) + '</div>' +
                            '<div class="stat-card">👥 Друзья<br>' + (player.friends?.length || 0) + '</div>';
                            
                        // Показываем текущую роль
                        if (player.role) {
                            document.getElementById('currentRole').innerHTML = 
                                '<div class="stat-card">🎭 Текущая роль: ' + getRoleName(player.role) + '</div>';
                        }
                    });
            }

            function loadTopPlayers() {
                fetch('/api/all-players')
                    .then(r => r.json())
                    .then(players => {
                        const topPlayers = players
                            .sort((a, b) => b.balance - a.balance)
                            .slice(0, 5);
                            
                        document.getElementById('topPlayers').innerHTML = topPlayers.map(player => 
                            '<div class="player-card">' +
                            '<strong>' + player.name + '</strong><br>' +
                            '💰 ' + player.balance + 'Ч' +
                            '</div>'
                        ).join('');
                    });
            }

            function getRoleName(role) {
                const names = {
                    'police': '👮 Полицейский',
                    'criminal': '🕵️ Преступник',
                    'businessman': '💼 Бизнесмен', 
                    'politician': '🏛️ Политик'
                };
                return names[role] || role;
            }

            function chooseRole(role) {
                fetch('/api/choose-role/' + currentPlayerId + '/' + role)
                    .then(r => r.json())
                    .then(result => {
                        tg.showPopup({ 
                            title: 'Роль выбрана!', 
                            message: result.message 
                        });
                        loadPlayerStats();
                    });
            }

            function work() {
                fetch('/api/work/' + currentPlayerId + '/1')
                    .then(r => r.json())
                    .then(result => {
                        if (result.success) {
                            tg.showPopup({ 
                                title: 'Работа выполнена!', 
                                message: 'Вы заработали +100Ч' 
                            });
                            loadPlayerStats();
                        }
                    });
            }

            function dailyBonus() {
                tg.showPopup({ 
                    title: 'Скоро!', 
                    message: 'Ежедневные бонусы появятся в следующем обновлении' 
                });
            }

            function shareGame() {
                tg.shareUrl(
                    'https://t.me/russian_world_game_bot',
                    '🎮 Присоединяйся к Русскому Миру! Строй свою империю в Telegram!'
                );
            }

            // Загрузка при старте
            loadPlayerStats();
            loadTopPlayers();
            
            // Кнопка назад в Telegram
            tg.BackButton.onClick(() => {
                showSection('dashboard');
            });
        </script>
    </body>
    </html>
    `);
    } else {
        // Старая версия для браузера
        res.send(`<!DOCTYPE html>
    <html>
    <head>
        <title>🇷🇺 Русский Мир</title>
        <style>body { text-align: center; padding: 50px; }</style>
    </head>
    <body>
        <h1>🇷🇺 Русский Мир</h1>
        <p>Эта игра доступна только в Telegram!</p>
        <a href="https://t.me/russian_world_game_bot" style="padding: 15px 25px; background: #0088cc; color: white; text-decoration: none; border-radius: 10px;">
            Открыть в Telegram
        </a>
    </body>
    </html>`);
    }
});

// ==================== TELEGRAM AUTH API ====================

app.post('/api/telegram/auth', express.json(), (req, res) => {
    const { id, first_name, username, language_code } = req.body;

    // Регистрируем пользователя
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
    }

    res.json(player);
});

// ==================== EXISTING API ENDPOINTS ====================

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

app.get('/api/choose-role/:playerId/:role', (req, res) => {
    const result = gameDB.chooseRole(
        parseInt(req.params.playerId),
        req.params.role
    );
    res.json(result);
});

app.get('/api/work/:playerId/:jobId', (req, res) => {
    const result = gameDB.workJob(
        parseInt(req.params.playerId),
        parseInt(req.params.jobId)
    );
    res.json(result);
});

// ==================== ADMIN PANEL ====================

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html>
    <head>
        <title>Админ Панель</title>
        <style>body { text-align: center; padding: 50px; }</style>
    </head>
    <body>
        <h1>🔧 Админ Панель</h1>
        <p>Админ панель будет доступна после настройки Telegram</p>
    </body>
    </html>`);
});

app.listen(port, () => {
    console.log('🎮 Русский Мир запущен!');
    console.log('📍 Основная игра: http://localhost:' + port);
    console.log('🔧 Админ панель: http://localhost:' + port + '/admin');
    console.log('🤖 Telegram Bot: @russian_world_game_bot');
    console.log('📱 Telegram WebApp: Готов к работе!');
});