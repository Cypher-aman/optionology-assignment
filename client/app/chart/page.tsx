import Chart from "@/components/Chart";
import Unauthorized from "@/components/Unauthorized";
import { getServerSession } from "next-auth";
import {signIn} from 'next-auth/react'

export default async function ChartPage() {
    const session =  await getServerSession();

    if (!session?.user) {
        return (
           <Unauthorized />
        );
    }

    return (
        <main>
            <Chart />
        </main>
    );
}