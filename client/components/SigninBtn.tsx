'use client'

import { signIn } from "next-auth/react"

export default function SigninBtn() {
    return (
        <button
            onClick={() => signIn("google")}
            className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
        >
            Sign in with Google
        </button>
    )
}