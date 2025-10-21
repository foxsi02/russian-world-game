class LawSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.policeForces = new Map();
        this.activeBounties = new Map();
        this.courtCases = new Map();
    }

    // ����������� ���������
    startPolicePatrol(policeId, district) {
        const police = this.gameDB.players.get(policeId);
        if (police.role !== 'police') return { error: "������ ����������� ����� �������������" };

        // ���� ����� ����������� �� ����� �������
        const crimeChance = 30; // 30% ����
        if (Math.random() * 100 < crimeChance) {
            const criminal = this.findRandomCriminalInDistrict(district);
            if (criminal) {
                // �������� ������
                this.gameDB.startPoliceChase(policeId, criminal.id);
                return { event: 'chase_started', criminal: criminal.name };
            }
        }

        return { event: 'quiet_shift', experience: 10 };
    }
}