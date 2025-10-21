require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Простая база данных
class SimpleGameDB {
    constructor() {
        this.players = new Map();
        // Добавляем тестового игрока
        this.createPlayer({ id: 1, name: "Тестовый Игрок", balance: 1000 });
    }

    createPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            balance: playerData.balance || 1000,
            level: playerData.level || 1
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
}

const gameDB = new SimpleGameDB();

// Основной маршрут
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🇷🇺 Русский Мир</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
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
                transition: all 0.3s;
            }
            .btn:hover {
                background: #006699;
                transform: translateY(-2px);
            }
            .status {
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Русский Мир - Виртуальная Империя</h1>
            
            <div class="status">
                <p><strong>🚀 Статус:</strong> ✅ Сервер работает на Railway</p>
                <p><strong>👥 Игроков:</strong> ${gameDB.getAllPlayers().length}</p>
                <p><strong>🔧 Версия:</strong> Базовая (Telegram бот отключен)</p>
            </div>
            
            <a href="https://t.me/russian_world_game_bot" class="btn">
                📲 Тест бота в Telegram
            </a>
            
            <a href="/api/status" class="btn" style="background: #27ae60;">
                📊 API Статус
            </a>
            
            <a href="/admin" class="btn" style="background: #e74c3c;">
                🔧 Админ Панель
            </a>
        </div>
    </body>
    </html>
  `);
});

// Админ панель
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Админ Панель</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #2c3e50;
                color: white;
            }
        </style>
    </head>
    <body>
        <h1>🔧 Админ Панель</h1>
        <p>Telegram бот временно отключен для стабилизации</p>
        <a href="/" style="color: #3498db;">← Назад к игре</a>
    </body>
    </html>
  `);
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Сервер работает (бот отключен)',
        timestamp: new Date().toISOString(),
        players: gameDB.getAllPlayers().length,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/players', (req, res) => {
    res.json(gameDB.getAllPlayers());
});

// Запуск сервера
app.listen(port, () => {
    console.log('🎮 Сервер запущен!');
    console.log('📍 Порт:', port);
    console.log('🌐 Среда:', process.env.NODE_ENV || 'development');
    console.log('🤖 Telegram Bot: ❌ Отключен');
});