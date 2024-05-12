'use client';

import { signIn } from 'next-auth/react';
import {Session} from 'next-auth';
import { useRouter } from 'next/navigation';

export default function HomeBtn({session}: {session: Session | null}) {
  const router = useRouter();
  
  const handleContinue = () => {
    if(session?.user) {
      router.push('/chart')
    } else {
      signIn('google', {callbackUrl: '/chart'})
    }
  }
  return (
    <button
      onClick={() => handleContinue()}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Continue to Chart
    </button>
  );
}
