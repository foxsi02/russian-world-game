class RelationshipsSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.relationships = new Map();
        this.marriages = new Map();
        this.friendships = new Map();
    }

    addFriend(playerId, friendId) {
        const player = this.gameDB.players.get(playerId);
        const friend = this.gameDB.players.get(friendId);

        if (!player || !friend) return { error: "Игроки не найдены" };

        const friendship = {
            player1: playerId,
            player2: friendId,
            level: 1,
            trust: 10,
            lastInteraction: new Date()
        };

        const friendshipId = `${Math.min(playerId, friendId)}_${Math.max(playerId, friendId)}`;
        this.friendships.set(friendshipId, friendship);

        player.friends = player.friends || [];
        if (!player.friends.includes(friendId)) {
            player.friends.push(friendId);
        }

        friend.friends = friend.friends || [];
        if (!friend.friends.includes(playerId)) {
            friend.friends.push(playerId);
        }

        return { success: true, friendship: friendship };
    }
}

module.exports = RelationshipsSystem;