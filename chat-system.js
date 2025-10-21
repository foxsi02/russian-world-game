// chat-system.js
class ChatSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.chats = new Map();
        this.messages = new Map();
        this.initializeDefaultChats();
    }

    initializeDefaultChats() {
        // Основные игровые чаты
        const defaultChats = [
            {
                id: 1,
                name: "📢 Общий чат города",
                type: "public",
                description: "Общение всех игроков",
                members: [],
                rules: "Уважайте друг друга",
                maxMembers: 1000
            },
            {
                id: 2,
                name: "🏛️ Политический чат",
                type: "political",
                description: "Обсуждение политики и выборов",
                members: [],
                requirements: { level: 2 },
                maxMembers: 200
            },
            {
                id: 3,
                name: "💼 Бизнес-чат",
                type: "business",
                description: "Деловые переговоры и сделки",
                members: [],
                requirements: { status: "Бизнесмен" },
                maxMembers: 150
            },
            {
                id: 4,
                name: "🕵️ Секретный чат",
                type: "secret",
                description: "Для шпионов и агентов",
                members: [],
                requirements: { reputation: 500 },
                maxMembers: 50,
                hidden: true
            }
        ];

        defaultChats.forEach(chat => {
            this.chats.set(chat.id, chat);
            this.messages.set(chat.id, []);
        });
    }

    // Отправка сообщения
    sendMessage(chatId, playerId, text) {
        const chat = this.chats.get(chatId);
        const player = this.gameDB.players.get(playerId);

        if (!chat || !player) {
            return { error: "Чат или игрок не найден" };
        }

        // Проверка доступа к чату
        if (!this.canAccessChat(chat, player)) {
            return { error: "Нет доступа к этому чату" };
        }

        // Создание сообщения
        const message = {
            id: Date.now(),
            chatId: chatId,
            playerId: playerId,
            playerName: player.name,
            text: text,
            timestamp: new Date(),
            type: "text"
        };

        // Добавление в историю
        if (!this.messages.has(chatId)) {
            this.messages.set(chatId, []);
        }
        this.messages.get(chatId).push(message);

        // Ограничение истории (последние 100 сообщений)
        if (this.messages.get(chatId).length > 100) {
            this.messages.set(chatId, this.messages.get(chatId).slice(-100));
        }

        // Логирование важных сообщений
        if (this.isImportantMessage(text)) {
            this.gameDB.addToLog(`💬 ${player.name} в чате "${chat.name}": ${text}`);
        }

        return {
            success: true,
            message: message
        };
    }

    // Проверка доступа к чату
    canAccessChat(chat, player) {
        if (chat.type === "public") return true;

        if (chat.requirements) {
            if (chat.requirements.level && player.level < chat.requirements.level) return false;
            if (chat.requirements.status && player.status !== chat.requirements.status) return false;
            if (chat.requirements.reputation && player.reputation < chat.requirements.reputation) return false;
        }

        return true;
    }

    // Создание личного чата
    createPrivateChat(player1Id, player2Id) {
        const player1 = this.gameDB.players.get(player1Id);
        const player2 = this.gameDB.players.get(player2Id);

        if (!player1 || !player2) {
            return { error: "Игроки не найдены" };
        }

        const chatId = `private_${Math.min(player1Id, player2Id)}_${Math.max(player1Id, player2Id)}`;

        if (!this.chats.has(chatId)) {
            const chat = {
                id: chatId,
                name: `💬 ${player1.name} ↔ ${player2.name}`,
                type: "private",
                members: [player1Id, player2Id],
                created: new Date()
            };

            this.chats.set(chatId, chat);
            this.messages.set(chatId, []);
        }

        return {
            success: true,
            chatId: chatId
        };
    }

    // Создание группового чата
    createGroupChat(creatorId, name, description) {
        const creator = this.gameDB.players.get(creatorId);
        if (!creator) return { error: "Создатель не найден" };

        const chatId = `group_${Date.now()}`;
        const chat = {
            id: chatId,
            name: `👥 ${name}`,
            description: description,
            type: "group",
            creator: creatorId,
            members: [creatorId],
            created: new Date(),
            maxMembers: 50
        };

        this.chats.set(chatId, chat);
        this.messages.set(chatId, []);

        return {
            success: true,
            chatId: chatId
        };
    }

    // Получение доступных чатов для игрока
    getAvailableChats(playerId) {
        const player = this.gameDB.players.get(playerId);
        if (!player) return [];

        const availableChats = [];

        this.chats.forEach(chat => {
            if (this.canAccessChat(chat, player)) {
                // Для приватных чатов показываем только если игрок участник
                if (chat.type === "private") {
                    if (chat.members.includes(playerId)) {
                        availableChats.push(chat);
                    }
                } else {
                    availableChats.push(chat);
                }
            }
        });

        return availableChats;
    }

    // Получение истории сообщений
    getChatHistory(chatId, playerId, limit = 50) {
        const chat = this.chats.get(chatId);
        const player = this.gameDB.players.get(playerId);

        if (!chat || !player || !this.canAccessChat(chat, player)) {
            return { error: "Нет доступа к чату" };
        }

        const messages = this.messages.get(chatId) || [];
        return messages.slice(-limit);
    }

    // Поиск игроков для чата
    searchPlayers(query, currentPlayerId) {
        const results = [];
        const searchTerm = query.toLowerCase();

        this.gameDB.players.forEach(player => {
            if (player.id !== currentPlayerId &&
                player.name.toLowerCase().includes(searchTerm)) {
                results.push({
                    id: player.id,
                    name: player.name,
                    status: player.status,
                    level: player.level
                });
            }
        });

        return results.slice(0, 10); // Ограничиваем результаты
    }

    // Проверка важных сообщений
    isImportantMessage(text) {
        const importantKeywords = [
            'выборы', 'мэр', 'налог', 'коррупция', 'скандал',
            'преступление', 'арест', 'пожар', 'спасение'
        ];

        return importantKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    }

    // Торговые предложения в чате
    createTradeMessage(playerId, item, price, description) {
        const player = this.gameDB.players.get(playerId);
        if (!player) return { error: "Игрок не найден" };

        return {
            type: "trade",
            playerId: playerId,
            playerName: player.name,
            item: item,
            price: price,
            description: description,
            timestamp: new Date(),
            active: true
        };
    }

    // Системные уведомления
    sendSystemMessage(chatId, text) {
        const message = {
            id: Date.now(),
            chatId: chatId,
            playerId: 0,
            playerName: "🤖 Система",
            text: text,
            timestamp: new Date(),
            type: "system"
        };

        if (!this.messages.has(chatId)) {
            this.messages.set(chatId, []);
        }
        this.messages.get(chatId).push(message);

        return message;
    }
}

module.exports = ChatSystem;