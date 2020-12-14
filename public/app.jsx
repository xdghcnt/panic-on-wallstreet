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

class Balance extends React.Component {
    render() {
        const value = this.props.value;
        return `${value < 0 ? "−" : ""}$${Math.abs(value)}`;
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
                player = data.playerSlots[slot];
            return (
                <div
                    className={cs("player-slot", `player-slot-${slot}`, {
                        "no-player": player === null
                    })}>
                    <div className="player-section">
                        <div className={cs("avatar", {"no-player": player === null})}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                     ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                     : "default-user.png"})` : ""
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
                player = data.playerSlots[slot];
            return (
                <div
                    className={cs("player-slot", `player-slot-${slot}`, {
                        "no-player": player === null,
                        bankrupt: data.bankrupts.includes(slot)
                    })}>
                    <div className="player-section">
                        <div className={cs("avatar", {"no-player": player === null})}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                     ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                     : "default-user.png"})` : ""
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
                    && data.sellers[data.userSlot]?.balance < 0 && !data.bankrupts.includes(data.userSlot);
            return <div className="seller-section">
                <div className={cs("player-slot", `player-slot-${slot}`, {
                    "no-player": player === null,
                    bankrupt: data.bankrupts.includes(slot)
                })}>
                    <div className="player-section">
                        <div className={cs("avatar", {"no-player": player === null})}
                             onTouchStart={(e) => e.target.focus()}
                             style={{
                                 "background-image": player !== null ? `url(/panic-on-wall-street/${data.playerAvatars[player]
                                     ? `avatars/${player}/${data.playerAvatars[player]}.png`
                                     : "default-user.png"})` : ""
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
                        ["red", "red2x", "yellow", "yellow2x", "blue", "blue2x", "green", "green2x"].map((stock) =>
                            (<div
                                onClick={() => seller.stocks[stock]
                                    && game.handleClickOfferAddStock(stock, false, slot)}
                                className={cs("stock", stock, {
                                    hasStocks: !!seller.stocks[stock]
                                })}>
                                <div className={cs("stock-icon", {
                                    needPledge: seller.stocks[stock] > 0 && needPledge
                                })}>{stock.endsWith("2x")
                                    ? <i className="material-icons">looks_two</i>
                                    : ""}</div>
                                <div className="stock-count">{seller.stocks[stock] || 0}</div>
                            </div>)
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
                            return <div className={cs("offer", {
                                adding: data.offerPane?.slot === slot && data.offerPane?.offerInd === offerInd
                            })}>
                                <div className={cs("offer-background", `bg-color-${offer.player}`)}/>
                                <div className={cs("offer-border", `text-color-${offer.player}`)}/>
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
                                                    ? <svg className="finalize-anim" xmlns="http://www.w3.org/2000/svg">
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
                                {offer.player == data.userSlot && !offer.finalized
                                    ? <div className="offer-buttons">
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
                                   className={cs("add-offer", {
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
            if (state.phase === 0 && state.round === 5)
                popup.alert({content: `Пройдите <a href="https://forms.gle/GZrLAKYmgHRWYmYXA" target="_blank">небольшой опрос</a> о прошедшей игре. Спасибо.`});
            CommonRoom.processCommonRoom(state, this.state, {
                maxPlayers: 11,
                largeImageKey: "panic-on-wall-street",
                details: "Panic on Wall Street"
            });
            if (state.phase !== 1)
                this.state.offerPane = null;
            this.setState(Object.assign(state, {
                userId: this.userId,
                userSlot: ~state.playerSlots.indexOf(this.userId)
                    ? state.playerSlots.indexOf(this.userId)
                    : null,
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

    handleClickOfferChangePrice(decrease) {
        const result = this.state.offerPane.price + (decrease ? -5 : 5);
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
                    this.timerTimeout = setTimeout(() => {
                        if (!this.state.paused && this.state.time > 0) {
                            let prevTime = this.state.time,
                                time = prevTime - (new Date() - timeStart);
                            this.setState(Object.assign({}, this.state, {time: time}));
                        }
                    }, 100);
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
                const hasStocks = (stock) => data.sellers[data.offerPane.slot].stocks[stock] === data.offerPane.stocks[stock];
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
                            <div className="bottom-pane">
                                {![0, 3, 4, 6].includes(data.phase) ? <Timer time={data.timed && data.time}/> : ""}
                                <div className="buyer-slots">
                                    {!showEmptySlots ? Object.keys(data.buyers)
                                        .slice(0, Math.floor(Object.keys(data.buyers).length / 2)).map((slot) => (
                                            <BuyerSlot data={data} slot={slot} game={this}/>)) : ""}
                                    <div className={cs("stocks-table", {
                                        randomize: data.phase === 2
                                    })}>
                                        <div className="status-message">{status}</div>
                                        {Object.keys(data.diceValues).map((stock) => (
                                            <div className={`stocks-line stocks-line-${stock}`}>
                                                <div
                                                    className={cs("stock-dice", {active: data.dice[stock] !== null})}>
                                                    {data.dice[stock]}
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
                                    <div className="offer-top-row">
                                        <div className="offer-price">
                                            <div className="offer-price-up"
                                                 onClick={() => this.handleClickOfferChangePrice()}>
                                                <i className="material-icons">expand_less</i>
                                            </div>
                                            <div className="offer-price-value">
                                                ${data.offerPane.price}
                                            </div>
                                            <div className="offer-price-down"
                                                 onClick={() => this.handleClickOfferChangePrice(true)}>
                                                <i className="material-icons">expand_more</i>
                                            </div>
                                        </div>
                                        <div className="stocks-pane">
                                            {Object.keys(data.offerPane.stocks).map((stock) =>
                                                <div className={`offer-stock stock ${stock}`}>
                                                    <div className="offer-stock-count">
                                                        <div className={cs("offer-stock-up", {
                                                            inactive: hasStocks(stock)
                                                        })}
                                                             onClick={() => this.handleClickOfferAddStock(stock)}>
                                                            <i className="material-icons">expand_less</i>
                                                        </div>
                                                        <div className="offer-stock-count-value">
                                                            {data.offerPane.stocks[stock]}
                                                        </div>
                                                        <div className="offer-stock-down"
                                                             onClick={() => this.handleClickOfferAddStock(stock, true)}>
                                                            <i className="material-icons">expand_more</i>
                                                        </div>
                                                    </div>
                                                    <div className="offer-stock-icon">
                                                        <div className="stock-icon">{stock.endsWith("2x")
                                                            ? <i className="material-icons">looks_two</i>
                                                            : ""}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="offer-add-stock">
                                        <div className="offer-add-icon">
                                            <i className="material-icons">add_box</i>
                                        </div>
                                        <div className="offer-add-controls">
                                            <div className="offer-add-stock-row">
                                                {["red", "yellow", "blue", "green"].map((stock) =>
                                                    (<div className={cs("stock", stock, {
                                                        inactive: hasStocks(stock)
                                                    })}
                                                          onClick={() => this.handleClickOfferAddStock(stock)}>
                                                        <div className="stock-icon"/>
                                                    </div>))}
                                            </div>
                                            <div className="offer-add-stock-row offer-add-stock-row-2x">
                                                {["red2x", "yellow2x", "blue2x", "green2x"].map((stock) =>
                                                    (<div className={cs("stock", stock, {
                                                        inactive: hasStocks(stock)
                                                    })}
                                                          onClick={() => this.handleClickOfferAddStock(stock)}>
                                                        <div className="stock-icon"><i
                                                            className="material-icons">looks_two</i></div>
                                                    </div>))}
                                            </div>
                                        </div>
                                        <div className="offer-add-save">
                                            <i className="material-icons cancel"
                                               onClick={() => this.handleClickHideEditOffer()}>cancel_presentation</i>
                                            <i className="material-icons save"
                                               onClick={() => this.handleClickSaveEditOffer()}>check_box</i>
                                        </div>
                                    </div>
                                </div>
                                : ""}
                            {(data.phase === 3 || data.phase === 4) ?
                                <div className="round-result-wrap">
                                    <div className="round-result">
                                        <div className="round-result-title">
                                            Раунд {data.round}
                                            <Timer time={data.timed && data.time}/>
                                        </div>
                                        <div className="buyers-income">
                                            <div className="income-title">Инвесторы</div>
                                            {Object.keys(data.buyers).map((buyer) => (
                                                <div className={cs("buyer-income-row")}>
                                                <span className={cs("buyer-income-name", `bg-color-${buyer}`)}>
                                                    {data.playerNames[data.playerSlots[buyer]] || "<Empty>"}
                                                </span>
                                                    <div className={cs("offer-border", `text-color-${buyer}`)}/>
                                                    {data.buyers[buyer].roundResult
                                                        ? (() => {
                                                            const result = data.buyers[buyer].roundResult;
                                                            return <>
                                                                {result.overallOutcome !== 0
                                                                    ? <>
                                                                        <span
                                                                            className="prev-balance">&nbsp;<Balance
                                                                            value={result.prevBalance}/></span>
                                                                        <span className="owned-stocks">{
                                                                            Object.keys(result.stocksOwned)
                                                                                .filter((stock) => result.stocksIncome[stock] > 0)
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
                                                                <span className="balance">
                                                                = <Balance value={data.buyers[buyer].balance}/>
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
                                                    {data.playerNames[data.playerSlots[seller]] || "<Empty>"}
                                                </span>
                                                    <div className={cs("offer-border", `text-color-${seller}`)}/>
                                                    {data.sellers[seller].roundResult
                                                        ? (() => {
                                                            const result = data.sellers[seller].roundResult;
                                                            return <>
                                                                <span
                                                                    className="prev-balance">&nbsp;<Balance
                                                                    value={result.prevBalance}/></span>
                                                                {result.overallIncome
                                                                    ? <span
                                                                        className="stock-income">&nbsp;+ ${result.overallIncome}</span>
                                                                    : ""}
                                                                <span className="overall-outcome">
                                                                &nbsp;− ${Math.abs(result.overallOutcome)}&nbsp;
                                                            </span>
                                                                <span className="spacer"/>
                                                                <span className="balance">
                                                                = <Balance value={data.sellers[seller].balance}/>
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
                                    <Timer time={data.timed && data.time}/>
                                    <div className="auction-stock">
                                        <div className={cs("stock", data.auctionStock)}>
                                            <div className="stock-icon">
                                                {data.auctionStock.endsWith("2x")
                                                    ? <i className="material-icons">looks_two</i>
                                                    : ""}
                                                <div className="auction-stock-left">
                                                    {data.auctionStocksTotal - data.auctionStocksLeft + 1}/{data.auctionStocksTotal}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="auction-bid">
                                        ${data.auctionBid}
                                    </div>
                                    <div className="auction-bidder">
                                        Покупатель:&nbsp;
                                        {data.auctionBidder !== null
                                            ? data.playerNames[data.playerSlots[data.auctionBidder]]
                                            : "Нет"
                                        }
                                    </div>
                                    <div className={cs("auction-controls", {
                                        inactive: data.biddingCooldown || !data.sellers[data.userSlot]
                                    })}>
                                        <div className="auction-rise-button auction-rise-5"
                                             onClick={() => this.handleClickBidStock(5)}>+5
                                        </div>
                                        <div className="auction-rise-button auction-rise-10"
                                             onClick={() => this.handleClickBidStock(10)}>+10
                                        </div>
                                    </div>
                                </div>
                                : ""}
                            <div className="rules panel"><a href="/panic-on-wall-street/PoWS_RulesList.png"
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
