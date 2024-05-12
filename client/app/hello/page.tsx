'use client'

import { useEffect, useState } from 'react'

export default function Hellow ( ) {  
  
    const [wss, setWss] = useState<WebSocket | null>(null)
    const [subscribedSymbol, setSubscribedSymbol] = useState('XBTUSD')
  
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/');

        
      
        ws.onmessage = (event) => {
          console.log(event.data); // Should log "Hello" every 2 seconds
        };
      setWss(ws)
        return () => ws.close();
      }, [])

      const updateSubscribedSymbol = () => {
        if (wss?.readyState === WebSocket.OPEN) { // Check if WebSocket is open
          wss.send(JSON.stringify({ newSymbol: subscribedSymbol })); 
        } else {
          console.error('WebSocket connection is not open');
        }
      }

      return <div>
        <input type="text" value={subscribedSymbol} onChange={(e) => setSubscribedSymbol(e.target.value)} />
        <button onClick={updateSubscribedSymbol}>Subscribe</button>
      </div>

}