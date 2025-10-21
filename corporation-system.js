class CorporationSystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.corporations = new Map();
        this.stockMarket = new Map();
        this.initializeStockMarket();
    }

    initializeStockMarket() {
        const companies = [
            { id: 1, name: "🏭 МеталлПром", symbol: "METL", basePrice: 100 },
            { id: 2, name: "💻 ТехноКорп", symbol: "TECH", basePrice: 150 },
            { id: 3, name: "🛢️ НефтьГаз", symbol: "OILG", basePrice: 120 }
        ];

        companies.forEach(company => {
            this.stockMarket.set(company.id, {
                ...company,
                currentPrice: company.basePrice,
                history: []
            });
        });
    }

    createCorporation(playerId, name, capital, businessType) {
        const founder = this.gameDB.players.get(playerId);

        if (founder.role !== 'businessman') {
            return { error: "Только бизнесмены могут создавать корпорации" };
        }

        if (founder.balance < capital) {
            return { error: "Недостаточно средств для создания корпорации" };
        }

        const corporation = {
            id: Date.now(),
            name: name,
            founder: playerId,
            businessType: businessType,
            capital: capital,
            shares: {
                total: 1000,
                outstanding: 800,
                founderShares: 200
            },
            stockPrice: capital / 1000,
            employees: [],
            created: new Date()
        };

        founder.balance -= capital;
        founder.corporationShares = founder.corporationShares || {};
        founder.corporationShares[corporation.id] = 200;

        this.corporations.set(corporation.id, corporation);

        return {
            success: true,
            corporation: corporation,
            shares: 200
        };
    }
}

module.exports = CorporationSystem;