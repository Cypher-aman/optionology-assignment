import axios from 'axios';
import express from 'express';
import WebSocket from 'ws';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
})

const server = app.listen(8000, () => {
    console.log('Server listening on port 8000');
})

const userSymbolMap = new Map(); 

async function fetchHistoricalData(symbol: string) {
  try {
    const response = await axios.get(`https://www.bitmex.com/api/v1/trade/bucketed?binSize=1d&partial=false&symbol=${symbol}&count=2&reverse=true`);
    return response.data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return []; // Return empty array if error
  }
}

const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
    let subscribedSymbol = 'XBTUSD';
  
    // Fetch initial historical data
    let chartData = await fetchHistoricalData(subscribedSymbol);
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null });
    ws.send(JSON.stringify(chartData));
    console.log({before: JSON.stringify(chartData)})
     // Send the new data
  
    // Subscribe to the initial symbol immediately upon connection. 
    const bitmexWS = new WebSocket(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
  bitmexWS.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());
    console.log({before: userSymbolMap})
    // console.log({after: data})
    // console.log({data: data?.table === 'trade' ? data?.data : 'no data'})
    if (data.table === 'trade') {
      chartData = updateChartData(chartData, data.data[0]);
      ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
    }
  };

  
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS });
  
  
    ws.on('message', async (message) => {
      const { newSymbol } = JSON.parse(message.toString());
      if (newSymbol !== subscribedSymbol) {
        // Unsubscribe from the previous symbol
        userSymbolMap.get(ws).bitmexWS?.close(); 
  
        subscribedSymbol = newSymbol;
        
        // Fetch new historical data
        try {
          chartData = await fetchHistoricalData(subscribedSymbol); 
          ws.send(JSON.stringify(chartData)); 
        // Send the new data
          
          // Update userSymbolMap with new connection
          userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null }); // Reset bitmexWS here
  
          // Subscribe to new symbol
          const bitmexWS = new WebSocket(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
          bitmexWS.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            // console.log({after: data})
            // console.log({data: data?.table === 'trade' ? data?.data : 'no data'})
    console.log({after: userSymbolMap})

            if (data.table === 'trade') {
              chartData = updateChartData(chartData, data.data[0]);
              ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
            }
          };
  
          // Update userSymbolMap with new connection
          userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS }); // Update with new bitmexWS
        } catch (error) {
          console.error("Error fetching historical data:", error);
        }
      }
    }); 
  
    ws.on('close', () => {
      userSymbolMap.get(ws).bitmexWS?.close();
      userSymbolMap.delete(ws);
      console.log('Client disconnected');
    });
  });
  

//@ts-ignore
function updateChartData(chartData, newTradeData) {
    // console.log({chartData, newTradeData})
    // Check if it's an update for the current day's (partial) candle
      // Handle new trades for the current day or a new day
      const newTrade = newTradeData; 
      const firstCandle = chartData[0]; // Get the first candle (current day)
      const newTradeTime = new Date(newTrade.timestamp);
      const firstCandleTime = new Date(firstCandle.timestamp);
  
      if (
        newTradeTime.getUTCFullYear() === firstCandleTime.getUTCFullYear() &&
        newTradeTime.getUTCMonth() === firstCandleTime.getUTCMonth() &&
        newTradeTime.getUTCDate() === firstCandleTime.getUTCDate()
      ) {
        // Update existing candle
        firstCandle.high = Math.max(firstCandle.high, newTrade.price);
        firstCandle.low = Math.min(firstCandle.low, newTrade.price);
        firstCandle.close = newTrade.price;
        firstCandle.volume += newTrade.size || 0; 
      } else {
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
  
  

