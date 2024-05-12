import SigninBtn from "@/components/SigninBtn"
import SignoutBtn from "@/components/SignoutBtn"
import { getServerSession } from "next-auth"

export default async function Home() {
  const session = await getServerSession()

  if(!session) {
    return <main>
      <SigninBtn/>
    </main>
  }
  console.log(session)
  return <main>
    <SignoutBtn/>
    <h1>{session.user?.name}</h1>
  </main>
    
}
