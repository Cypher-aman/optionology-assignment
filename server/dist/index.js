"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const activeInstrument_1 = __importDefault(require("./route/activeInstrument"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api', activeInstrument_1.default);
const server = app.listen(8000, () => {
    console.log('Server listening on port 8000');
});
const userSymbolMap = new Map();
function fetchHistoricalData(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://www.bitmex.com/api/v1/trade/bucketed?binSize=1d&partial=0&symbol=${symbol}&count=30&reverse=true`);
            return response.data;
        }
        catch (error) {
            console.error("Error fetching historical data:", error);
            return [];
        }
    });
}
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    let subscribedSymbol = 'ETHUSD';
    // Fetch initial historical data
    let chartData = yield fetchHistoricalData(subscribedSymbol);
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null });
    ws.send(JSON.stringify(chartData));
    const bitmexWS = new ws_1.default(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
    bitmexWS.onmessage = (event) => {
        const data = JSON.parse(event.data.toString());
        if (data.table === 'trade') {
            chartData = updateChartData(chartData, data.data[0]);
            ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
        }
    };
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS });
    ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { newSymbol } = JSON.parse(message.toString());
        if (newSymbol !== subscribedSymbol) {
            (_a = userSymbolMap.get(ws).bitmexWS) === null || _a === void 0 ? void 0 : _a.close();
            subscribedSymbol = newSymbol;
            try {
                chartData = yield fetchHistoricalData(subscribedSymbol);
                ws.send(JSON.stringify(chartData));
                userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null }); // 
                const bitmexWS = new ws_1.default(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
                bitmexWS.onmessage = (event) => {
                    const data = JSON.parse(event.data.toString());
                    if (data.table === 'trade') {
                        chartData = updateChartData(chartData, data.data[0]);
                        ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
                    }
                };
                userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS });
            }
            catch (error) {
                console.error("Error fetching historical data:", error);
            }
        }
    }));
    ws.on('close', () => {
        var _a;
        (_a = userSymbolMap.get(ws).bitmexWS) === null || _a === void 0 ? void 0 : _a.close();
        userSymbolMap.delete(ws);
        console.log('Client disconnected');
    });
}));
//@ts-ignore
function updateChartData(chartData, newTradeData) {
    const newTrade = newTradeData;
    const firstCandle = chartData[0];
    const newTradeTime = new Date(newTrade === null || newTrade === void 0 ? void 0 : newTrade.timestamp);
    const firstCandleTime = new Date(firstCandle === null || firstCandle === void 0 ? void 0 : firstCandle.timestamp);
    if ((newTradeTime === null || newTradeTime === void 0 ? void 0 : newTradeTime.getUTCFullYear()) === (firstCandleTime === null || firstCandleTime === void 0 ? void 0 : firstCandleTime.getUTCFullYear()) &&
        (newTradeTime === null || newTradeTime === void 0 ? void 0 : newTradeTime.getUTCMonth()) === (firstCandleTime === null || firstCandleTime === void 0 ? void 0 : firstCandleTime.getUTCMonth()) &&
        (newTradeTime === null || newTradeTime === void 0 ? void 0 : newTradeTime.getUTCDate()) === (firstCandleTime === null || firstCandleTime === void 0 ? void 0 : firstCandleTime.getUTCDate())) {
        firstCandle.high = Math.max(firstCandle.high, newTrade.price);
        firstCandle.low = Math.min(firstCandle.low, newTrade.price);
        firstCandle.close = newTrade.price;
        firstCandle.volume += newTrade.size || 0;
    }
    else {
        const newCandle = {
            timestamp: newTrade === null || newTrade === void 0 ? void 0 : newTrade.timestamp,
            open: newTrade === null || newTrade === void 0 ? void 0 : newTrade.price,
            high: newTrade === null || newTrade === void 0 ? void 0 : newTrade.price,
            low: newTrade === null || newTrade === void 0 ? void 0 : newTrade.price,
            close: newTrade === null || newTrade === void 0 ? void 0 : newTrade.price,
            volume: (newTrade === null || newTrade === void 0 ? void 0 : newTrade.size) || 0,
        };
        chartData.unshift(newCandle);
        if (chartData.length > 30) {
            chartData.pop();
        }
    }
    return chartData;
}
