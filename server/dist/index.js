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
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.send('Hello World!');
});
const server = app.listen(8000, () => {
    console.log('Server listening on port 8000');
});
const userSymbolMap = new Map();
function fetchHistoricalData(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://www.bitmex.com/api/v1/trade/bucketed?binSize=1d&partial=false&symbol=${symbol}&count=2&reverse=true`);
            return response.data;
        }
        catch (error) {
            console.error("Error fetching historical data:", error);
            return []; // Return empty array if error
        }
    });
}
const wss = new ws_1.default.Server({ server });
wss.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    let subscribedSymbol = 'XBTUSD';
    // Fetch initial historical data
    let chartData = yield fetchHistoricalData(subscribedSymbol);
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null });
    ws.send(JSON.stringify(chartData));
    console.log({ before: JSON.stringify(chartData) });
    // Send the new data
    // Subscribe to the initial symbol immediately upon connection. 
    const bitmexWS = new ws_1.default(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
    bitmexWS.onmessage = (event) => {
        const data = JSON.parse(event.data.toString());
        console.log({ before: userSymbolMap });
        // console.log({after: data})
        // console.log({data: data?.table === 'trade' ? data?.data : 'no data'})
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
            // Unsubscribe from the previous symbol
            (_a = userSymbolMap.get(ws).bitmexWS) === null || _a === void 0 ? void 0 : _a.close();
            subscribedSymbol = newSymbol;
            // Fetch new historical data
            try {
                chartData = yield fetchHistoricalData(subscribedSymbol);
                ws.send(JSON.stringify(chartData));
                // Send the new data
                // Update userSymbolMap with new connection
                userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null }); // Reset bitmexWS here
                // Subscribe to new symbol
                const bitmexWS = new ws_1.default(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
                bitmexWS.onmessage = (event) => {
                    const data = JSON.parse(event.data.toString());
                    // console.log({after: data})
                    // console.log({data: data?.table === 'trade' ? data?.data : 'no data'})
                    console.log({ after: userSymbolMap });
                    if (data.table === 'trade') {
                        chartData = updateChartData(chartData, data.data[0]);
                        ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
                    }
                };
                // Update userSymbolMap with new connection
                userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS }); // Update with new bitmexWS
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
    // console.log({chartData, newTradeData})
    // Check if it's an update for the current day's (partial) candle
    // Handle new trades for the current day or a new day
    const newTrade = newTradeData;
    const firstCandle = chartData[0]; // Get the first candle (current day)
    const newTradeTime = new Date(newTrade.timestamp);
    const firstCandleTime = new Date(firstCandle.timestamp);
    if (newTradeTime.getUTCFullYear() === firstCandleTime.getUTCFullYear() &&
        newTradeTime.getUTCMonth() === firstCandleTime.getUTCMonth() &&
        newTradeTime.getUTCDate() === firstCandleTime.getUTCDate()) {
        // Update existing candle
        firstCandle.high = Math.max(firstCandle.high, newTrade.price);
        firstCandle.low = Math.min(firstCandle.low, newTrade.price);
        firstCandle.close = newTrade.price;
        firstCandle.volume += newTrade.size || 0;
    }
    else {
        // New candle for a new day
        const newCandle = {
            timestamp: newTrade.timestamp,
            open: newTrade.price,
            high: newTrade.price,
            low: newTrade.price,
            close: newTrade.price,
            volume: newTrade.size || 0,
        };
        chartData.unshift(newCandle); // Add new candle to the beginning
        // Maintain 30-day window (remove oldest if needed)
        if (chartData.length > 30) {
            chartData.pop(); // Remove the last (oldest) candle
        }
    }
    return chartData;
}
