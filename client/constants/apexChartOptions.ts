export const candleStickOptions = {
    chart: {
      type: 'candlestick',
    },
    title: {
      text: 'CandleStick Chart',
      align: 'left',
    },
    xaxis: {
      type: 'datetime',
      tooltip: {
        enabled: true,
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  
    layout: {
      backgroundColor: '#ffffff', // Set background color
      textColor: '#333333', // Set text color
    },
    grid: {
      vertLines: {
        color: '#eeeeee', // Set vertical grid lines color
      },
      horzLines: {
        color: '#eeeeee', // Set horizontal grid lines color
      },
    },
    priceScale: {
      borderVisible: false,
    },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
    },
  };