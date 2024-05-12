import axios from 'axios';
import express from 'express';
import WebSocket from 'ws';
import InsrtumentsRoute from './route/activeInstrument'
import cors from 'cors';

const app = express();

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use('/api', InsrtumentsRoute)

const server = app.listen(8000, () => {
    console.log('Server listening on port 8000');
})

const userSymbolMap = new Map(); 

async function fetchHistoricalData(symbol: string) {
  try {
    const response = await axios.get(`https://www.bitmex.com/api/v1/trade/bucketed?binSize=1d&partial=0&symbol=${symbol}&count=30&reverse=true`);
    return response.data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return []; 
  }
}

const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
    let subscribedSymbol = 'ETHUSD';
  
    // Fetch initial historical data
    let chartData = await fetchHistoricalData(subscribedSymbol);
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null });
    ws.send(JSON.stringify(chartData));
   
    const bitmexWS = new WebSocket(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
  bitmexWS.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());
   
    if (data.table === 'trade') {
      chartData = updateChartData(chartData, data.data[0]);
      ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
    }
  };

  
    userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS });
  
  
    ws.on('message', async (message) => {
      const { newSymbol } = JSON.parse(message.toString());
      if (newSymbol !== subscribedSymbol) {
        userSymbolMap.get(ws).bitmexWS?.close(); 
  
        subscribedSymbol = newSymbol;
        
        try {
          chartData = await fetchHistoricalData(subscribedSymbol); 
          ws.send(JSON.stringify(chartData)); 
          userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS: null }); // 
          const bitmexWS = new WebSocket(`wss://ws.bitmex.com/realtime?subscribe=trade:${subscribedSymbol}`);
          bitmexWS.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
          

            if (data.table === 'trade') {
              chartData = updateChartData(chartData, data.data[0]);
              ws.send(JSON.stringify(chartData)); // <-- Send updated chartData here
            }
          };
          userSymbolMap.set(ws, { symbol: subscribedSymbol, chartData, bitmexWS }); 
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
    
      const newTrade = newTradeData; 
      const firstCandle = chartData[0]; 
      const newTradeTime = new Date(newTrade?.timestamp);
      const firstCandleTime = new Date(firstCandle?.timestamp);
  
      if (
        newTradeTime?.getUTCFullYear() === firstCandleTime?.getUTCFullYear() &&
        newTradeTime?.getUTCMonth() === firstCandleTime?.getUTCMonth() &&
        newTradeTime?.getUTCDate() === firstCandleTime?.getUTCDate()
      ) {
        
        firstCandle.high = Math.max(firstCandle.high, newTrade.price);
        firstCandle.low = Math.min(firstCandle.low, newTrade.price);
        firstCandle.close = newTrade.price;
        firstCandle.volume += newTrade.size || 0; 
      } else {
   
        const newCandle = {
          timestamp: newTrade?.timestamp,
          open: newTrade?.price,
          high: newTrade?.price,
          low: newTrade?.price,
          close: newTrade?.price,
          volume: newTrade?.size || 0,
        };
        chartData.unshift(newCandle); 
  
        if (chartData.length > 30) {
          chartData.pop(); 
        }
      }
  
    return chartData;
  }
  
  

