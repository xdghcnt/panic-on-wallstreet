//import React from "react";
//import ReactDOM from "react-dom"
//import io from "socket.io"
function makeId() {
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

class Timer extends React.Component {
    render() {
        return this.props.time ? <div className="timer">
            {<span className="timer-time">
                {(new Date(this.props.time)).toUTCString().match(/(\d\d:\d\d )/)[0].trim()}</span>}
        </div> : "";
    }
}

class FlipTimer extends React.Component {
    render() {
        const
            data = this.props.data,
            game = this.props.game;
        return <div
            className={cs("timer", "flip-clock", {active: data.phase !== 0 && data.timed && data.time})}>
                                    <span className="flip-clock__piece flip">
                                        <b className="flip-clock__card clock-card">
                                            <b className="card__top">{game.minutes}</b>
                                            <b className="card__bottom" data-value={game.minutes}/>
                                            <b className="card__back" data-value={game.minutes}>
                                                <b className="card__bottom" data-value={game.minutes}/>
                                            </b>
                                        </b>
                                    </span>
            <span className="flip-clock__piece flip">
                                        <b className="flip-clock__card clock-card">
                                            <b className="card__top">{game.seconds}</b>
                                            <b className="card__bottom" data-value={game.seconds}/>
                                            <b className="card__back" data-value={game.seconds}>
                                                <b className="card__bottom" data-value={game.seconds}/>
                                            </b>
                                        </b>
                                    </span>
        </div>;
    }
}

class Balance extends React.Component {
    render() {
        const value = this.props.value;
        return `${value < 0 ? "−" : ""}${Math.abs(value)}`;
    }
}

class Spectators extends React.Component {
    render() {
        const
            data = this.props.data,
            game = this.props.game;
        return (
            <div
                onClick={() => game.emit("spectators-join")}
                className="spectators">
                Зрители:
                {
                    data.spectators.length ? data.spectators.map(
                        (player, index) => (<Player key={index} data={data} id={player} game={game}/>)
                    ) : " ..."
                }
            </div>
        );
    }
}

class Player extends React.Component {
    render() {
        const
            data = this.props.data,
            game = this.props.game,
            id = this.props.id,
            hasPlayer = id !== null;
        return (
            <div className={cs("player", {offline: !~data.onlinePlayers.indexOf(id), self: id === data.userId})}
                 data-playerId={id}
                 onTouchStart={(e) => e.target.focus()}>
                <div className={cs("player-name-text", `bg-color-${this.props.slot}`)}>
                    <UserAudioMarker data={data} user={id}/>
                    {hasPlayer
                        ? data.playerNames[id]
                        : (data.teamsLocked
                            ? (<div className="slot-empty">Пусто</div>)
                            : (<div className="join-slot-button"
                                    onClick={() => game.handlePlayerJoin(this.props.slot)}>Занять место</div>))}
                </div>
                {hasPlayer ? (<div className="player-host-controls">
                    {(data.hostId === data.userId && data.userId !== id) ? (
                        <i className="material-icons host-button"
                           title="Передать хост"
                           onClick={(evt) => game.handleGiveHost(id, evt)}>
                            vpn_key
                        </i>
                    ) : ""}
                    {(data.hostId === data.userId && data.userId !== id) ? (
                        <i className="material-icons host-button"
                           title="Удалить"
                           onClick={(evt) => game.handleRemovePlayer(id, evt)}>
                            delete_forever
                        </i>
                    ) : ""}
                    {(data.hostId === id) ? (
                        <i className="material-icons host-button inactive"
                           title="Хост">
                            stars
                        </i>
                    ) : ""}
                </div>) : ""}
            </div>
        );
    }
}

class PlayerSlot extends React.Component {
    render() {
        try {
            const
                data = this.props.data,
                slot = this.props.slot,
                game = this.props.game,
                player = data.playerSlots[slot],
                hasAvatar = player !== null && data.playerAvatars[player];
            return (
                <div
                    className={cs("player-slot", "ornament-border", `player-slot-${slot}`, {
                        "no-player": player === null
                    })}>
                    <div className="player-section">
                        <div className={cs("avatar",
                            {"no-player": player === null, hasAvatar, [`bg-color-${slot}`]: !hasAvatar})}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null
                                     ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                         ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                         : `media/avatars/${data.defaultAvatars[slot]}.png`})`
                                     : ""
                             }}>
                            {player === data.userId
                                ? (<div className="set-avatar-button">
                                    <i onClick={() => game.handleClickSetAvatar()}
                                       className="toggle-theme material-icons settings-button">edit</i>
                                </div>)
                                : ""}
                        </div>
                        <div className="player-name">
                            <Player id={player} data={data} slot={slot} game={game}/>
                        </div>
                    </div>
                </div>);
        } catch (e) {
            console.error(e);
            debugger;
        }
    }
}

class BuyerSlot extends React.Component {
    render() {
        try {
            const
                data = this.props.data,
                slot = this.props.slot,
                game = this.props.game,
                buyer = data.buyers[slot],
                player = data.playerSlots[slot],
                hasAvatar = player !== null && data.playerAvatars[player];
            return (
                <div
                    className={cs("player-slot", "ornament-border", `player-slot-${slot}`, {
                        "no-player": player === null,
                        bankrupt: data.bankrupts.includes(slot)
                    })}>
                    <div className="player-section">
                        <div className={cs("avatar", {
                            "no-player": player === null,
                            hasAvatar,
                            [`bg-color-${slot}`]: !hasAvatar
                        })}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                     ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                     : `media/avatars/${data.defaultAvatars[slot]}.png`})` : ""
                             }}>
                            {player === data.userId
                                ? (<div className="set-avatar-button">
                                    <i onClick={() => game.handleClickSetAvatar()}
                                       className="toggle-theme material-icons settings-button">edit</i>
                                </div>)
                                : ""}
                        </div>
                        <div className="player-name">
                            <Player id={player} data={data} slot={slot} game={game}/>
                        </div>
                        <div className="player-balance"><Balance value={buyer.balance}/></div>
                        {data.bankrupts.includes(slot)
                            ? <div className="bankrupt-icon"><i className="material-icons">money_off</i></div>
                            : ""}
                    </div>
                </div>);
        } catch (e) {
            console.error(e);
            debugger;
        }
    }
}

