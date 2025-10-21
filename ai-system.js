// ai-system.js
class AISystem {
    constructor(gameDB) {
        this.gameDB = gameDB;
        this.eventTemplates = this.initializeEventTemplates();
        this.characterProfiles = this.initializeCharacterProfiles();
        this.questTemplates = this.initializeQuestTemplates();
    }

    initializeEventTemplates() {
        return {
            political: [
                {
                    type: "scandal",
                    templates: [
                        "💼 КОРРУПЦИОННЫЙ СКАНДАЛ: Чиновник {officialName} замешан в финансовых махинациях на сумму {amount}Ч",
                        "🕵️ УТЕЧКА ДОКУМЕНТОВ: Рассекречены документы, компрометирующие {targetName}",
                        "🎭 ПОЛИТИЧЕСКИЙ КРИЗИС: Фракция {factionName} угрожает выходом из коалиции"
                    ],
                    effects: {
                        reputation: -100,
                        balance: -500
                    }
                },
                {
                    type: "election",
                    templates: [
                        "🗳️ ВНЕЗАПНЫЕ ВЫБОРЫ: Объявлены досрочные выборы на должность {position}",
                        "🎪 ПРЕДВЫБОРНАЯ ГОНКА: Кандидат {candidateName} обещает {promise}",
                        "📊 СОЦИОЛОГИЧЕСКИЙ ОПРОС: Лидирует {leadingCandidate} с {percent}% голосов"
                    ],
                    effects: {
                        reputation: 50
                    }
                }
            ],
            economic: [
                {
                    type: "crisis",
                    templates: [
                        "📉 БИРЖЕВОЙ КРАХ: Акции компаний рухнули на {percent}%",
                        "💸 ИНФЛЯЦИЯ: Цены выросли на {percent}%, покупательная способность падает",
                        "🏭 БАНКРОТСТВО: Крупная компания {companyName} объявила о неплатежеспособности"
                    ],
                    effects: {
                        balance: -200
                    }
                },
                {
                    type: "boom",
                    templates: [
                        "📈 ЭКОНОМИЧЕСКИЙ БУМ: Доходы бизнесов увеличены на {percent}%",
                        "🛢️ НЕФТЯНАЯ ЛИХОРАДКА: Цены на нефть взлетели до {price}Ч за баррель",
                        "🏗️ СТРОИТЕЛЬНЫЙ БУМ: Начато строительство нового района {districtName}"
                    ],
                    effects: {
                        balance: 150
                    }
                }
            ],
            criminal: [
                {
                    type: "crime",
                    templates: [
                        "🚨 КРУПНАЯ КРАЖА: Из {location} похищено {amount}Ч",
                        "🔫 ВООРУЖЕННОЕ НАПАДЕНИЕ: Группа преступников атаковала {target}",
                        "💊 КОНТРАБАНДА: Обнаружена сеть нелегальной торговли {item}"
                    ],
                    effects: {
                        reputation: -30
                    }
                }
            ],
            social: [
                {
                    type: "celebration",
                    templates: [
                        "🎉 ГОРОДСКОЙ ПРАЗДНИК: В честь {occasion} объявлен выходной день",
                        "🏆 СПОРТИВНАЯ ПОБЕДА: Местная команда выиграла чемпионат по {sport}",
                        "🎭 ФЕСТИВАЛЬ ИСКУССТВ: Открытие крупнейшего культурного события года"
                    ],
                    effects: {
                        reputation: 25,
                        balance: 50
                    }
                }
            ]
        };
    }

    initializeCharacterProfiles() {
        return [
            {
                name: "Виктор Петров",
                type: "businessman",
                traits: ["амбициозный", "прагматичный", "щедрый"],
                background: "Основатель крупной корпорации",
                relationships: {}
            },
            {
                name: "Ольга Смирнова",
                type: "politician",
                traits: ["харизматичная", "хитрая", "непредсказуемая"],
                background: "Опытный политик",
                relationships: {}
            },
            {
                name: "Дмитрий Козлов",
                type: "detective",
                traits: ["проницательный", "упрямый", "честный"],
                background: "Бывший следователь",
                relationships: {}
            },
            {
                name: "Анна Вольская",
                type: "journalist",
                traits: ["любопытная", "смелая", "принципиальная"],
                background: "Редактор независимой газеты",
                relationships: {}
            }
        ];
    }

