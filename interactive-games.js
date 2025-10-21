class InteractiveGames {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.activeGames = new Map();
    }

    startPokerGame(playerId, betAmount) {
        const creator = this.gameDB.players.get(playerId);

        if (creator.balance < betAmount) {
            return { error: "Недостаточно средств для создания игры" };
        }

        const game = {
            id: Date.now(),
            type: 'poker',
            creator: playerId,
            players: [playerId],
            bet: betAmount,
            pot: betAmount,
            status: 'waiting',
            created: new Date()
        };

        creator.balance -= betAmount;
        this.activeGames.set(game.id, game);

        return {
            success: true,
            gameId: game.id,
            bet: betAmount
        };
    }
}

module.exports = InteractiveGames;