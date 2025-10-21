class SkillsSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.skills = new Map();
        this.professions = new Map();
        this.initializeSkills();
        this.initializeProfessions();
    }

    initializeSkills() {
        const roleSkills = {
            police: [
                { id: 'law_enforcement', name: 'Правоприменение', maxLevel: 100 },
                { id: 'investigation', name: 'Расследование', maxLevel: 100 },
                { id: 'firearms', name: 'Стрельба', maxLevel: 100 },
                { id: 'physical', name: 'Физподготовка', maxLevel: 100 }
            ],
            criminal: [
                { id: 'stealth', name: 'Скрытность', maxLevel: 100 },
                { id: 'hacking', name: 'Взлом', maxLevel: 100 },
                { id: 'lockpicking', name: 'Взлом замков', maxLevel: 100 },
                { id: 'intimidation', name: 'Запугивание', maxLevel: 100 }
            ],
            businessman: [
                { id: 'negotiation', name: 'Переговоры', maxLevel: 100 },
                { id: 'management', name: 'Управление', maxLevel: 100 },
                { id: 'marketing', name: 'Маркетинг', maxLevel: 100 },
                { id: 'finance', name: 'Финансы', maxLevel: 100 }
            ],
            politician: [
                { id: 'rhetoric', name: 'Риторика', maxLevel: 100 },
                { id: 'diplomacy', name: 'Дипломатия', maxLevel: 100 },
                { id: 'law', name: 'Юриспруденция', maxLevel: 100 },
                { id: 'public_relations', name: 'Пиар', maxLevel: 100 }
            ]
        };

        Object.entries(roleSkills).forEach(([role, skills]) => {
            this.skills.set(role, skills);
        });
    }

    initializeProfessions() {
        const professions = {
            police: [
                { name: 'Патрульный', requirements: { law_enforcement: 10 }, salary: 1200 },
                { name: 'Детектив', requirements: { investigation: 30 }, salary: 2000 },
                { name: 'Спецназ', requirements: { firearms: 50, physical: 40 }, salary: 3000 }
            ],
            criminal: [
                { name: 'Карманник', requirements: { stealth: 10 }, income: 800 },
                { name: 'Взломщик', requirements: { lockpicking: 30 }, income: 2000 },
                { name: 'Киберпреступник', requirements: { hacking: 50 }, income: 4000 }
            ],
            businessman: [
                { name: 'Менеджер', requirements: { management: 20 }, salary: 1500 },
                { name: 'Директор', requirements: { management: 40, negotiation: 30 }, salary: 3000 },
                { name: 'CEO', requirements: { management: 70, finance: 50 }, salary: 8000 }
            ]
        };

        Object.entries(professions).forEach(([role, profs]) => {
            this.professions.set(role, profs);
        });
    }

    addSkillExperience(playerId, skillId, exp) {
        const player = this.gameDB.players.get(playerId);
        if (!player.skills) player.skills = {};
        if (!player.skills[skillId]) {
            player.skills[skillId] = { level: 1, exp: 0, totalExp: 0 };
        }

        player.skills[skillId].exp += exp;
        player.skills[skillId].totalExp += exp;

        // Проверка уровня
        const requiredExp = this.getRequiredExp(player.skills[skillId].level);
        if (player.skills[skillId].exp >= requiredExp) {
            player.skills[skillId].level++;
            player.skills[skillId].exp = 0;

            this.gameDB.addToLog(`🎯 ${player.name} повысил навык до ${player.skills[skillId].level} уровня`);
        }

        return { success: true, level: player.skills[skillId].level, exp: player.skills[skillId].exp };
    }

    getRequiredExp(level) {
        return level * 1000;
    }
}

module.exports = SkillsSystem;