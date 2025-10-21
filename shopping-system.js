// shopping-system.js
class ShoppingSystem {
    constructor() {
        this.stores = {
            REAL_ESTATE: {
                name: "🏠 Агентство недвижимости",
                items: [
                    { id: 1, name: "📦 Комната в общежитии", price: 5000, type: "property", income: 25 },
                    { id: 2, name: "🏠 Квартира в центре", price: 20000, type: "property", income: 100 },
                    { id: 3, name: "🏡 Загородный дом", price: 50000, type: "property", income: 250 }
                ]
            },

            VEHICLES: {
                name: "🚗 Автосалон",
                items: [
                    { id: 1, name: "🚲 Велосипед", price: 1000, type: "vehicle", speed: 1, prestige: 5 },
                    { id: 2, name: "🛵 Мотороллер", price: 5000, type: "vehicle", speed: 2, prestige: 15 },
                    { id: 3, name: "🚘 Седан бизнес-класса", price: 30000, type: "vehicle", speed: 3, prestige: 50 }
                ]
            },

            LUXURY: {
                name: "💎 Бутик роскоши",
                items: [
                    { id: 1, name: "⌚ Часы премиум-класса", price: 5000, type: "luxury", prestige: 30 },
                    { id: 2, name: "💍 Алмазное колье", price: 15000, type: "luxury", prestige: 80 },
                    { id: 3, name: "🎨 Картина известного художника", price: 50000, type: "luxury", prestige: 200 }
                ]
            }
        };
    }
}

module.exports = ShoppingSystem;