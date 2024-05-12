'use client';

import ReactApexChart from 'react-apexcharts';
import useWS from '@/hooks/useWS';
import { useEffect, useState } from 'react';
import { ApexChartCandle, convertBitmexToApex } from '@/utils/apexCandle';
import moment from 'moment';
import { candleStickOptions } from '@/constants/apexChartOptions';
import { signOut } from 'next-auth/react';

export default function Chart() {
  const [candleData, setCandleData] = useState<ApexChartCandle[]>([]);
  const [queary, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const { data, updateSubscribedSymbol } = useWS();

  // Fetch active instruments once when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queary);
    }, 500);
    return () => clearTimeout(timer);
  }, [queary]);

  useEffect(() => {
    async function fetchSuggestions() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/getSuggestions/${debouncedQuery}`
      );
      const data = await res.json();
      console.log({ data });
      setSuggestions(data)
    }

    if (debouncedQuery.length > 0) {
      fetchSuggestions();
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (data) {
      setCandleData(convertBitmexToApex(data));
    }
  }, [data]);

  return (
    <div className="text-white">
      <div className='flex items-center gap-10 p-4'>
        <h1 className="capitalize font-bold text-2xl ">{data?.[0]?.symbol}</h1>
        <div className='relative'>
          <input
            value={queary}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder='Search for an instrument'
            className="rounded bg-gray-300 text-black w-[250px] p-2 border border-black"
          />
          <div className="flex flex-col absolute max-h-[300px] overflow-y-auto rounded">
            {queary.length > 0 && suggestions.map((suggestion, index) => (
              <div
                className="bg-gray-300 border-b border-black cursor-pointer hover:bg-black hover:text-white z-10  text-black w-[250px] p-2"
                key={index}
                onClick={() => {
                  setQuery('');
                  updateSubscribedSymbol(suggestion);
                }}
              >
                {suggestion}
              </div>
            ))}

            {queary.length > 0 && suggestions.length === 0 && <div className="bg-gray-300 border-b border-black cursor-pointer hover:bg-black hover:text-white z-10  text-black w-[250px] p-2">No suggestions</div>}

          </div>
        </div>
        <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded self-end" onClick={() => signOut({ callbackUrl: '/'})}>Sign out</button>
      </div>
      <div className="flex md:flex-row flex-col gap-10 w-[90%] h-[70%]">
        <div className="text-black flex-1">
          <ReactApexChart
            series={[{ data: candleData }]}
            type="candlestick"
            options={candleStickOptions}
          />
        </div>
        <div className="flex flex-col p-4 min-w-max gap-2 border h-min border-white rounded">
          <p className="font-bold mb-2">
            {moment(data?.[0]?.timestamp).format('MMMM Do YYYY')}
          </p>

          <p className="">Symbol: <span className='font-semibold'> {data?.[0]?.symbol}</span></p>
          <p className="">Volume:<span className='font-semibold'>  {data?.[0]?.volume}</span></p>
          <p className="">Open: <span className='font-semibold'> {data?.[0]?.open}</span></p>
          <p className="">Close:<span className='font-semibold'>  {data?.[0]?.close}</span></p>
          <p className="">High: <span className='font-semibold'> {data?.[0]?.high}</span></p>
          <p className="">Low: <span className='font-semibold'> {data?.[0]?.low}</span></p>
        </div>
      </div>
    </div>
  );
}
