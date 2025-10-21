class VitalSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.energyRecoveryRate = 1;
        this.healthRecoveryRate = 0.2;
    }

    updatePlayerVitals(playerId) {
        const player = this.gameDB.players.get(playerId);
        if (!player.vitals) {
            player.vitals = {
                health: 100,
                energy: 100,
                lastUpdate: Date.now(),
                status: 'healthy'
            };
        }

        const now = Date.now();
        const timeDiff = (now - player.vitals.lastUpdate) / 60000;

        player.vitals.energy = Math.min(100, player.vitals.energy + (timeDiff * this.energyRecoveryRate));

        if (player.vitals.status === 'healthy') {
            player.vitals.health = Math.min(100, player.vitals.health + (timeDiff * this.healthRecoveryRate));
        }

        player.vitals.lastUpdate = now;
    }

    consumeEnergy(playerId, amount, action) {
        const player = this.gameDB.players.get(playerId);
        this.updatePlayerVitals(playerId);

        if (player.vitals.energy < amount) {
            return { success: false, error: "Недостаточно энергии" };
        }

        player.vitals.energy -= amount;
        return { success: true, remainingEnergy: player.vitals.energy };
    }

    takeDamage(playerId, damage, source) {
        const player = this.gameDB.players.get(playerId);
        this.updatePlayerVitals(playerId);

        player.vitals.health = Math.max(0, player.vitals.health - damage);

        if (player.vitals.health <= 0) {
            player.vitals.health = 100;
            player.vitals.status = 'recovering';
            return { died: true, health: 100 };
        }

        if (player.vitals.health < 30) {
            player.vitals.status = 'critical';
        } else if (player.vitals.health < 70) {
            player.vitals.status = 'injured';
        }

        return { died: false, health: player.vitals.health, status: player.vitals.status };
    }
}

module.exports = VitalSystem;