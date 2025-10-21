class PoliticalSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.parties = new Map();
        this.elections = [];
        this.currentGovernment = new Map();
        this.campaigns = new Map();
        this.votes = new Map();
        this.politicalEvents = [];
        this.laws = [];

        this.initializeParties();
        this.startElectionCycle();
        this.initializeGovernmentPositions();
    }

    initializeParties() {
        const parties = [
            {
                id: 1,
                name: "🏛️ Партия Порядка",
                ideology: "консервативный",
                leader: null,
                members: [],
                popularity: 35,
                treasury: 100000,
                color: "#0055a5",
                description: "Стабильность и традиционные ценности"
            },
            {
                id: 2,
                name: "💼 Деловой Альянс",
                ideology: "либеральный",
                leader: null,
                members: [],
                popularity: 25,
                treasury: 75000,
                color: "#ff6600",
                description: "Свободный рынок и развитие бизнеса"
            },
            {
                id: 3,
                name: "⚖️ Союз Справедливости",
                ideology: "социал-демократический",
                leader: null,
                members: [],
                popularity: 20,
                treasury: 60000,
                color: "#ff0000",
                description: "Социальная защита и равные возможности"
            },
            {
                id: 4,
                name: "🌳 Экологический Фронт",
                ideology: "экологический",
                leader: null,
                members: [],
                popularity: 15,
                treasury: 40000,
                color: "#00aa00",
                description: "Устойчивое развитие и защита природы"
            },
            {
                id: 5,
                name: "🔧 Партия Прогресса",
                ideology: "прогрессивный",
                leader: null,
                members: [],
                popularity: 5,
                treasury: 30000,
                color: "#800080",
                description: "Технологии и инновации"
            }
        ];

        parties.forEach(party => {
            this.parties.set(party.id, party);
        });
    }

    initializeGovernmentPositions() {
        const positions = [
            {
                id: "president",
                name: "Президент Республики",
                salary: 10000,
                requirements: { level: 20, reputation: 5000 },
                powers: [
                    "назначать министров",
                    "подписывать законы",
                    "объявлять чрезвычайное положение",
                    "руководить вооруженными силами"
                ],
                electionCycle: 30,
                influence: 100
            },
            {
                id: "mayor",
                name: "Мэр Столицы",
                salary: 7000,
                requirements: { level: 15, reputation: 3000 },
                powers: [
                    "управлять городским бюджетом",
                    "строить городские объекты",
                    "назначать чиновников",
                    "вводить местные налоги"
                ],
                electionCycle: 14,
                influence: 80
            },
            {
                id: "police_chief",
                name: "Генерал Полиции",
                salary: 6000,
                requirements: { level: 12, reputation: 2500 },
                powers: [
                    "патрулирование городов",
                    "борьба с преступностью",
                    "назначение наград",
                    "расследование коррупции"
                ],
                electionCycle: 21,
                influence: 70
            },
            {
                id: "economic_minister",
                name: "Министр Экономики",
                salary: 6500,
                requirements: { level: 18, reputation: 3500 },
                powers: [
                    "регулировать экономику",
                    "собирать налоги",
                    "выдавать лицензии бизнесу",
                    "контролировать цены"
                ],
                electionCycle: 21,
                influence: 85
            },
            {
                id: "health_minister",
                name: "Министр Здравоохранения",
                salary: 5500,
                requirements: { level: 10, reputation: 2000 },
                powers: [
                    "строить больницы",
                    "запускать медицинские программы",
                    "управлять аптеками",
                    "объявлять карантин"
                ],
                electionCycle: 21,
                influence: 60
            }
        ];

        this.governmentPositions = positions;

        // Изначально назначаем NPC на должности
        positions.forEach(position => {
            this.currentGovernment.set(position.id, {
                position: position.id,
                playerId: 0, // NPC
                playerName: `Временный ${position.name}`,
                salary: position.salary,
                appointed: new Date(),
                achievements: []
            });
        });
    }

    // ИГРОК СОЗДАЕТ ПАРТИЮ
    createParty(playerId, partyName, ideology, description) {
        const player = this.gameDB.players.get(playerId);
        if (!player) return { error: "Игрок не найден" };

        if (player.level < 10) return { error: "Требуется 10+ уровень для создания партии" };
        if (player.balance < 50000) return { error: "Требуется 50,000Ч для создания партии" };
        if (player.reputation < 2000) return { error: "Требуется 2,000+ репутации" };

        // Проверяем, не состоит ли уже в партии
        for (let party of this.parties.values()) {
            if (party.members.includes(playerId) || party.leader === playerId) {
                return { error: "Вы уже состоите в партии" };
            }
        }

        const newParty = {
            id: Date.now(),
            name: partyName,
            ideology: ideology,
            description: description,
            leader: playerId,
            members: [playerId],
            popularity: 5,
            treasury: 50000,
            color: this.generateRandomColor(),
            created: new Date(),
            manifesto: [],
            achievements: []
        };

        // Списание денег у игрока
        player.balance -= 50000;

        this.parties.set(newParty.id, newParty);

        // Создаем чат для партии
        this.gameDB.chatSystem.createPartyChat(newParty.id, partyName, playerId);

        return {
            success: true,
            party: newParty,
            message: `Партия "${partyName}" успешно создана!`
        };
    }

    // ВСТУПЛЕНИЕ В ПАРТИЮ
    joinParty(playerId, partyId) {
        const player = this.gameDB.players.get(playerId);
        const party = this.parties.get(partyId);

        if (!player || !party) return { error: "Игрок или партия не найдены" };

        if (party.members.includes(playerId)) {
            return { error: "Вы уже состоите в этой партии" };
        }

        if (player.level < 5) return { error: "Требуется 5+ уровень для вступления в партию" };

        party.members.push(playerId);
        party.popularity += 1;

        // Добавляем игрока в чат партии
        this.gameDB.chatSystem.addToPartyChat(partyId, playerId);

        return {
            success: true,
            message: `Вы вступили в партию "${party.name}"`
        };
    }

    // ВЫДВИЖЕНИЕ КАНДИДАТА НА ВЫБОРЫ
    registerCandidate(playerId, position, campaignPromise, campaignBudget) {
        const player = this.gameDB.players.get(playerId);
        const positionInfo = this.governmentPositions.find(p => p.id === position);

        if (!player || !positionInfo) return { error: "Игрок или должность не найдены" };

        // Проверка требований
        if (player.level < positionInfo.requirements.level) {
            return { error: `Требуется уровень ${positionInfo.requirements.level}+` };
        }

        if (player.reputation < positionInfo.requirements.reputation) {
            return { error: `Требуется репутация ${positionInfo.requirements.reputation}+` };
        }

        if (player.balance < campaignBudget) {
            return { error: "Недостаточно средств для кампании" };
        }

        // Создаем кампанию
        const campaign = {
            id: Date.now(),
            candidateId: playerId,
            candidateName: player.name,
            position: position,
            promise: campaignPromise,
            budget: campaignBudget,
            spent: 0,
            supporters: [],
            votes: 0,
            startDate: new Date(),
            events: []
        };

        // Списание бюджета
        player.balance -= campaignBudget;

        this.campaigns.set(campaign.id, campaign);

        // Создаем событие в чатах
        this.gameDB.chatSystem.sendSystemMessage(1,
            `🎭 ${player.name} выдвинулся на должность ${positionInfo.name}! Обещает: ${campaignPromise}`
        );

        return {
            success: true,
            campaign: campaign,
            message: `Вы зарегистрированы кандидатом на должность ${positionInfo.name}`
        };
    }

    // ПОДДЕРЖКА КАНДИДАТА
    supportCandidate(supporterId, candidateId, supportType, amount = 0) {
        const supporter = this.gameDB.players.get(supporterId);
        const candidate = this.gameDB.players.get(candidateId);

        if (!supporter || !candidate) return { error: "Игроки не найдены" };

        let campaign = null;
        for (let camp of this.campaigns.values()) {
            if (camp.candidateId === candidateId) {
                campaign = camp;
                break;
            }
        }

        if (!campaign) return { error: "Кампания не найдена" };

        let message = "";

        switch (supportType) {
            case "financial":
                if (supporter.balance < amount) return { error: "Недостаточно средств" };
                supporter.balance -= amount;
                campaign.budget += amount;
                campaign.supporters.push({
                    playerId: supporterId,
                    type: "financial",
                    amount: amount,
                    date: new Date()
                });
                message = `Вы пожертвовали ${amount}Ч в кампанию ${candidate.name}`;
                break;

            case "volunteer":
                campaign.supporters.push({
                    playerId: supporterId,
                    type: "volunteer",
                    date: new Date()
                });
                campaign.budget += 500; // Волонтеры экономят деньги
                message = `Вы стали волонтером в кампании ${candidate.name}`;
                break;

            case "endorsement":
                if (supporter.reputation < 1000) return { error: "Требуется 1000+ репутации для поддержки" };
                campaign.supporters.push({
                    playerId: supporterId,
                    type: "endorsement",
                    reputation: supporter.reputation,
                    date: new Date()
                });
                campaign.budget += supporter.reputation * 2;
                message = `Вы публично поддержали ${candidate.name}`;
                break;
        }

        return { success: true, message };
    }

    // ГОЛОСОВАНИЕ
    vote(voterId, candidateId, position) {
        const voter = this.gameDB.players.get(voterId);
        const candidate = this.gameDB.players.get(candidateId);

        if (!voter || !candidate) return { error: "Игроки не найдены" };

        // Проверяем, не голосовал ли уже
        const voteKey = `${position}_${voterId}`;
        if (this.votes.has(voteKey)) {
            return { error: "Вы уже голосовали на этих выборах" };
        }

        // Ищем кампанию кандидата
        let campaign = null;
        for (let camp of this.campaigns.values()) {
            if (camp.candidateId === candidateId && camp.position === position) {
                campaign = camp;
                break;
            }
        }

        if (!campaign) return { error: "Кампания не найдена" };

        // Записываем голос
        this.votes.set(voteKey, {
            voterId: voterId,
            candidateId: candidateId,
            position: position,
            date: new Date()
        });

        campaign.votes += 1;
        candidate.reputation += 10;

        return {
            success: true,
            message: `Ваш голос за ${candidate.name} учтен!`
        };
    }

    // ПРОВЕДЕНИЕ ВЫБОРОВ
    conductElections(position) {
        const positionInfo = this.governmentPositions.find(p => p.id === position);
        if (!positionInfo) return { error: "Должность не найдена" };

        const campaignsForPosition = [];
        for (let campaign of this.campaigns.values()) {
            if (campaign.position === position) {
                campaignsForPosition.push(campaign);
            }
        }

        if (campaignsForPosition.length === 0) {
            return { error: "Нет кандидатов на эту должность" };
        }

        // Определяем победителя
        let winner = campaignsForPosition[0];
        for (let campaign of campaignsForPosition) {
            if (campaign.votes > winner.votes) {
                winner = campaign;
            }
        }

        // Назначаем на должность
        const winnerPlayer = this.gameDB.players.get(winner.candidateId);
        this.currentGovernment.set(position, {
            position: position,
            playerId: winner.candidateId,
            playerName: winnerPlayer.name,
            salary: positionInfo.salary,
            appointed: new Date(),
            votes: winner.votes,
            achievements: []
        });

        // Выплачиваем зарплату
        winnerPlayer.balance += positionInfo.salary;
        winnerPlayer.reputation += 100;

        // Создаем событие
        const electionEvent = {
            type: "election_result",
            position: position,
            winner: winner.candidateId,
            winnerName: winnerPlayer.name,
            votes: winner.votes,
            date: new Date()
        };

        this.politicalEvents.push(electionEvent);

        // Оповещаем в чатах
        this.gameDB.chatSystem.sendSystemMessage(1,
            `🎉 ПОБЕДА НА ВЫБОРАХ! ${winnerPlayer.name} избран на должность ${positionInfo.name} с ${winner.votes} голосами!`
        );

        // Очищаем кампании для этой должности
        for (let [campId, campaign] of this.campaigns) {
            if (campaign.position === position) {
                this.campaigns.delete(campId);
            }
        }

        return {
            success: true,
            winner: winner,
            position: positionInfo.name,
            totalVotes: campaignsForPosition.reduce((sum, camp) => sum + camp.votes, 0)
        };
    }

    // ПРИНЯТИЕ ЗАКОНОВ
    proposeLaw(proposerId, lawTitle, lawDescription, effect) {
        const proposer = this.gameDB.players.get(proposerId);
        if (!proposer) return { error: "Игрок не найден" };

        // Проверяем, есть ли у игрока должность
        let hasPosition = false;
        for (let position of this.currentGovernment.values()) {
            if (position.playerId === proposerId) {
                hasPosition = true;
                break;
            }
        }

        if (!hasPosition) return { error: "Только чиновники могут предлагать законы" };

        const law = {
            id: Date.now(),
            title: lawTitle,
            description: lawDescription,
            proposer: proposerId,
            proposerName: proposer.name,
            effect: effect,
            votesFor: 0,
            votesAgainst: 0,
            status: "proposed",
            created: new Date()
        };

        this.laws.push(law);

        // Оповещаем в чатах
        this.gameDB.chatSystem.sendSystemMessage(2,
            `📜 НОВЫЙ ЗАКОНОПРОЕКТ: ${lawTitle}. Предложил: ${proposer.name}`
        );

        return {
            success: true,
            law: law,
            message: "Законопроект предложен на голосование"
        };
    }

    // ПОЛИТИЧЕСКИЕ СОБЫТИЯ
    generatePoliticalEvent() {
        const events = [
            {
                type: "scandal",
                title: "💼 КОРРУПЦИОННЫЙ СКАНДАЛ",
                description: "Чиновник замешан в финансовых махинациях",
                effect: { reputation: -200, balance: -10000 }
            },
            {
                type: "reform",
                title: "🏛️ ПОЛИТИЧЕСКАЯ РЕФОРМА",
                description: "Проведена успешная реформа системы",
                effect: { reputation: 150, balance: 5000 }
            },
            {
                type: "crisis",
                title: "📉 ПОЛИТИЧЕСКИЙ КРИЗИС",
                description: "Правительство столкнулось с серьезным кризисом",
                effect: { reputation: -100, balance: -5000 }
            },
            {
                type: "success",
                title: "🎉 ПОЛИТИЧЕСКИЙ УСПЕХ",
                description: "Успешно реализована государственная программа",
                effect: { reputation: 100, balance: 3000 }
            }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const affectedPlayers = [];

        // Применяем эффект к случайным игрокам у власти
        for (let position of this.currentGovernment.values()) {
            if (position.playerId !== 0) { // Не NPC
                const player = this.gameDB.players.get(position.playerId);
                if (player) {
                    player.reputation += randomEvent.effect.reputation;
                    player.balance += randomEvent.effect.balance;
                    affectedPlayers.push(player.name);
                }
            }
        }

        this.politicalEvents.push({
            ...randomEvent,
            date: new Date(),
            affectedPlayers: affectedPlayers
        });

        return randomEvent;
    }

    // ВОПРОС ДОВЕРИЯ
    voteOfNoConfidence(initiatorId, targetPosition) {
        const initiator = this.gameDB.players.get(initiatorId);
        const target = this.currentGovernment.get(targetPosition);

        if (!initiator || !target) return { error: "Игрок или должность не найдены" };

        if (target.playerId === 0) return { error: "Нельзя объявить вотум недоверия NPC" };

        // Создаем голосование по вотуму недоверия
        const vote = {
            id: Date.now(),
            targetPosition: targetPosition,
            targetPlayer: target.playerId,
            initiator: initiatorId,
            votesFor: 0,
            votesAgainst: 0,
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
            status: "active"
        };

        this.politicalEvents.push({
            type: "no_confidence",
            title: "⚖️ ВОТУМ НЕДОВЕРИЯ",
            description: `Объявлен вотум недоверия ${target.playerName}`,
            vote: vote,
            date: new Date()
        });

        return {
            success: true,
            vote: vote,
            message: `Вотум недоверия объявлен. Голосование продлится 24 часа.`
        };
    }

    generateRandomColor() {
        const colors = ["#0055a5", "#ff6600", "#ff0000", "#00aa00", "#800080", "#ffd700", "#00bfff", "#ff69b4"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    startElectionCycle() {
        // Автоматические выборы каждую неделю
        setInterval(() => {
            const positions = this.governmentPositions.filter(p =>
                !this.currentGovernment.get(p.id) ||
                Date.now() - this.currentGovernment.get(p.id).appointed.getTime() > p.electionCycle * 24 * 60 * 60 * 1000
            );

            positions.forEach(position => {
                this.conductElections(position.id);
            });
        }, 7 * 24 * 60 * 60 * 1000); // 7 дней
    }
}

module.exports = PoliticalSystem;