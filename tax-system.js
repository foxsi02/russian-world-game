// tax-system.js
class TaxSystem {
    constructor() {
        this.taxRates = {
            income: 0.10,
            property: 0.05,
            business: 0.15,
            luxury: 0.20
        };

        this.taxBrackets = [
            { min: 0, max: 1000, rate: 0.05 },
            { min: 1001, max: 10000, rate: 0.10 },
            { min: 10001, max: 50000, rate: 0.15 },
            { min: 50001, max: Infinity, rate: 0.20 }
        ];
    }

    calculateTax(player) {
        let totalTax = 0;
        const incomeTax = player.balance * this.getTaxRate(player.balance);
        totalTax += incomeTax;
        totalTax += player.ownedProperties.length * 50;
        totalTax += player.ownedBusinesses.length * 100;
        return Math.floor(totalTax);
    }

    getTaxRate(income) {
        const bracket = this.taxBrackets.find(bracket =>
            income >= bracket.min && income <= bracket.max
        );
        return bracket ? bracket.rate : 0.20;
    }
}

module.exports = TaxSystem;