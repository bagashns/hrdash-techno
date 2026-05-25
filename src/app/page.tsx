'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PricingPage from './pricing/page';

export default function RootPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('hrdash_company_id');
    if (id) {
      setIsLoggedIn(true);
      router.replace('/dashboard');
    } else {
      setIsLoggedIn(false);
    }
  }, [router]);

  if (isLoggedIn === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
          <div className="text-slate-500 font-medium">Memuat...</div>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return null; // Will redirect to /dashboard
  }

  return <PricingPage />;
}
