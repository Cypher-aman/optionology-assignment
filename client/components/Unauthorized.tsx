'use client'

import { signIn } from "next-auth/react"

export default function Unauthorized() {
    return (
        <main className="flex text-white min-h-screen flex-col items-center justify-center gap-10 p-24">
        <h1>Unauthorized</h1>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => signIn('google')}>Sign in</button>
    </main>
    )
}