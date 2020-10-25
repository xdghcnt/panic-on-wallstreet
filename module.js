function init(wsServer, path) {
    const
        fs = require("fs"),
        app = wsServer.app,
        registry = wsServer.users,
        channel = "panic-on-wallstreet",
        testMode = process.argv[2] === "debug";

    app.use("/panic-on-wall-street", wsServer.static(`${__dirname}/public`));
    if (registry.config.appDir)
        app.use("/panic-on-wall-street", wsServer.static(`${registry.config.appDir}/public`));

    registry.handleAppPage(path, `${__dirname}/public/app.html`);

    class GameState extends wsServer.users.RoomState {
        constructor(hostId, hostData, userRegistry) {
            super(hostId, hostData, userRegistry);
            const
                resetParams = {
                    phase: 1,
                    round: 0,
                    stockIndR: 3,
                    stockIndY: 3,
                    stockIndG: 3,
                    stockIndB: 3,
                },
                room = {
                    inited: true,
                    hostId: hostId,
                    spectators: new JSONSet(),
                    playerNames: {},
                    onlinePlayers: new JSONSet(),
                    activeSlots: new JSONSet(),
                    wantSellerList: new JSONSet(),
                    wantBuyerList: new JSONSet(),
                    bankrupts: new JSONSet(),
                    sellers: {},
                    buyers: {},
                    playerSlots: Array(11).fill(null),
                    teamsLocked: false,
                    playerAvatars: {},
                    negotiationTime: 120,
                    sellersPledgeTime: 10,
                    auctionStepTime: 5,
                    bankruptcyEnabled: true,
                    time: null,
                    timed: true,
                    paused: true,
                    phase: 0,
                    round: 1,
                    deckSize: 0,
                    auctionStocksLeft: null,
                    auctionStock: null,
                    auctionBid: null,
                    auctionBidder: null,
                    testMode,
                    stockValues: {
                        R: [-20, 10, 0, 30, 40, 50, 60, 70],
                        Y: [-20, 0, 0, 30, 40, 40, 60, 60],
                        G: [0, 10, 20, 30, 30, 40, 50, 60],
                        B: [20, 20, 20, 30, 30, 30, 40, 40]
                    },
                    diceValues: {
                        R: [-2, 2, -3, 3, -7, 7],
                        Y: [-1, 1, -2, 2, -3, 3],
                        G: [-1, 1, -2, 2, 2, 0],
                        B: [-1, 1, -1, 1, 0, 0]
                    },
                    ...resetParams
                },
                state = {
                    deck: []
                };
            if (testMode)
                [0, 1, 2, 3, 4, 5, 6].forEach((ind) => {
                    room.playerSlots[ind] = `kek${ind}`;
                    room.playerNames[`kek${ind}`] = `kek${ind}`;
                });
            let interval;
            this.room = room;
            this.state = state;
            this.lastInteraction = new Date();
            const
                send = (target, event, data) => userRegistry.send(target, event, data),
                update = () => {
                    room.deckSize = state.deck.length;
                    if (room.voiceEnabled)
                        processUserVoice();
                    send(room.onlinePlayers, "state", room);
                },
                processUserVoice = () => {
                    room.userVoice = {};
                    room.onlinePlayers.forEach((user) => {
                        if (!room.managedVoice || !room.teamsLocked || room.phase === 0)
                            room.userVoice[user] = true;
                        else if (room.activeSlots.has(room.playerSlots.indexOf(user)))
                            room.userVoice[user] = true;
                    });
                },
                getRandomPlayer = (priority, exclude) => {
                    const res = [];
                    priority = priority || [];
                    (priority.length ? priority : room.activeSlots).forEach((user, slot) => {
                        if (user !== null && !exclude.includes(slot))
                            res.push(slot);
                    });
                    return shuffleArray(res)[0];
                },
                startGame = () => {
                    const playersCount = room.playerSlots.filter((user) => user !== null).length;
                    if (playersCount > 4) {
                        Object.assign(room, resetParams);
                        room.teamsLocked = true;
                        if (room.timed)
                            room.paused = false;

                        state.deck = shuffleArray([
                                ...Array(6).fill("red"),
                                ...Array(11).fill("yellow"),
                                ...Array(11).fill("green"),
                                ...Array(11).fill("blue")
                            ]
                        );

                        room.playerSlots.forEach((player, slot) => {
                            if (player != null)
                                room.activeSlots.add(slot);
                        });

                        let
                            sellersCount = Math.floor(playersCount / 2),
                            buyersCount = playersCount - sellersCount;

                        room.sellers = {};
                        room.buyers = {};

                        while (sellersCount--)
                            room.sellers[getRandomPlayer([...room.wantSellerList], [...room.sellers])] = {
                                balance: 120,
                                // offers: [{player: 1, price: 10, stocks: {red: 2, blue2x: 1}, accepted: true, finalized: false, playerWantFinalize: 1  }]
                                offers: [],
                                stocks: state.deck.splice(0, 3).reduce((res, stock) => {
                                    res[stock]++;
                                    return res;
                                }, {}),
                                needPledge: false
                            };
                        while (buyersCount--)
                            room.buyers[getRandomPlayer([...room.wantBuyerList], [...room.sellers, ...room.buyers])] = {
                                balance: 120
                            };

                        state.deck = shuffleArray([
                                ...state.deck,
                                ...Array(1).fill("red2x"),
                                ...Array(2).fill("yellow2x"),
                                ...Array(2).fill("green2x"),
                                ...Array(2).fill("blue2x"),
                            ]
                        );

                        room.startTimer();
                    } else endGame();
                },
                startStocksRandomize = () => {
                    room.phase = 2;
                    ["R", "Y", "G", "B"].forEach((color) => {
                        let newStockInd = room[`stockInd${color}`] + shuffleArray(room.diceValues[color])[0];
                        if (newStockInd < 0)
                            newStockInd = 0;
                        else if (newStockInd > 7)
                            newStockInd = 7;
                        room[`stockInd${color}`] = newStockInd;
                    });
                    update();
                    // show stocks
                    setTimeout(() => {
                        showBuyerIncome(0);
                    }, 3000)
                },
                showBuyerIncome = (buyerIndex) => {
                    room.phase = 3;
                    const
                        buyerSlot = Object.keys(room.buyers)[buyerIndex],
                        buyer = room.buyers[buyerSlot];
                    buyer.roundResult = {
                        stocksOwned: {},
                        stocksIncome: {},
                        overallIncome: 0,
                        overallOutcome: 0,
                        prevBalance: buyer.balance
                    };
                    Object.keys(room.sellers).forEach((seller) => {
                        room.sellers[seller].offers.forEach((offer) => {
                            if (offer.accepted && offer.player === buyerSlot) {
                                buyer.roundResult.overallOutcome -= offer.price;
                                Object.keys(offer.stocks).forEach((stock) => {
                                    buyer.roundResult.stocksOwned[stock] = buyer.roundResult.stocksOwned[stock] || 0;
                                    buyer.roundResult.stocksOwned[stock] += offer.stocks[stock];
                                });
                            }
                        });
                    });
                    Object.keys(buyer.roundResult.stocksOwned).forEach((stock) => {
                        let stockC = stock;
                        if (stock.endsWith("2x"))
                            stockC = stock.substr(0, stockC.length - 2);
                        buyer.roundResult.stocksIncome[stockC] = buyer.roundResult.stocksIncome[stockC] || 0;
                        const income = buyer.roundResult.stocksOwned[stock] * getStockValue(stock);
                        buyer.roundResult.stocksIncome[stockC] += income;
                        buyer.roundResult.overallIncome += income;
                    });
                    buyer.balance += buyer.roundResult.overallIncome - buyer.roundResult.overallOutcome;
                    if (buyer.balance <= 0 && room.bankruptcyEnabled)
                        room.bankrupts.add(buyerSlot);
                    // show buyer result
                    update();
                    if (Object.keys(room.buyers).length < buyerIndex + 1)
                        setTimeout(() => showBuyerIncome(buyerIndex + 1), 2000);
                    else
                        startSellerIncome(0);
                },
                getStockValue = (color) => {
                    const c = color.substr(0, 1).toUpperCase();
                    return room.stockValues[c][room[`stockInd${c}`]] * (color.endsWith("2x") ? 2 : 1);
                },
                startSellerIncome = (sellerIndex) => {
                    room.phase = 4;
                    const seller = room.sellers[Object.keys(room.sellers)[sellerIndex]];
                    seller.roundResult = {
                        stocksSold: {},
                        overallIncome: 0,
                        overallOutcome: 0,
                        prevBalance: seller.balance
                    };
                    seller.offers.forEach((offer) => {
                        if (offer.accepted) {
                            Object.keys(offer.stocks).forEach((stock) => {
                                seller.roundResult.stocksSold[stock] = seller.roundResult.stocksSold[stock] || 0;
                                seller.roundResult.stocksSold[stock] += offer.stocks[stock];
                            });
                            seller.roundResult.overallIncome += offer.price;
                        }
                    });
                    seller.offers = [];
                    seller.roundResult.overallOutcome += seller.stocks.length * 10;
                    seller.balance += seller.roundResult.overallIncome - seller.roundResult.overallOutcome;
                    // show seller result
                    update();
                    if (Object.keys(room.sellers).length < sellerIndex + 1)
                        setTimeout(() => startSellerIncome(sellerIndex + 1), 2000);
                    else
                        startSellersDebt();
                },
                startSellersPledge = () => {
                    room.phase = 5;
                    let sellersNeedPledge = false;
                    Object.keys(room.sellers).forEach((sellerSlot) => {
                        const seller = room.sellers[sellerSlot];
                        if (seller.balance < 0) {
                            if ((seller.balance + seller.stocks.length * 5) <= 0) {
                                seller.stocks = [];
                                seller.balance += seller.stocks.length * 5;
                                room.bankrupts.add(sellerSlot);
                            } else
                                seller.needPledge = sellersNeedPledge = true;
                        }
                    });
                    if (sellersNeedPledge) {
                        if (room.round < 5) {
                            update();
                            startTimer();
                        } else endSellersPledge();
                    } else {
                        if (room.round < 5)
                            endSellersPledge();
                        else
                            endGame();
                    }
                },
                endSellersPledge = () => {
                    Object.keys(room.sellers).forEach((sellerSlot) => {
                        const seller = room.sellers[sellerSlot];
                        if (seller.needPledge) {
                            shuffleArray(seller.stocks);
                            seller.stocks.splice(0, (seller.stocks.length / 5) * -1);
                            seller.balance = 0;
                            seller.needPledge = false;
                        }
                    });
                    clearInterval(interval);
                    if (!Object.keys(room.sellers).some((sellerSlot) => !room.bankrupts.has(sellerSlot))
                        || (room.bankruptcyEnabled && !Object.keys(room.buyers).some((buyersSlot) => !room.bankrupts.has(buyersSlot))))
                        endGame();
                    else
                        startAuction();
                },
                startAuction = () => {
                    room.phase = 6;
                    room.auctionStocksLeft = Object.keys(room.sellers).length * 2 - 1;
                    auctionStep();
                },
                auctionStep = () => {
                    room.auctionStock = state.deck.pop();
                    room.auctionBid = 5;
                    room.auctionBidder = null;
                    startTimer();
                    update();
                },
                auctionStepEnd = () => {
                    if (room.auctionBidder !== null) {
                        const seller = room.sellers[room.auctionBidder];
                        seller.balance -= room.auctionBid;
                        seller.stocks.push(room.auctionStock);
                    }
                    if (room.auctionStocksLeft > 0) {
                        room.auctionStocksLeft--;
                        auctionStep();
                    } else {
                        room.phase = 1;
                        startTimer();
                        update();
                    }
                },
                startTimer = () => {
                    clearInterval(interval);
                    if (room.timed && room.phase !== 0) {
                        if (room.phase === 1)
                            room.time = room.negotiationTime * 1000;
                        else if (room.phase === 5)
                            room.time = room.sellersPledgeTime * 1000;
                        else if (room.phase === 6)
                            room.time = room.auctionStepTime * 1000;
                        let time = new Date();
                        interval = setInterval(() => {
                            if (!room.paused) {
                                room.time -= new Date() - time;
                                time = new Date();
                                if (room.time <= 0) {
                                    clearInterval(interval);
                                    if (room.phase === 1)
                                        startStocksRandomize();
                                    else if (room.phase === 5)
                                        endSellersPledge();
                                    else if (room.phase === 6)
                                        auctionStepEnd();
                                    update();
                                }
                            } else time = new Date();
                        }, 100);
                    }
                },
                isEnoughPlayers = () => room.playerSlots.filter((user) => user !== null).length > 4,
                resetFinalizeTimeouts = () => {
                    Object.keys(this.finalizeTimeouts).forEach((key) => {
                        clearTimeout(this.finalizeTimeouts[key]);
                    });
                },
                endGame = () => {
                    resetFinalizeTimeouts();
                },
                removePlayer = (playerId) => {
                    room.wantBuyerList.delete(playerId);
                    room.wantSellerList.delete(playerId);
                    if (~room.playerSlots.indexOf(playerId))
                        room.playerSlots[room.playerSlots.indexOf(playerId)] = null;
                    if (room.spectators.has(playerId) || !room.onlinePlayers.has(playerId)) {
                        delete room.playerNames[playerId];
                        room.spectators.delete(playerId);
                        this.emit("user-kicked", playerId);
                    } else
                        room.spectators.add(playerId);
                },
                userJoin = (data) => {
                    const user = data.userId;
                    if (!room.playerNames[user])
                        room.spectators.add(user);
                    room.onlinePlayers.add(user);
                    room.playerNames[user] = data.userName.substr && data.userName.substr(0, 60);
                    if (data.avatarId) {
                        fs.stat(`${registry.config.appDir || __dirname}/public/avatars/${user}/${data.avatarId}.png`, (err) => {
                            if (!err) {
                                room.playerAvatars[user] = data.avatarId;
                                update()
                            }
                        });
                    }
                    update();
                },
                userLeft = (user) => {
                    room.onlinePlayers.delete(user);
                    if (room.spectators.has(user))
                        delete room.playerNames[user];
                    room.spectators.delete(user);
                    update();
                },
                userEvent = (user, event, data) => {
                    this.lastInteraction = new Date();
                    try {
                        if (this.userEventHandlers[event])
                            this.userEventHandlers[event](user, data[0], data[1], data[2], data[3]);
                        else if (this.slotEventHandlers[event] && ~room.playerSlots.indexOf(user))
                            this.slotEventHandlers[event](room.playerSlots.indexOf(user), data[0], data[1], data[2], data[3]);
                    } catch (error) {
                        console.error(error);
                        registry.log(error.message);
                    }
                };
            this.updatePublicState = update;
            this.userJoin = userJoin;
            this.userLeft = userLeft;
            this.userEvent = userEvent;
            this.finalizeTimeouts = {};
            this.slotEventHandlers = {
                "edit-offer": (slot, seller, stocks, price, offerInd) => {
                    if (room.buyers[slot] && room.sellers[seller]
                        && !room.bankrupts.has(slot) && !room.bankrupts.has(seller)
                        && stocks && !isNaN(price) && (price % 5) === 0
                        && Object.keys(stocks).every((stock) => room.sellers[seller].stocks[stock] >= stocks[stock])
                        && (offerInd == null || (room.sellers[seller].offers[offerInd] && room.sellers[seller].offers[offerInd].player === slot
                            && !room.sellers[seller].offers[offerInd].finalized))) {
                        if (offerInd == null)
                            room.sellers[seller].offers.push({
                                player: slot,
                                price,
                                stocks,
                                accepted: false,
                                finalized: false,
                                playerWantFinalize: null
                            });
                        else {
                            const offer = room.sellers[seller].offers[offerInd];
                            offer.stocks = stocks;
                            offer.price = price;
                            offer.accepted = false;
                            offer.playerWantFinalize = null;
                        }
                        update();
                    }
                },
                "remove-offer": (slot, seller, offerInd) => {
                    if (room.buyers[slot] && room.sellers[seller]
                        && (room.sellers[seller].offers[offerInd] && room.sellers[seller].offers[offerInd].player === slot
                            && !room.sellers[offerInd].offers[offerInd].finalized)) {
                        room.sellers[seller].offers[offerInd].splice(offerInd, 1);
                        update();
                    }
                },
                "toggle-accept-offer": (slot, offerInd) => {
                    if (room.sellers[slot] && (room.sellers[slot].offers[offerInd] && !room.sellers[slot].offers[offerInd].finalized)) {
                        const
                            offer = room.sellers[offerInd].offers[offerInd],
                            availableStocks = {...room.sellers[slot].stocks};

                        room.sellers[slot].offers.forEach((offer) => {
                            Object.keys(offer.stocks).forEach((stock) => {
                                availableStocks[stock] -= offer.stocks[stock];
                            })
                        });

                        if (Object.keys(offer.stocks).every((stock) => {
                            if (offer.stocks[stock] >= availableStocks[stock])
                                return true;
                            else
                                send(room.playerSlots[slot], "not-enough-stocks", stock);
                        })) {
                            offer.accepted = !offer.accepted;
                            offer.playerWantFinalize = null;
                        }
                        update();
                    }
                },
                "ask-finalize-offer": (slot, seller, offerInd) => {
                    if (room.sellers[slot] && (room.sellers[slot].offers[offerInd] && !room.sellers[slot].offers[offerInd].finalized)
                        && !room.sellers[slot].offers[offerInd].finalized && room.sellers[slot].offers[offerInd].accepted) {
                        const offer = room.sellers[slot].offers[offerInd];
                        if (offer.playerWantFinalize !== null && offer.playerWantFinalize !== slot) {
                            offer.playerWantFinalize = null;
                            offer.finalized = true;
                            clearTimeout(this.finalizeTimeouts[slot + offerInd]);
                        } else if (offer.playerWantFinalize === slot) {
                            offer.playerWantFinalize = null;
                            clearTimeout(this.finalizeTimeouts[slot + offerInd]);
                        } else {
                            offer.playerWantFinalize = slot;
                            this.finalizeTimeouts[slot + offerInd] = setTimeout(() => {
                                offer.playerWantFinalize = null;
                            }, 5000);
                        }
                        update();
                    }
                },
                "pledge-stock": (slot, card) => {
                    if (room.sellers[slot] && room.sellers[slot].needPledge && room.sellers[slot].stocks[card] > 0) {
                        room.sellers[slot].stocks[card]--;
                        room.sellers[slot].balance += 5;
                        if (room.sellers[slot].balance >= 0)
                            room.sellers.needPledge = false;
                        if (!Object.keys(room.sellers).some((sellerSlot) => room.sellers[sellerSlot].needPledge))
                            endSellersPledge();
                        else
                            update();
                    }
                },
                "bid-stock": (slot, amount) => {
                    if (room.sellers[slot] && (room.sellers[slot].balance - amount) > 0) {
                        room.auctionBid += amount;
                        room.auctionBidder = slot;
                        room.time = room.auctionTimer;
                        startTimer();
                    }
                    update();
                }
            };
            this.userEventHandlers = {
                ...this.eventHandlers,
                "update-avatar": (user, id) => {
                    room.playerAvatars[user] = id;
                    update()
                },
                "toggle-lock": (user) => {
                    if (user === room.hostId)
                        room.teamsLocked = !room.teamsLocked;
                    update();
                },
                "change-name": (user, value) => {
                    if (value)
                        room.playerNames[user] = value.substr && value.substr(0, 60);
                    update();
                },
                "remove-player": (user, playerId) => {
                    if (playerId && user === room.hostId)
                        removePlayer(playerId);
                    update();
                },
                "give-host": (user, playerId) => {
                    if (playerId && user === room.hostId) {
                        room.hostId = playerId;
                        this.emit("host-changed", user, playerId);
                    }
                    update();
                },
                "players-join": (user, slot) => {
                    if (!room.teamsLocked && room.playerSlots[slot] === null) {
                        if (room.playerSlots.includes(user))
                            room.playerSlots[room.playerSlots.indexOf(user)] = null;
                        room.spectators.delete(user);
                        room.playerSlots[slot] = user;
                        update();
                    }
                },
                "spectators-join": (user) => {
                    if (!room.teamsLocked && ~room.playerSlots.indexOf(user)) {
                        room.playerSlots[room.playerSlots.indexOf(user)] = null;
                        room.wantSellerList.delete(user);
                        room.wantBuyerList.delete(user);
                        room.spectators.add(user);
                        update();
                    }
                },
                "toggle-want-buyer": (user) => {
                    if (room.phase === 0 && room.playerSlots.includes(user) && !room.wantBuyerList.has(user)) {
                        room.wantBuyerList.add(user);
                        room.wantSellerList.delete(user);
                    } else
                        room.wantMasterList.delete(user);
                    update();
                },
                "toggle-want-seller": (user) => {
                    if (room.phase === 0 && room.playerSlots.includes(user) && !room.wantSellerList.has(user)) {
                        room.wantSellerList.add(user);
                        room.wantBuyerList.user(user);
                    } else
                        room.wantSellerList.delete(user);
                    update();
                },
                "toggle-pause": (user) => {
                    if (user === room.hostId) {
                        if (room.phase !== 0)
                            room.paused = !room.paused;
                        else if (isEnoughPlayers())
                            startGame();
                        if (!room.paused)
                            room.teamsLocked = true;
                        update();
                    }
                },
                "toggle-timed": (user) => {
                    if (user === room.hostId) {
                        room.timed = !room.timed;
                        if (!room.timed)
                            room.paused = true;
                    }
                    update();
                },
                "abort-game": (user) => {
                    if (user === room.hostId)
                        endGame();
                    update();
                },
                "set-param": (user, type, value) => {
                    if (user === room.hostId) {
                        if (["negotiation", "sellersPledge", "auctionStep"].includes(type) && !isNaN(parseInt(value)))
                            room[`${type}Time`] = parseFloat(value);
                    }
                    update();
                },
                "toggle-bankruptcy": (user) => {
                    if (user === room.hostId && room.phase === 0)
                        room.bankruptcyEnabled = !room.bankruptcyEnabled;
                    update();
                }
            };
        }

        getPlayerCount() {
            return Object.keys(this.room.playerNames).length;
        }

        getActivePlayerCount() {
            return this.room.onlinePlayers.size;
        }

        getLastInteraction() {
            return this.lastInteraction;
        }

        getSnapshot() {
            return {
                room: this.room,
                state: this.state,
            };
        }

        setSnapshot(snapshot) {
            Object.assign(this.room, snapshot.room);
            Object.assign(this.state, snapshot.state);
            this.room.onlinePlayers = new JSONSet();
            this.room.spectators = new JSONSet();
            this.room.activeSlots = new JSONSet(this.room.activeSlots);
            this.room.wantSellerList = new JSONSet(this.room.wantSellerList);
            this.room.wantBuyerList = new JSONSet(this.room.wantBuyerList);
            this.room.bankrupts = new JSONSet(this.room.bankrupts);
            this.room.onlinePlayers.clear();
        }
    }

    function makeId() {
        let text = "";
        const possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    function shuffleArray(array) {
        let currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    class JSONSet extends Set {
        constructor(iterable) {
            super(iterable)
        }

        toJSON() {
            return [...this]
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    registry.createRoomManager(path, channel, GameState);
}

module.exports = init;