    initializeQuestTemplates() {
        return {
            investigation: [
                {
                    title: "🔍 Тайна исчезнувших документов",
                    description: "Расследование пропажи важных государственных документов",
                    steps: [
                        "Найти свидетелей",
                        "Собрать улики",
                        "Выявить причастных",
                        "Предоставить отчет"
                    ],
                    reward: 500,
                    reputation: 100,
                    difficulty: "medium"
                },
                {
                    title: "🕵️ Пропавший бизнесмен",
                    description: "Богатый предприниматель исчез при загадочных обстоятельствах",
                    steps: [
                        "Опросить семью",
                        "Проверить финансовые операции",
                        "Найти последнее местоположение",
                        "Раскрыть заговор"
                    ],
                    reward: 800,
                    reputation: 150,
                    difficulty: "hard"
                }
            ],
            business: [
                {
                    title: "💼 Расширение бизнес-империи",
                    description: "Захват новых рынков и устранение конкурентов",
                    steps: [
                        "Провести анализ рынка",
                        "Нанять сотрудников",
                        "Заключить контракты",
                        "Победить конкурентов"
                    ],
                    reward: 1000,
                    reputation: 200,
                    difficulty: "hard"
                },
                {
                    title: "🏪 Открытие сети магазинов",
                    description: "Создание розничной сети по всему городу",
                    steps: [
                        "Найти помещения",
                        "Закупить товар",
                        "Нанять персонал",
                        "Запустить рекламу"
                    ],
                    reward: 600,
                    reputation: 100,
                    difficulty: "medium"
                }
            ],
            political: [
                {
                    title: "🏛️ Избирательная кампания",
                    description: "Помогите кандидату победить на выборах",
                    steps: [
                        "Разработать программу",
                        "Провести агитацию",
                        "Организовать дебаты",
                        "Победить на выборах"
                    ],
                    reward: 700,
                    reputation: 180,
                    difficulty: "expert"
                }
            ]
        };
    }

    // Генерация случайного события
    generateRandomEvent() {
        const eventTypes = Object.keys(this.eventTemplates);
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const events = this.eventTemplates[randomType];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const template = randomEvent.templates[Math.floor(Math.random() * randomEvent.templates.length)];

        const eventData = this.fillEventTemplate(template, randomEvent.type);

        return {
            type: randomType,
            subtype: randomEvent.type,
            title: eventData,
            effects: randomEvent.effects,
            timestamp: new Date()
        };
    }

    fillEventTemplate(template, eventType) {
        const data = {
            officialName: this.generateName(),
            targetName: this.generateName(),
            factionName: this.generateFactionName(),
            candidateName: this.generateName(),
            leadingCandidate: this.generateName(),
            companyName: this.generateCompanyName(),
            districtName: this.generateDistrictName(),
            amount: Math.floor(Math.random() * 10000) + 1000,
            percent: Math.floor(Math.random() * 50) + 10,
            price: Math.floor(Math.random() * 500) + 50,
            location: this.generateLocation(),
            target: this.generateTarget(),
            item: this.generateItem(),
            promise: this.generatePromise(),
            occasion: this.generateOccasion(),
            sport: this.generateSport(),
            position: this.generatePosition()
        };

        return template.replace(/{(\w+)}/g, (match, key) => {
            return data[key] || match;
        });
    }

    generateName() {
        const names = ["Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил", "Ольга", "Елена", "Ирина", "Наталья", "Мария"];
        const surnames = ["Иванов", "Петров", "Сидоров", "Козлов", "Смирнов", "Васильев", "Попов", "Новиков", "Федоров"];
        return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
    }

    generateFactionName() {
        const factions = ["Народный альянс", "Прогрессивный союз", "Консервативная партия", "Либеральный блок", "Центристская коалиция"];
        return factions[Math.floor(Math.random() * factions.length)];
    }

    generateCompanyName() {
        const prefixes = ["Метал", "Нефте", "Строй", "Техно", "Агро", "Финанс"];
        const suffixes = ["пром", "газ", "инвест", "холдинг", "групп", "корп"];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }

    generateDistrictName() {
        const districts = ["Центральный", "Северный", "Южный", "Западный", "Восточный", "Деловой", "Исторический"];
        return `${districts[Math.floor(Math.random() * districts.length)]} район`;
    }

