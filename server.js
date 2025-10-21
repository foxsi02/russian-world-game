require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Простая база данных для игры
class GameDB {
    constructor() {
        this.players = new Map();
    }

    createPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            username: playerData.username,
            balance: 1000,
            level: 1,
            reputation: 0,
            role: null
        };
        this.players.set(player.id, player);
        return player;
    }

    getPlayer(id) {
        return this.players.get(parseInt(id));
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    chooseRole(playerId, role) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.role = role;
            return { success: true, message: `Вы стали ${role}` };
        }
        return { success: false, message: 'Игрок не найден' };
    }
}

const gameDB = new GameDB();

// Инициализация Telegram бота
let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

    // Команда /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name;

        const keyboard = {
            inline_keyboard: [[
                {
                    text: '🎮 Начать игру',
                    web_app: { url: process.env.TELEGRAM_WEBAPP_URL || `https://${process.env.RAILWAY_STATIC_URL}` }
                }
            ]]
        };

        bot.sendMessage(chatId, `🎮 Добро пожаловать в Русский Мир, ${username}!\n\nНажми кнопку ниже чтобы начать играть:`, {
            reply_markup: keyboard
        });
    });

    console.log('🤖 Telegram Bot запущен!');
}

// Основной маршрут для игры
app.get('/', (req, res) => {
    const isTelegram = req.get('user-agent')?.includes('Telegram');

    if (isTelegram) {
        // Версия для Telegram WebApp
        res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🇷🇺 Русский Мир</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
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
            .btn {
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
            .stats {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🇷🇺 Русский Мир</h1>
                <p>Ваша виртуальная империя!</p>
            </div>

            <div class="stats">
                <h3>👤 Ваш профиль</h3>
                <p>💰 Баланс: <span id="balance">1000</span>Ч</p>
                <p>🎯 Уровень: <span id="level">1</span></p>
            </div>

            <button class="btn" onclick="work()">
                💼 Работать (+100Ч)
            </button>
            
            <button class="btn" onclick="chooseRole('businessman')">
                💼 Стать бизнесменом
            </button>
            
            <button class="btn" onclick="chooseRole('politician')">
                🏛️ Стать политиком
            </button>

            <button class="btn" onclick="shareGame()">
                📤 Пригласить друга
            </button>
        </div>

        <script>
            let tg = window.Telegram.WebApp;
            
            // Инициализация Telegram WebApp
            tg.expand();
            tg.ready();

            function work() {
                tg.showPopup({
                    title: 'Работа выполнена!',
                    message: 'Вы заработали 100Ч'
                });
                document.getElementById('balance').textContent = 
                    parseInt(document.getElementById('balance').textContent) + 100;
            }

            function chooseRole(role) {
                const roles = {
                    'businessman': '💼 Бизнесмен',
                    'politician': '🏛️ Политик'
                };
                tg.showPopup({
                    title: 'Поздравляем!',
                    message: 'Вы стали ' + roles[role]
                });
            }

            function shareGame() {
                tg.shareUrl(
                    'https://t.me/russian_world_game_bot',
                    'Присоединяйся к Русскому Миру! 🎮'
                );
            }
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
            .info {
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
        
        <div class="info">
            <p><strong>🚀 Игра успешно запущена на Railway!</strong></p>
            <p>Для полного доступа откройте игру в Telegram</p>
        </div>
        
        <a href="https://t.me/russian_world_game_bot" class="btn">
            📲 Открыть в Telegram
        </a>
        
        <div style="margin-top: 30px;">
            <p><strong>Статус:</strong> ✅ Сервер работает</p>
            <p><strong>Хостинг:</strong> Railway.app</p>
        </div>
    </body>
    </html>
    `);
    }
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Сервер работает на Railway',
        timestamp: new Date().toISOString(),
        players: gameDB.getAllPlayers().length
    });
});

app.post('/api/telegram/auth', express.json(), (req, res) => {
    const { id, first_name, username } = req.body;

    let player = gameDB.getPlayer(id);
    if (!player) {
        player = gameDB.createPlayer({
            id: id,
            name: first_name,
            username: username
        });
    }

    res.json(player);
});

// Запуск сервера
app.listen(port, () => {
    console.log('🎮 Сервер Русский Мир запущен!');
    console.log('📍 Порт:', port);
    console.log('🌐 URL:', process.env.RAILWAY_STATIC_URL || `http://localhost:${port}`);
});