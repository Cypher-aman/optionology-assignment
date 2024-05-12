import HomeBtn from "@/components/HomeBtn"
import SigninBtn from "@/components/SigninBtn"
import SignoutBtn from "@/components/SignoutBtn"
import { getServerSession } from "next-auth"


export default async function Home() {
  const session = await getServerSession()
  let symbols = []
  try {
    const res = await fetch('http://localhost:8000/api/getActiveInstruments')
   symbols = await res.json()
  } catch (error) {
    console.error("Error fetching active instruments:", error);
  }

  return <main className="flex text-white min-h-screen flex-col items-center justify-center gap-10 p-24">
    <div className="flex flex-col justify-center items-center gap-5">
    <h1 className="text-7xl font-bold font-mono text-white">Chart Buddy</h1>
    <span>Get all the data you need</span></div>
    <div className="relative flex overflow-x-hidden max-w-[80%]">
      <div className="py-12 flex gap-2 animate-marquee whitespace-nowrap">
        {symbols.map((symbol, index) => (
          <div key={index} className="ticker-item flex items-center px-4 py-2 bg-gray-800 text-white rounded-md mr-4"> 
            <span className="symbol-name font-bold">{symbol.symbol}</span>
            <span className="symbol-price ml-2">{symbol.lastPrice.toFixed(2)}</span>
          </div>
        ))}
        </div>
        {/* Duplicate items for infinite scrolling */}
        <div className="absolute flex gap-2 top-0 py-12 animate-marquee2 whitespace-nowrap">
        {symbols.map((symbol, index) => (
          <div key={index + symbols.length} className="ticker-item flex items-center px-4 py-2 bg-gray-800 text-white rounded-md mr-4">
            <span className="symbol-name font-bold">{symbol.symbol}</span>
            <span className="symbol-price ml-2">${symbol.lastPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
        <HomeBtn session={session} />
  </main>
    
}
