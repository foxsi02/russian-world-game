class CrimeSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.criminalNetwork = new Map();
        this.activeCrimes = new Map();
        this.bountyList = new Map();
    }

    // ПРЕСТУПНИКИ МОГУТ ОБЪЕДИНЯТЬСЯ В ГРУППИРОВКИ
    createCriminalGang(leaderId, name) {
        const leader = this.gameDB.players.get(leaderId);
        if (leader.role !== 'criminal') return { error: "Только преступники могут создавать группировки" };
        
        const gang = {
            id: Date.now(),
            name: name,
            leader: leaderId,
            members: [leaderId],
            reputation: 0,
            treasury: 0,
            territory: []
        };
        
        this.criminalNetwork.set(gang.id, gang);
        return { success: true, gang: gang };
    }

    // СИСТЕМА РОЗЫСКА
    addToWantedList(criminalId, crime, bounty) {
        const criminal = this.gameDB.players.get(criminalId);
        criminal.wantedLevel = (criminal.wantedLevel || 0) + 10;
        
        this.bountyList.set(criminalId, {
            criminalId: criminalId,
            crime: crime,
            bounty: bounty,
            added: new Date()
        });
        
        // Уведомляем полицию
        this.gameDB.chatSystem.sendSystemMessage('police_chat', 
            `🚨 РОЗЫСК: ${criminal.name} - ${crime}. Награда: ${bounty}Ч`
        );
    }
}