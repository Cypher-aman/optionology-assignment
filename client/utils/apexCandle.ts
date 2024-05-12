import moment from "moment";

interface BitmexCandle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }
  
 export interface ApexChartCandle {
    x: Date | number;
    y: [number, number, number, number]; // [open, high, low, close]
  }
  
 export function convertBitmexToApex(bitmexData: BitmexCandle[]): ApexChartCandle[] {
    return bitmexData.map(candle => {
      const timestamp = moment(candle.timestamp).valueOf();
      return {
        x: timestamp, // Use Date object or timestamp (in milliseconds)
        y: [candle.open, candle.high, candle.low, candle.close],
      };
    });
  }

  function formatTimestampForChart(timestamp: string): string {
    const date = new Date(timestamp);
    const day = date.getUTCDate(); 
    const month = date.toLocaleString('default', { month: 'short' });  
    return `${day} ${month}`;
  }