    generateLocation() {
        const locations = ["банка", "музея", "завода", "офиса", "магазина", "ресторана", "гостиницы"];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    generateTarget() {
        const targets = ["банк", "ювелирный магазин", "инкассаторскую машину", "частную резиденцию", "правительственное здание"];
        return targets[Math.floor(Math.random() * targets.length)];
    }

    generateItem() {
        const items = ["оружием", "наркотиками", "драгоценностями", "произведениями искусства", "техникой"];
        return items[Math.floor(Math.random() * items.length)];
    }

    generatePromise() {
        const promises = [
            "снизить налоги на 20%",
            "увеличить зарплаты госслужащим",
            "построить новый парк",
            "улучшить транспортную систему",
            "бороться с коррупцией",
            "развивать малый бизнес",
            "модернизировать медицину"
        ];
        return promises[Math.floor(Math.random() * promises.length)];
    }

    generateOccasion() {
        const occasions = ["Дня города", "основания империи", "освобождения", "единства нации", "культурного наследия"];
        return occasions[Math.floor(Math.random() * occasions.length)];
    }

    generateSport() {
        const sports = ["футболу", "хоккею", "баскетболу", "волейболу", "боксу", "легкой атлетике"];
        return sports[Math.floor(Math.random() * sports.length)];
    }

    generatePosition() {
        const positions = ["мэра", "губернатора", "министра экономики", "министра финансов", "начальника полиции"];
        return positions[Math.floor(Math.random() * positions.length)];
    }

    // Генерация мини-игры
    generateMiniGame(type) {
        const miniGames = {
            investigation: {
                name: "🔍 Расследование",
                description: "Найдите улики и раскройте преступление",
                difficulty: "medium",
                reward: 200,
                steps: 5,
                type: "puzzle"
            },
            negotiation: {
                name: "💼 Переговоры",
                description: "Договоритесь о выгодной сделке",
                difficulty: "hard",
                reward: 300,
                steps: 3,
                type: "strategy"
            },
            hacking: {
                name: "💻 Взлом системы",
                description: "Проникните в защищенную систему",
                difficulty: "expert",
                reward: 500,
                steps: 7,
                type: "puzzle"
            },
            trading: {
                name: "📈 Биржевая торговля",
                description: "Заработайте на колебаниях рынка",
                difficulty: "medium",
                reward: 250,
                steps: 4,
                type: "strategy"
            },
            diplomacy: {
                name: "🏛️ Дипломатическая миссия",
                description: "Урегулируйте международный конфликт",
                difficulty: "expert",
                reward: 400,
                steps: 6,
                type: "strategy"
            }
        };

        return miniGames[type] || miniGames.investigation;
    }

    // Генерация случайного квеста
    generateRandomQuest(playerLevel) {
        const questTypes = Object.keys(this.questTemplates);
        const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
        const quests = this.questTemplates[randomType];
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];

        // Адаптируем сложность к уровню игрока
        const adaptedQuest = { ...randomQuest };
        adaptedQuest.reward = Math.floor(adaptedQuest.reward * (playerLevel / 3));

        return adaptedQuest;
    }

    // Генерация диалога с NPC
    generateDialogue(npcType, context) {
        const dialogues = {
            businessman: {
                greeting: [
                    "Время - деньги! Что вас интересует?",
                    "Я ценю деловых людей. Чем могу помочь?",
                    "Вижу в вас потенциал. Какие планы?"
                ],
                trade: [
                    "Предлагаю взаимовыгодное сотрудничество.",
                    "Это рискованно, но прибыльно. Вы готовы?",
                    "У меня есть эксклюзивное предложение."
                ]
            },
            politician: {
                greeting: [
                    "На благо города и его жителей!",
                    "Ваше мнение важно для меня.",
                    "Вместе мы сможем изменить город к лучшему."
                ],
                election: [
                    "Моя программа - это реальные дела, а не пустые обещания.",
                    "Нужны свежие идеи и смелые решения!",
                    "Я добьюсь справедливости для всех."
                ]
            },
            detective: {
                greeting: [
                    "Факты - вещь упрямая. Что случилось?",
                    "Вижу, вам нужна помощь в расследовании.",
                    "Правда всегда где-то рядом."
                ],
                investigation: [
                    "У меня есть кое-какая информация... за соответствующую плату.",
                    "Это дело сложнее, чем кажется на первый взгляд.",
                    "Будьте осторожны - здесь не все так просто."
                ]
            }
        };

        const npcDialogues = dialogues[npcType] || dialogues.businessman;
        const contextDialogues = npcDialogues[context] || npcDialogues.greeting;

        return contextDialogues[Math.floor(Math.random() * contextDialogues.length)];
    }

    // Генерация новостной статьи
    generateNewsArticle() {
        const templates = [
            "📰 ЭКСКЛЮЗИВ: {event}. Наши источники сообщают, что {details}.",
            "🚨 СРОЧНЫЕ НОВОСТИ: {event}. Последствия могут быть {consequences}.",
            "🎭 СЕНСАЦИЯ: {event}. Это изменит {impact} навсегда."
        ];

        const events = [
            "произошел громкий политический скандал",
            "обнаружена крупная финансовая махинация",
            "раскрыта сеть коррупции",
            "произошло значительное экономическое событие",
            "совершено громкое преступление"
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        const event = events[Math.floor(Math.random() * events.length)];

        return template
            .replace("{event}", event)
            .replace("{details}", this.generateNewsDetails())
            .replace("{consequences}", this.generateConsequences())
            .replace("{impact}", this.generateImpact());
    }

    generateNewsDetails() {
        const details = [
            "задействованы высокопоставленные чиновники",
            "сумма сделки составляет миллионы червонцев",
            "расследование продолжается",
            "уже начаты оперативные мероприятия"
        ];
        return details[Math.floor(Math.random() * details.length)];
    }

    generateConsequences() {
        const consequences = [
            "катастрофическими для экономики",
            "значительными для политической системы",
            "непредсказуемыми для бизнеса",
            "серьезными для общественного порядка"
        ];
        return consequences[Math.floor(Math.random() * consequences.length)];
    }

    generateImpact() {
        const impacts = [
            "будущее города",
            "политический ландшафт",
            "экономическую ситуацию",
            "жизнь обычных граждан"
        ];
        return impacts[Math.floor(Math.random() * impacts.length)];
    }
}

module.exports = AISystem;