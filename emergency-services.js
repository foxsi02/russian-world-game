// emergency-services.js
class EmergencyServices {
    constructor() {
        this.policeJobs = [
            {
                id: 1,
                name: "🚓 Полицейский патрульный",
                description: "Патрулирование улиц города, обеспечение порядка",
                baseIncome: 80,
                requirements: { level: 2, reputation: 200 },
                cooldown: 600000, // 10 минут
                risks: ["нападение преступников", "коррупционные схемы"],
                rewards: ["повышение репутации", "бонусы за аресты"]
            },
            {
                id: 2,
                name: "🕵️ Следователь",
                description: "Расследование преступлений, сбор доказательств",
                baseIncome: 120,
                requirements: { level: 3, reputation: 400 },
                cooldown: 900000, // 15 минут
                risks: ["опасные расследования", "угрозы"],
                rewards: ["крупные премии", "повышение в должности"]
            },
            {
                id: 3,
                name: "🚨 ОМОН",
                description: "Задержание опасных преступников, спецоперации",
                baseIncome: 150,
                requirements: { level: 4, reputation: 600 },
                cooldown: 1200000, // 20 минут
                risks: ["вооруженное сопротивление", "травмы"],
                rewards: ["геройские бонусы", "спецнаграды"]
            }
        ];

        this.firefighterJobs = [
            {
                id: 1,
                name: "🚒 Пожарный-спасатель",
                description: "Тушение пожаров и спасение людей",
                baseIncome: 70,
                requirements: { level: 2, reputation: 150 },
                cooldown: 600000,
                risks: ["опасность при пожаре", "травмы"],
                rewards: ["бонусы за спасение", "медали"]
            },
            {
                id: 2,
                name: "👨‍🚒 Командир отделения",
                description: "Руководство пожарными расчетами",
                baseIncome: 100,
                requirements: { level: 3, reputation: 300 },
                cooldown: 900000,
                risks: ["ответственность за команду", "сложные пожары"],
                rewards: ["премии за успешные операции", "повышение"]
            },
            {
                id: 3,
                name: "🚁 Пожарный-вертолетчик",
                description: "Тушение с воздуха, эвакуация",
                baseIncome: 180,
                requirements: { level: 5, reputation: 500 },
                cooldown: 1800000,
                risks: ["аварии техники", "сложные погодные условия"],
                rewards: ["высокие премии", "элитные награды"]
            }
        ];

        this.medicalJobs = [
            {
                id: 1,
                name: "🚑 Врач скорой помощи",
                description: "Экстренная медицинская помощь",
                baseIncome: 90,
                requirements: { level: 3, reputation: 250 },
                cooldown: 600000,
                risks: ["сложные случаи", "эпидемии"],
                rewards: ["бонусы за спасение", "репутация"]
            },
            {
                id: 2,
                name: "🏥 Хирург",
                description: "Сложные операции в госпитале",
                baseIncome: 160,
                requirements: { level: 4, reputation: 450 },
                cooldown: 1200000,
                risks: ["ответственность за жизни", "профессиональные ошибки"],
                rewards: ["высокие гонорары", "международное признание"]
            },
            {
                id: 3,
                name: "🧠 Психиатр",
                description: "Помощь в сложных жизненных ситуациях",
                baseIncome: 110,
                requirements: { level: 3, reputation: 350 },
                cooldown: 900000,
                risks: ["эмоциональное выгорание", "сложные пациенты"],
                rewards: ["уникальные случаи", "научные открытия"]
            }
        ];
    }

    getAvailableJobs(player, serviceType) {
        const jobs = this[`${serviceType}Jobs`];
        if (!jobs) return [];

        return jobs.filter(job =>
            player.level >= job.requirements.level &&
            player.reputation >= job.requirements.reputation
        );
    }
}

module.exports = EmergencyServices;