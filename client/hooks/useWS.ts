import {useState, useEffect} from 'react'

interface BitmexCandle {
    timestamp: string;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    trades: number;
    volume: number;
    vwap: number;
    lastSize: number;
    turnover: number;
    homeNotional: number;
    foreignNotional: number;
  }
  

export default function useWS () {
    const [wss, setWss] = useState<WebSocket | null>(null)
    const [data, setData] = useState<BitmexCandle[]>([])    
  
    useEffect(() => {
        const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_SOCKET_URL}`);

        ws.onmessage = (event) => {
        //   console.log(event.data);
          setData(JSON.parse(event.data));
        };
      setWss(ws)
        return () => ws.close();
      }, [])

      const updateSubscribedSymbol = (subscribedSymbol: string) => {
        if (wss?.readyState === WebSocket.OPEN) { // Check if WebSocket is open
          wss.send(JSON.stringify({ newSymbol: subscribedSymbol })); 
        } else {
          console.error('WebSocket connection is not open');
        }
      }

      return {data, updateSubscribedSymbol}

    }