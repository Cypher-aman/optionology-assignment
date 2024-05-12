import {Router} from 'express'

const router = Router();

type Instrument = {
    symbol: string
}

const activeInstruments : any = []

router.get('/getActiveInstruments', async (req, res) => {
    try {
        if(activeInstruments.length === 0) {
            const res = await fetch('https://www.bitmex.com/api/v1/instrument/active')
            const data = await res.json();
            activeInstruments.push(data)
        }
        res.json(activeInstruments[0].slice(0, 10))
    }
        catch (error) {
            console.error("Error fetching active instruments:", error);
            res.send([]);
        }
})

router.get('/getSuggestions/:query', async (req, res) => {
   
    try {
        if(activeInstruments.length === 0) {
            const res = await fetch('https://www.bitmex.com/api/v1/instrument/active')
        const data = await res.json();
        activeInstruments.push(data)
        }
        
        const filteredSuggestions = activeInstruments[0]?.filter((entry : any) => {
            return entry?.symbol?.toLowerCase().includes(req.params.query.toLowerCase())
        }).map((entry: any) => entry.symbol);
        res.json(filteredSuggestions)
    } catch (error) {   
        console.error("Error fetching active instruments:", error);
        res.send([]);
        }

})

export default router