class SellerSlot extends React.Component {
    render() {
        try {
            const
                data = this.props.data,
                slot = this.props.slot,
                game = this.props.game,
                seller = data.sellers[slot],
                player = data.playerSlots[slot],
                needPledge = slot == data.userSlot && data.phase === 5
                    && data.sellers[data.userSlot]?.balance < 0 && !data.bankrupts.includes(data.userSlot),
                hasAvatar = player !== null && data.playerAvatars[player];
            return <div className="seller-section">
                <div className={cs("player-slot", "ornament-border", `player-slot-${slot}`, {
                    "no-player": player === null,
                    bankrupt: data.bankrupts.includes(slot)
                })}>
                    <div className="player-section">
                        <div className={cs("avatar", {
                            "no-player": player === null,
                            hasAvatar,
                            [`bg-color-${slot}`]: !hasAvatar
                        })}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                     ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                     : `media/avatars/${data.defaultAvatars[slot]}.png`})` : ""
                             }}>
                            {player === data.userId
                                ? (<div className="set-avatar-button">
                                    <i onClick={() => game.handleClickSetAvatar()}
                                       className="toggle-theme material-icons settings-button">edit</i>
                                </div>)
                                : ""}
                        </div>
                        <div className="player-name">
                            <Player id={player} data={data} slot={slot} game={game}/>
                        </div>
                        <div className="player-balance"><Balance value={seller.balance}/></div>
                    </div>
                    <div className="seller-stocks">{
                        ["red", "red2x", "yellow", "yellow2x", "green", "green2x", "blue", "blue2x"].map((stock) => {
                                const stocksCount = (data.offerPane && data.offerPane.slot === slot)
                                    ? data.sellers[data.offerPane.slot].stocks[stock]
                                        ? data.sellers[data.offerPane.slot].stocks[stock] - (data.offerPane.stocks[stock] || 0)
                                        - (data.sellers[data.offerPane.slot].stocksFinalized[stock] || 0)
                                        : 0
                                    : seller.stocks[stock]
                                        ? (seller.stocks[stock] - (seller.stocksFinalized[stock] || 0))
                                        : "";
                                return <div
                                    onClick={() => stocksCount
                                        && game.handleClickOfferAddStock(stock, false, slot)}
                                    className={cs("stock", stock, {
                                        hasStocks: !!seller.stocks[stock],
                                        noStocks: !seller.stocks[stock]
                                    })}>
                                    <div className={cs("stock-icon", "stock-icon-full", {
                                        needPledge: seller.stocks[stock] > 0 && needPledge
                                    })}>{stock.endsWith("2x")
                                        ? <div className="stock-icon-2x">2x</div>
                                        : ""}</div>
                                    <div className="stock-count">{seller.stocks[stock]
                                        ? stocksCount
                                        : ""}</div>
                                </div>;
                            }
                        )
                    }</div>
                    {data.bankrupts.includes(slot)
                        ? <div className="bankrupt-icon"><i className="material-icons">money_off</i></div>
                        : ""}
                </div>
                <div className="offers">
                    <>
                        {seller.offers.map((offer, offerInd) => {
                            const
                                offerWantFinalize = offer.playerWantFinalize != null,
                                offerCanAccept = data.userSlot == slot && !offer.finalized,
                                offerCanFinalize = offer.accepted && !offer.finalized && (data.userSlot == slot || data.userSlot == offer.player);
                            return <div className="offer-wrap">
                                <div className={cs("offer", "ornament-border", `border-color-${offer.player}`, {
                                    adding: data.offerPane?.slot === slot && data.offerPane?.offerInd === offerInd
                                })}>
                                    <div className="offer-stocks">{Object.keys(offer.stocks).map((stock) => (
                                        <div className={`offer-stock stock ${stock}`}>
                                            <div className="stock-icon"/>
                                            x
                                            {offer.stocks[stock]}</div>))}</div>
                                    <div className="spacer"/>
                                    <div className="offer-price">${offer.price}</div>
                                    &nbsp;
                                    <div className={cs("offer-checkbox", {
                                        "offer-accepted": offer.accepted,
                                        "offer-finalized": offer.finalized,
                                        "offer-can-accept": offerCanAccept,
                                        "offer-can-finalize": offerCanFinalize,
                                        "want-finalize": offerWantFinalize
                                    })}>
                                        <>
                                            {(offerCanFinalize || offerWantFinalize)
                                                ? <div className="button-finalize">
                                                    {offerWantFinalize
                                                        ? <svg className="finalize-anim"
                                                               xmlns="http://www.w3.org/2000/svg">
                                                            <circle className="finalize-circle"/>
                                                        </svg>
                                                        : ""}
                                                    <i className="material-icons"
                                                       onClick={() => game.handleClickToggleFinalizeOffer(parseInt(slot), offerInd)}>
                                                        gavel
                                                    </i>
                                                </div>
                                                : ""}
                                            {offer.accepted
                                                ? <i className="material-icons button-accept"
                                                     onClick={() => offerCanAccept
                                                         && game.handleClickToggleAcceptOffer(offerInd)}>check_box</i>
                                                : <i className="material-icons button-accept"
                                                     onClick={() => offerCanAccept
                                                         && game.handleClickToggleAcceptOffer(offerInd)}>check_box_outline_blank</i>}
                                        </>
                                    </div>
                                </div>

                                {offer.player == data.userSlot && !offer.finalized
                                    ? <div className={cs("offer-buttons", `border-color-${offer.player}`)}>
                                        <i onClick={() => game.handleClickEditOffer(slot, offerInd)}
                                           className="material-icons settings-button">edit</i>
                                        <i onClick={() => game.socket.emit("remove-offer", slot, offerInd)}
                                           className="material-icons settings-button">delete</i>
                                    </div>
                                    : ""}
                            </div>;
                        })}
                        {data.buyers[data.userSlot]
                            ? <div onClick={() => game.handleClickEditOffer(slot, null)}
                                   className={cs("add-offer", "ornament-border", {
                                       adding: data.offerPane?.slot === slot && data.offerPane?.offerInd === null
                                   })}>+</div>
                            : ""}
                    </>
                </div>
            </div>;
        } catch (e) {
            console.error(e);
            debugger;
        }
    }
}

class Game extends React.Component {
    componentDidMount() {
        this.gameName = "panic-on-wall-street";
        const initArgs = {};
        if (!localStorage.panicOnWallStreetUserId || !localStorage.panicOnWallStreetUserToken) {
            while (!localStorage.userName)
                localStorage.userName = prompt("Your name");
            localStorage.panicOnWallStreetUserId = makeId();
            localStorage.panicOnWallStreetUserToken = makeId();
        }
        if (!location.hash)
            history.replaceState(undefined, undefined, location.origin + location.pathname + "#" + makeId());
        else
            history.replaceState(undefined, undefined, location.origin + location.pathname + location.hash);
        initArgs.roomId = this.roomId = location.hash.substr(1);
        initArgs.userId = this.userId = localStorage.panicOnWallStreetUserId;
        initArgs.token = this.userToken = localStorage.panicOnWallStreetUserToken;
        initArgs.userName = localStorage.userName;
        initArgs.wssToken = window.wssToken;
        this.socket = window.socket.of("panic-on-wall-street");
        this.socket.on("state", (state) => {
            if (this.state?.inited && state.phase === 0 && this.state.phase !== 0 && state.round === 5)
                popup.alert({content: `Пройдите <a href="https://forms.gle/GZrLAKYmgHRWYmYXA" target="_blank">небольшой опрос</a> о прошедшей игре. Спасибо.`});
            CommonRoom.processCommonRoom(state, this.state, {
                maxPlayers: 11,
                largeImageKey: "panic-on-wall-street",
                details: "Panic on Wall Street"
            });
            const userSlot = ~state.playerSlots.indexOf(this.userId)
                ? state.playerSlots.indexOf(this.userId)
                : null;
            if (this.state?.inited && !this.isMuted())
                this.processSounds(state, this.state, userSlot);
            if (state.phase !== 1)
                this.state.offerPane = null;
            this.setState(Object.assign(state, {
                userId: this.userId,
                userSlot,
                player: this.state.player || {},
                offerPane: this.state.offerPane
            }));
        });
        this.socket.on("not-enough-stocks", (stock) => {
            const stockNode = document.querySelector(`.player-slot-${this.state.userSlot} .seller-stocks .stock.${stock}`);
            if (stockNode) {
                stockNode.classList.add("not-enough-anim");
                setTimeout(() => stockNode?.classList?.remove("not-enough-anim"), 0);
            }
        });
        this.socket.on("ask-finalize-offer", () => {
            if (!this.isMuted())
                this.askFinalize.play();
        });
        this.socket.on("accept-finalize-offer", () => {
            if (!this.isMuted())
                this.finalizeOffer.play();
        });
        this.socket.on("accept-offer", () => {
            if (!this.isMuted())
                this.deal.play();
        });
        window.socket.on("disconnect", (event) => {
            this.setState({
                inited: false,
                disconnected: true,
                disconnectReason: event.reason
            });
        });
        document.title = `Panic on Wall Street - ${initArgs.roomId}`;
        this.socket.emit("init", initArgs);
        this.socket.on("prompt-delete-prev-room", (roomList) => {
            if (localStorage.acceptDelete =
                prompt(`Limit for hosting rooms per IP was reached: ${roomList.join(", ")}. Delete one of rooms?`, roomList[0]))
                location.reload();
        });
        this.socket.on("ping", (id) => {
            this.socket.emit("pong", id);
        });
        this.socket.on("message", text => {
            popup.alert({content: text});
        });
        this.stockSold = new Audio("/panic-on-wall-street/media/stockSold.mp3");
        this.stockSold.volume = 0.2;
        this.bid = new Audio("/panic-on-wall-street/media/bid.mp3");
        this.bid.volume = 0.2;
        this.notSold = new Audio("/panic-on-wall-street/media/notSold.mp3");
        this.notSold.volume = 0.2;
        this.income = new Audio("/panic-on-wall-street/media/income.mp3");
        this.income.volume = 0.2;
        this.score = new Audio("/panic-on-wall-street/media/score.mp3");
        this.score.volume = 0.1;
        this.askFinalize = new Audio("/panic-on-wall-street/media/askFinalize.mp3");
        this.askFinalize.volume = 0.2;
        this.deal = new Audio("/panic-on-wall-street/media/deal.mp3");
        this.deal.volume = 0.2;
        this.finalizeOffer = new Audio("/panic-on-wall-street/media/finalizeOffer.mp3");
        this.finalizeOffer.volume = 0.2;
        this.phase1End = new Audio("/panic-on-wall-street/media/phase1End.wav");
        this.phase1End.volume = 0.2;
        this.diceSet = new Audio("/panic-on-wall-street/media/diceSet.wav");
        this.diceSet.volume = 0.2;
        this.tick = new Audio("/panic-on-wall-street/media/tick.mp3");
        this.tick.volume = 0.4;
    }

    processSounds(state, prevState, userSlot) {
        if (prevState.phase === 1 && state.phase === 2)
            this.phase1End.play();
        else if (state.phase === 2) {
            if (Object.keys(state.dice).filter((ind) => state.dice[ind]).length
                > Object.keys(prevState.dice).filter((ind) => prevState.dice[ind]).length)
                this.diceSet.play();
        } else if (state.phase === 3) {
            const isBuyerIncomeEvent = Object.keys(state.buyers).filter((buyer) => state.buyers[buyer].roundResult).length
                > Object.keys(prevState.buyers).filter((buyer) => prevState.buyers[buyer].roundResult).length;
            if (isBuyerIncomeEvent) {
                if (!prevState.buyers[userSlot]?.roundResult && state.buyers[userSlot]?.roundResult)
                    this.income.play();
                else
                    this.score.play();
            }
        } else if (state.phase === 4) {
            const isSellerIncomeEvent = Object.keys(state.sellers).filter((seller) => state.sellers[seller].roundResult).length
                > Object.keys(prevState.sellers).filter((seller) => prevState.sellers[seller].roundResult).length;
            if (isSellerIncomeEvent) {
                if (!prevState.sellers[userSlot]?.roundResult && state.sellers[userSlot]?.roundResult)
                    this.income.play();
                else
                    this.score.play();
            }
        } else if (state.phase === 6 || (state.phase === 1 && prevState.phase === 6)) {
            if (state.auctionStocksLeft < prevState.auctionStocksLeft || (state.phase === 1 && prevState.phase === 6)) {
                if (prevState.auctionBidder === null)
                    this.notSold.play();
                else
                    this.stockSold.play();
            } else if (prevState.auctionBid && state.auctionBid > prevState.auctionBid) {
                this.bid.play();
            }
        }
    }

    constructor() {
        super();
        this.state = {
            inited: false
        };
    }

    debouncedEmit(event, data1, data2) {
        clearTimeout(this.debouncedEmitTimer);
        this.debouncedEmitTimer = setTimeout(() => {
            this.socket.emit(event, data1, data2);
        }, 50);
    }

    handleChangeParam(value, type) {
        this.debouncedEmit("set-param", type, value);
    }

    handleRemovePlayer(id, evt) {
        evt.stopPropagation();
        if (!this.state.testMode)
            popup.confirm({content: `Removing ${this.state.playerNames[id]}?`}, (evt) => evt.proceed && this.socket.emit("remove-player", id));
        else
            this.socket.emit("remove-player", id);
    }

    handleGiveHost(id, evt) {
        evt.stopPropagation();
        popup.confirm({content: `Give host ${this.state.playerNames[id]}?`}, (evt) => evt.proceed && this.socket.emit("give-host", id));
    }

    handleToggleTeamLockClick() {
        this.socket.emit("toggle-lock");
    }

    handleClickTogglePause() {
        this.socket.emit("toggle-pause");
    }

    handleRestartTimer() {
        this.socket.emit("restart-timer");
    }

    handleClickStop() {
        popup.confirm({content: "Игра будет отменена. Вы уверены?"}, (evt) => evt.proceed && this.socket.emit("abort-game"));
    }

    handleClickRestart() {
        if (!this.playerWin)
            popup.confirm({content: "Перезапустить игру?"}, (evt) => evt.proceed && this.socket.emit("restart"));
        else
            this.socket.emit("restart")
    }

    handleClickSetAvatar() {
        document.getElementById("avatar-input").click();
    }

    handleSetAvatar(event) {
        const input = event.target;
        if (input.files && input.files[0]) {
            const
                file = input.files[0],
                uri = "/common/upload-avatar",
                xhr = new XMLHttpRequest(),
                fd = new FormData(),
                fileSize = ((file.size / 1024) / 1024).toFixed(4); // MB
            if (fileSize <= 5) {
                xhr.open("POST", uri, true);
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        localStorage.avatarId = xhr.responseText;
                        this.socket.emit("update-avatar", localStorage.avatarId);
                    } else if (xhr.readyState === 4 && xhr.status !== 200) popup.alert({content: "Ошибка загрузки"});
                };
                fd.append("avatar", file);
                fd.append("userId", this.userId);
                fd.append("userToken", this.userToken);
                xhr.send(fd);
            } else
                popup.alert({content: "Файл не должен занимать больше 5Мб"});
        }
    }

    handlePlayerJoin(slot) {
        this.socket.emit("players-join", slot);
    }

    emit(param) {
        this.socket.emit(param);
    }

    handleClickToggleWantRole(role) {
        this.socket.emit(`toggle-want-${role}`);
    }

    handleClickEditOffer(slot, offerInd) {
        if (!this.state.buyers[this.state.userSlot] || this.state.phase !== 1)
            return;
        if (!(this.state.offerPane && this.state.offerPane.slot === slot && this.state.offerPane.offerInd == offerInd)) {
            const currentOffer = offerInd !== null
                ? this.state.sellers[slot].offers[offerInd]
                : null;
            this.setState(Object.assign(this.state, {
                offerPane: {
                    slot,
                    offerInd,
                    price: currentOffer ? currentOffer.price : 5,
                    stocks: currentOffer ? currentOffer.stocks : {}
                }
            }));
        } else {
            this.handleClickSaveEditOffer();
        }
    }

    handleClickSaveEditOffer() {
        const {slot, stocks, price, offerInd} = this.state.offerPane;
        if (Object.keys(stocks).length) {
            this.socket.emit("edit-offer", slot, stocks, price, offerInd);
            this.setState(Object.assign(this.state, {
                offerPane: null
            }));
        }
    }

    handleClickHideEditOffer() {
        this.setState(Object.assign(this.state, {
            offerPane: null
        }));
    }

    handleClickOfferChangePrice(amount) {
        const result = this.state.offerPane.price + amount;
        if (result >= 5)
            this.state.offerPane.price = result;
        this.setState(this.state);
    }

    handleClickOfferAddStock(stock, decrease, slot) {
        if (this.state.phase === 5 && slot == this.state.userSlot) {
            this.socket.emit("pledge-stock", stock);
            return;
        }
        if (this.state.phase !== 1)
            return;
        if (!this.state.buyers[this.state.userSlot])
            return;
        if (slot !== undefined && (!this.state.offerPane || this.state.offerPane.slot !== slot))
            this.state.offerPane = {
                slot,
                price: 5,
                stocks: {}
            };
        this.state.offerPane.stocks[stock] = this.state.offerPane.stocks[stock] || 0;
        const
            stocks = this.state.sellers[this.state.offerPane.slot].stocks,
            result = this.state.offerPane.stocks[stock] + (decrease ? -1 : 1);
        if ((decrease && result >= 0) || (!decrease && result <= stocks[stock]))
            this.state.offerPane.stocks[stock] = result;
        if (!this.state.offerPane.stocks[stock])
            delete this.state.offerPane.stocks[stock];
        this.setState(this.state);
    }

    handleClickToggleAcceptOffer(offerInd) {
        this.socket.emit("toggle-accept-offer", offerInd);
    }

    handleClickToggleFinalizeOffer(seller, offerInd) {
        this.socket.emit("ask-finalize-offer", seller, offerInd);
    }

    handleClickBidStock(amount) {
        this.socket.emit("bid-stock", amount);
    }

    isMuted() {
        return !!parseInt(localStorage.muteSounds);
    }

    handleToggleMuteSounds() {
        localStorage.muteSounds = !parseInt(localStorage.muteSounds) ? 1 : 0;
        this.setState(Object.assign({}, this.state));
    }

    updateClock() {
        if (this.prevMinutes !== this.minutes)
            this.updateTimerFlipEl(
                document.getElementsByClassName("flip-clock__piece")[0],
                this.minutes,
                this.prevMinutes
            );
        if (this.prevSeconds !== this.seconds)
            this.updateTimerFlipEl(
                document.getElementsByClassName("flip-clock__piece")[1],
                this.seconds,
                this.prevSeconds
            );
    }

    updateTimerFlipEl(el, value, prevValue) {
        if (el) {
            el.getElementsByClassName("card__back")[0].setAttribute("data-value", prevValue);
            el.getElementsByClassName("card__bottom")[0].setAttribute("data-value", prevValue);
            el.getElementsByClassName("card__top")[0].innerText = value;
            el.getElementsByClassName("card__bottom")[1].setAttribute("data-value", value);
            el.classList.remove("flip");
            void el.offsetHeight;
            el.classList.add("flip");
        }
    }

    render() {
        try {
            clearInterval(this.timerTimeout);
            if (this.state.disconnected)
                return (<div
                    className="kicked">Disconnected{this.state.disconnectReason ? ` (${this.state.disconnectReason})` : ""}</div>);
            else if (this.state.inited) {
                const
                    data = this.state,
                    isHost = data.hostId === data.userId,
                    inProcess = data.phase !== 0 && !data.paused,
                    notEnoughPlayers = data.phase === 0 && data.playerSlots.filter((slot) => slot !== null).length < 5;
                let status;
                if (data.time) {
                    const date = new Date(data.time).toUTCString().match(/\d\d:(\d\d):(\d\d)/);
                    this.minutes = date[1];
                    this.seconds = date[2];
                }
                if (data.inited) {
                    let gameIsOver = false;
                    if (data.phase === 0 && data.round === 5)
                        gameIsOver = true;
                    if (notEnoughPlayers)
                        status = gameIsOver
                            ? `Игра окончена! Недостаточно игроков для запуска новой игры`
                            : `Недостаточно игроков`;
                    else if (data.phase === 0)
                        if (data.userId === data.hostId)
                            status = gameIsOver
                                ? `Игра окончена! Вы можете начать новую игру`
                                : `Вы можете начать игру`;
                        else
                            status = gameIsOver
                                ? `Игра окончена! Хост может начать новую игру`
                                : `Хост может начать игру`;
                    else if (data.phase === 1)
                        status = "Торги";
                    else if (data.phase === 2)
                        status = "Стоимость акций";
                    else if (data.phase === 3)
                        status = "Прибыль инвесторов";
                    else if (data.phase === 4)
                        status = "Прибыль менеджеров";
                    else if (data.phase === 5)
                        status = "Долги менеджеров";
                    else if (data.phase === 6)
                        status = "Аукцион";
                    if (data.phase > 0)
                        status = `Раунд ${data.round}: ${status}`;
                    if (data.phase === 5 && data.sellers[data.userSlot]?.balance < 0 && !data.bankrupts.includes(data.userSlot))
                        status = `${status}. Выберите акцию для продажи`;
                }
                if (!data.paused) {
                    let timeStart = new Date();
                    this.timerTimeout = setInterval(() => {
                        if (!this.state.paused && this.state.time > 0) {
                            let prevTime = this.state.time,
                                time = prevTime - (new Date() - timeStart);
                            if (time > 0) {
                                if ([1, 5].includes(this.state.phase)) {
                                    this.state.time = time;
                                    const date = new Date(this.state.time).toUTCString().match(/\d\d:(\d\d):(\d\d)/);
                                    this.prevMinutes = this.minutes;
                                    this.prevSeconds = this.seconds;
                                    this.minutes = date[1];
                                    this.seconds = date[2];
                                    this.updateClock();
                                } else {
                                    this.setState(Object.assign({}, this.state, {time: time}));
                                }
                                if (this.state.phase === 1 && !this.isMuted() && this.state.timed
                                    && time < 8000 && ((Math.floor(prevTime / 1000) - Math.floor(time / 1000)) > 0))
                                    this.tick.play();
                                timeStart = new Date();
                            }
                        }
                    }, 200);
                }
                const activeSlots = [];
                data.playerSlots.forEach((userId, slot) => {
                    if (data.buyers[slot] || data.sellers[slot])
                        activeSlots.push(slot);
                });
                const
                    playerCount = activeSlots.length,
                    showEmptySlots = data.phase === 0 && !data.teamsLocked,
                    slots = (showEmptySlots ? data.playerSlots : activeSlots)
                        .map((value, slot) => showEmptySlots ? slot : value);
                const
                    auctionBidMin = data.auctionBid < 30 ? 5 : 10,
                    auctionBidMax = data.auctionBid < 30 ? 10 : 20;
                return (
                    <div className={cs("game")}>
                        <div className={cs("game-board", {active: this.state.inited})}>
                            {showEmptySlots ? <div className="player-slots">{
                                slots.map((slot) => (<PlayerSlot data={data} slot={slot} game={this}/>))}</div> : <>
                                <div className="seller-slots">
                                    {Object.keys(data.sellers).map((slot) => (
                                        <SellerSlot data={data} slot={slot} game={this}/>))}
                                </div>
                            </>}
                            <div className="spacer"/>
                            <div className="bottom-pane">
                                <div className="buyer-slots">
                                    {!showEmptySlots ? Object.keys(data.buyers)
                                        .slice(0, Math.floor(Object.keys(data.buyers).length / 2)).map((slot) => (
                                            <BuyerSlot data={data} slot={slot} game={this}/>)) : ""}
                                    <div className={cs("stocks-table", {
                                        randomize: data.phase === 2
                                    })}>
                                        {[1, 5].includes(data.phase) ?
                                            <FlipTimer data={data} game={this}/>
                                            : ""}
                                        <div className="status-message">{status}</div>
                                        {Object.keys(data.diceValues).map((stock) => (
                                            <div className={`stocks-line stocks-line-${stock}`}>
                                                <div
                                                    className={cs("stock-dice")}>
                                                    {data.dice[stock] ?? "?"}
                                                    <div className="stock-dice-values">
                                                        {data.diceValuesOrig[stock].map((value, index) => <div
                                                            className={cs("stock-dice", {
                                                                current: data.diceValuesOrig[stock].indexOf(data.dice[stock]) === index
                                                            })}>{value}</div>)}
                                                    </div>
                                                </div>
                                                <div
                                                    className="stock-price-values">{Object.keys(data.stockValues[stock]).map((valueInd) => (
                                                    <div
                                                        className={cs("stock-price", {active: parseInt(valueInd) === data.stockInd[stock]})}>
                                                        {data.stockValues[stock][valueInd]}</div>))}
                                                </div>
                                            </div>))}
                                    </div>
                                    {!showEmptySlots ? Object.keys(data.buyers)
                                        .slice(Math.floor(Object.keys(data.buyers).length / 2)).map((slot) => (
                                            <BuyerSlot data={data} slot={slot} game={this}/>)) : ""}
                                </div>
                            </div>
                            <div
                                className={cs("spectators-section", {active: data.spectators.length > 0 || !data.teamsLocked})}>
                                <Spectators data={this.state} game={this}/>
                            </div>
                            {data.phase === 0 && !data.spectators.includes(data.userId) ? (
                                <div className="want-role-section">
                                    <div className="want-role-seller"
                                         onClick={() => this.handleClickToggleWantRole("seller")}>
                                        <div className="want-role-title">Хочу слот Менеджера:</div>
                                        <div className="want-role-list">
                                            {data.wantSellerList.length ? data.wantSellerList.map((it) => (<div>
                                                {data.playerNames[it]}
                                            </div>)) : "..."}
                                        </div>
                                    </div>
                                    <div className="want-role-buyer"
                                         onClick={() => this.handleClickToggleWantRole("buyer")}>
                                        <div className="want-role-title">Хочу слот Инвестора:</div>
                                        <div className="want-role-list">
                                            {data.wantBuyerList.length ? data.wantBuyerList.map((it) => (<div>
                                                {data.playerNames[it]}
                                            </div>)) : "..."}
                                        </div>
                                    </div>
                                </div>
                            ) : ""}
                            {data.offerPane ?
                                <div className="offer-pane">
                                    <div className="offer-pane-title">Offer</div>
                                    <div className="offer-price-edit">
                                        <div className="spacer"/>
                                        <div className="offer-price-down double"
                                             onClick={() => this.handleClickOfferChangePrice(-50)}>
                                            <i className="material-icons">fast_rewind</i>
                                        </div>
                                        <div className="offer-price-down"
                                             onClick={() => this.handleClickOfferChangePrice(-5)}>
                                            <i className="material-icons">arrow_left</i>
                                        </div>
                                        <div className="offer-price">
                                            ${data.offerPane.price}
                                        </div>
                                        <div className="offer-price-up"
                                             onClick={() => this.handleClickOfferChangePrice(5)}>
                                            <i className="material-icons">arrow_right</i>
                                        </div>
                                        <div className="offer-price-up double"
                                             onClick={() => this.handleClickOfferChangePrice(50)}>
                                            <i className="material-icons">fast_forward</i>
                                        </div>
                                        <div className="spacer"/>
                                        <div className="offer-add-save">
                                            <i className="material-icons cancel"
                                               onClick={() => this.handleClickHideEditOffer()}>cancel_presentation</i>
                                            <i className="material-icons save"
                                               onClick={() => this.handleClickSaveEditOffer()}>check_box</i>
                                        </div>
                                    </div>
                                    <div className="offer-add-stock">
                                        {["red", "yellow", "green", "blue", "red2x", "yellow2x", "green2x", "blue2x"]
                                            .map((stock) => {
                                                const
                                                    stocksCount = data.sellers[data.offerPane.slot].stocks[stock]
                                                        ? data.sellers[data.offerPane.slot].stocks[stock] - (data.offerPane.stocks[stock] || 0)
                                                        - (data.sellers[data.offerPane.slot].stocksFinalized[stock] || 0)
                                                        : 0,
                                                    stockUpInactive = !stocksCount,
                                                    hasStocks = data.sellers[data.offerPane.slot].stocks[stock];
                                                return <>
                                                    <div className={cs("stock", stock, {
                                                        noStocks: !hasStocks,
                                                        hasStocks
                                                    })}
                                                         onClick={() => !stockUpInactive && this.handleClickOfferAddStock(stock)}>
                                                        <div className="stock-icon stock-icon-full">
                                                            {stock.endsWith("2x")
                                                                ? <div className="stock-icon-2x">2x</div>
                                                                : ""}
                                                        </div>
                                                        {data.sellers[data.offerPane.slot].stocks[stock]
                                                            ? <div className="stock-count">
                                                                {stocksCount}
                                                            </div>
                                                            : ""}
                                                    </div>
                                                    <div className={cs("offer-stock-count", {
                                                        active: hasStocks
                                                    })}>
                                                        <div className={cs("offer-stock-up", {
                                                            inactive: stockUpInactive
                                                        })}
                                                             onClick={() => !stockUpInactive && this.handleClickOfferAddStock(stock)}>
                                                            <i className="material-icons">keyboard_arrow_up</i>
                                                        </div>
                                                        <div className="offer-stock-count-value">
                                                            {data.offerPane.stocks[stock] || 0}
                                                        </div>
                                                        <div className={cs("offer-stock-down", {
                                                            inactive: !data.offerPane.stocks[stock]
                                                        })}
                                                             onClick={() => this.handleClickOfferAddStock(stock, true)}>
                                                            <i className="material-icons">keyboard_arrow_down</i>
                                                        </div>
                                                    </div>
                                                </>;
                                            })}
                                    </div>
                                </div>
                                : ""}
                            {(data.phase === 3 || data.phase === 4) ?
                                <div className="round-result-wrap">
                                    <div className="round-result ornament-border">
                                        <div className="round-result-title">
                                            Раунд {data.round}
                                            <Timer time={data.timed && data.time}/>
                                        </div>
                                        <div className="buyers-income">
                                            <div className="income-title">Инвесторы</div>
                                            {Object.keys(data.buyers).map((buyer) => (
                                                <div className={cs("buyer-income-row")}>
                                                <span className={cs("buyer-income-name", `bg-color-${buyer}`)}>
                                                    {data.playerNames[data.playerSlots[buyer]] || "Пусто"}
                                                </span>
                                                    {data.buyers[buyer].roundResult
                                                        ? (() => {
                                                            const result = data.buyers[buyer].roundResult;
                                                            return <>
                                                                {result.overallOutcome !== 0
                                                                    ? <>
                                                                        <span
                                                                            className="prev-balance">&nbsp;$<Balance
                                                                            value={result.prevBalance}/></span>
                                                                        <span className="owned-stocks">{
                                                                            Object.keys(result.stocksOwned)
                                                                                .filter((stock) => !!result.stocksIncome[stock])
                                                                                .map((stock) => (<>
                                                                    <span className="stock-income">
                                                                        &nbsp;{result.stocksIncome[stock] > 0 ? "+" : "−"}
                                                                        &nbsp;${Math.abs(result.stocksIncome[stock])}
                                                                    </span>
                                                                                    <span
                                                                                        className={`owned-stock stock ${stock}`}>
                                                                        &nbsp;<span className="stock-icon"/>
                                                                    </span>
                                                                                </>))}</span>
                                                                        <span className="overall-outcome">
                                                                &nbsp;− ${Math.abs(result.overallOutcome)}&nbsp;
                                                            </span>
                                                                    </>
                                                                    : ""}
                                                                <span className="spacer"/>
                                                                <span className="offer-price">
                                                                $<Balance value={data.buyers[buyer].balance}/>
                                                            </span>
                                                            </>;
                                                        })() : ""}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="sellers-income">
                                            <div className="income-title">Менеджеры</div>
                                            {Object.keys(data.sellers).map((seller) => (
                                                <div className={cs("seller-income-row")}>
                                                <span className={cs("seller-income-name", `bg-color-${seller}`)}>
                                                    {data.playerNames[data.playerSlots[seller]] || "Пусто"}
                                                </span>
                                                    {data.sellers[seller].roundResult
                                                        ? (() => {
                                                            const result = data.sellers[seller].roundResult;
                                                            return <>
                                                                <span
                                                                    className="prev-balance">&nbsp;$<Balance
                                                                    value={result.prevBalance}/></span>
                                                                {result.overallIncome
                                                                    ? <span
                                                                        className="stock-income">&nbsp;+ ${result.overallIncome}</span>
                                                                    : ""}
                                                                <span className="overall-outcome">
                                                                &nbsp;− ${Math.abs(result.overallOutcome)}&nbsp;
                                                            </span>
                                                                <span className="spacer"/>
                                                                <span className="offer-price">
                                                                $<Balance value={data.sellers[seller].balance}/>
                                                            </span>
                                                            </>;
                                                        })() : ""}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                : ""}
                            {data.phase === 6 ?
                                <div className="auction-pane">
                                    <div className="auction-pane-inner">
                                        <div className="auction-stock-left">
                                            {data.auctionStocksTotal - data.auctionStocksLeft + 1}/{data.auctionStocksTotal}
                                        </div>
                                        <Timer time={data.timed && data.time}/>
                                        <div className="auction-stock">
                                            <div className={cs("stock", data.auctionStock)}>
                                                <div className="stock-icon stock-icon-full">
                                                    {data.auctionStock.endsWith("2x")
                                                        ? <div className="stock-icon-2x">2x</div>
                                                        : ""}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="auction-bid">
                                            <span className={"currency-sign"}>$</span>{data.auctionBid}
                                        </div>
                                        <div className="auction-bidder-title">
                                            Покупатель
                                        </div>
                                        <div className={cs("auction-bidder", `bg-color-${data.auctionBidder}`)}>
                                            {data.auctionBidder !== null
                                                ? data.playerNames[data.playerSlots[data.auctionBidder]] || "Пусто"
                                                : "Нет"
                                            }
                                        </div>
                                    </div>
                                    <div className={cs("auction-controls", {
                                        inactive: data.biddingCooldown || !data.sellers[data.userSlot]
                                    })}>
                                        <div className="auction-rise-button auction-rise-min"
                                             onClick={() => this.handleClickBidStock(auctionBidMin)}>+{auctionBidMin}
                                        </div>
                                        <div className="auction-rise-button auction-rise-max"
                                             onClick={() => this.handleClickBidStock(auctionBidMax)}>+{auctionBidMax}
                                        </div>
                                    </div>
                                </div>
                                : ""}
                            <div className="rules panel"><a href="/panic-on-wall-street/media/PoWS_RulesList.pdf"
                                                            target="_blank">Как играть?</a></div>
                            <HostControls
                                app={this}
                                data={data}
                                timerControls={[
                                    {
                                        title: "negotiation time",
                                        field: "negotiationTime",
                                        min: 0,
                                        icon: "alarm",
                                        timeControl: true
                                    },
                                    {
                                        title: "manager pledge time",
                                        field: "sellersPledgeTime",
                                        min: 0,
                                        icon: "alarm_on",
                                        timeControl: true
                                    },
                                    {
                                        title: "auction step time",
                                        field: "auctionStepTime",
                                        min: 0,
                                        icon: "alarm_add",
                                        timeControl: true
                                    }
                                ]}
                                inProcess={inProcess}
                                emitEvent={(...args) => {
                                    this.socket.emit(...args)
                                }}
                                handleChangeParam={(field, value) => this.handleChangeParam(value, field)}
                                sideButtons={<>
                                    {isHost && !inProcess ? (data.bankruptcyEnabled
                                        ? (<i onClick={() => this.emit("toggle-bankruptcy")}
                                              className="material-icons start-game settings-button">attach_money</i>)
                                        : (<i onClick={() => this.emit("toggle-bankruptcy")}
                                              className="material-icons start-game settings-button">money_off</i>)) : ""}
                                    {(isHost && data.paused && data.testMode) ? (
                                        <i onClick={() => this.handleRestartTimer()}
                                           className="material-icons start-game settings-button">alarm</i>
                                    ) : ""}
                                    {(isHost && !inProcess) ?
                                        (<i onClick={() => this.handleClickRestart()}
                                            className="material-icons start-game settings-button">sync</i>) : ""}
                                    {(isHost && data.paused && data.phase !== 0)
                                        ? (<i onClick={() => this.handleClickStop()}
                                              className="toggle-theme material-icons settings-button">stop</i>) : ""}
                                    {isHost ? (!inProcess
                                        ? (<i onClick={() => this.handleClickTogglePause()}
                                              className="material-icons start-game settings-button">play_arrow</i>)
                                        : (<i onClick={() => this.handleClickTogglePause()}
                                              className="material-icons start-game settings-button">pause</i>)) : ""}
                                    {isHost ? (data.teamsLocked
                                        ? (<i onClick={() => this.handleToggleTeamLockClick()}
                                              className="material-icons start-game settings-button">lock_outline</i>)
                                        : (<i onClick={() => this.handleToggleTeamLockClick()}
                                              className="material-icons start-game settings-button">lock_open</i>)) : ""}
                                    {!this.isMuted()
                                        ? (<i onClick={() => this.handleToggleMuteSounds()}
                                              className="toggle-theme material-icons settings-button">volume_up</i>)
                                        : (<i onClick={() => this.handleToggleMuteSounds()}
                                              className="toggle-theme material-icons settings-button">volume_off</i>)}
                                </>}
                            />
                            <CommonRoom state={this.state} app={this}/>
                            <input id="avatar-input" type="file" onChange={evt => this.handleSetAvatar(evt)}/>
                        </div>
                    </div>
                );
            } else return (<div/>);
        } catch (error) {
            console.error(error);
            debugger;
            return (<div
                className="kicked">{`Client error: ${error.message}`}</div>);
        }
    }
}

ReactDOM.render(<Game/>, document.getElementById('root'));
