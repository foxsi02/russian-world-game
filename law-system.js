class LawSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.policeForces = new Map();
        this.activeBounties = new Map();
        this.courtCases = new Map();
    }

    // ПОЛИЦЕЙСКИЕ ДЕЖУРСТВА
    startPolicePatrol(policeId, district) {
        const police = this.gameDB.players.get(policeId);
        if (police.role !== 'police') return { error: "Только полицейские могут патрулировать" };

        // Шанс найти преступника во время патруля
        const crimeChance = 30; // 30% шанс
        if (Math.random() * 100 < crimeChance) {
            const criminal = this.findRandomCriminalInDistrict(district);
            if (criminal) {
                // Начинаем погоню
                this.gameDB.startPoliceChase(policeId, criminal.id);
                return { event: 'chase_started', criminal: criminal.name };
            }
        }

        return { event: 'quiet_shift', experience: 10 };
    }
}