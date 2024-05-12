'use client'

import { signOut } from "next-auth/react"

export default function SignoutBtn() {
    return (
        <button
            onClick={() => signOut()}
            className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
        >
            Sign out
        </button>
    )
} 