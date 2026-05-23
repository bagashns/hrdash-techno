'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const tiers = [
  {
    name: 'Registered',
    price: 'Free',
    description: 'Dapatkan lebih banyak akses dengan mendaftarkan perusahaan Anda.',
    features: [
      '5x Upload CV',
      'Penyimpanan Database Talent',
      'Laporan Dashboard',
      'Dukungan Komunitas'
    ],
    buttonText: 'Daftar Gratis',
    buttonHref: '/login',
    highlight: false,
    tierId: 'free'
  },
  {
    name: 'Pro',
    price: '$5',
    period: '/bulan',
    description: 'Pilihan terbaik untuk startup yang sedang berkembang pesat.',
    features: [
      '50x Upload CV / Bulan',
      'Analisis AI Prioritas',
      'Export Laporan ke PDF',
      'Dukungan Email 24/7'
    ],
    buttonText: 'Upgrade ke Pro',
    buttonHref: '#',
    highlight: true,
    tierId: 'pro'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Solusi skala besar untuk perusahaan dengan volume rekrutmen tinggi.',
    features: [
      'Akses Tanpa Batas',
      '$0.5 per 10 CV tambahan',
      'Integrasi API Kustom',
      'Dedicated Account Manager'
    ],
    buttonText: 'Hubungi Sales',
    buttonHref: '#',
    highlight: false,
    tierId: 'enterprise'
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState('guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { openLoginModal } = useAuth();

  useEffect(() => {
    const id = localStorage.getItem('hrdash_company_id');
    if (id) {
      setIsLoggedIn(true);
      setCurrentTier('free'); // Default for registered users
    }
  }, []);

  const handleUpgrade = async (tier: any) => {
    if (tier.tierId === 'free' || tier.tierId === 'guest') {
      openLoginModal();
      return;
    }

    if (tier.tierId === 'enterprise') {
      window.location.href = 'mailto:sales@hrdash.ai';
      return;
    }

    // PRO TIER Logic
    const companyId = localStorage.getItem('hrdash_company_id');
    const companyName = localStorage.getItem('hrdash_company') || 'Perusahaan';

    if (!companyId) {
      openLoginModal();
      return;
    }

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          amount: 75000, // Misal $5 = Rp 75.000
          tierName: tier.name
        })
      });

      const data = await response.json();
      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function(result: any) {
            console.log('success', result);
            router.push('/dashboard?payment=success');
          },
          onPending: function(result: any) {
            console.log('pending', result);
            alert('Pembayaran sedang diproses.');
          },
          onError: function(result: any) {
            console.log('error', result);
            alert('Pembayaran gagal.');
          },
          onClose: function() {
            console.log('customer closed the popup without finishing the payment');
          }
        });
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Top Navbar for Guests (since Sidebar is hidden) */}
      {!isLoggedIn && (
        <nav className="bg-white/80 backdrop-blur-md px-8 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3 select-none cursor-default">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-sm">HR</div>
            <div className="font-black text-lg tracking-tight text-slate-900">HR<span className="text-indigo-600">Dash</span></div>
          </div>
          <button 
            onClick={openLoginModal}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm cursor-pointer select-none"
          >
            Masuk ke Akun
          </button>
        </nav>
      )}

      {/* Header Section - Only show for guests as a Landing Page */}
      {!isLoggedIn ? (
        <div className={`pt-20 pb-16 px-8 bg-white border-b border-slate-200 relative overflow-hidden`}>
          {/* Background Accents */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-tr from-purple-50/30 to-transparent"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-6 animate-in slide-in-from-bottom-2 duration-500 select-none cursor-default">
              Platform Rekrutmen AI Terbaik
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700 select-none cursor-default">
              Seleksi Ratusan CV <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Hanya dalam Detik.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-10 animate-in slide-in-from-bottom-6 duration-1000 select-none cursor-default">
              Gunakan kecerdasan buatan untuk menemukan kandidat terbaik tanpa harus membaca tumpukan resume secara manual. Pilih paket yang sesuai untuk mulai sekarang.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 duration-1000">
              <button 
                onClick={openLoginModal}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 group select-none cursor-pointer"
              >
                Daftar Perusahaan Sekarang
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-12 pb-8 px-8 bg-white border-b border-slate-200 select-none cursor-default">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paket & Harga</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Upgrade paket Anda untuk mendapatkan akses fitur AI yang lebih bertenaga.</p>
          </div>
        </div>
      )}

      {/* Tiers Grid */}
      <div className="max-w-6xl mx-auto px-8 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div 
              key={tier.tierId}
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 select-none cursor-default ${
                tier.highlight 
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 ring-1 ring-indigo-500 z-10' 
                  : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 shadow-sm'
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                  Rekomendasi
                </div>
              )}

              <div className="mb-8 select-none cursor-default">
                <h3 className="text-sm font-black mb-4 tracking-wider text-slate-400 uppercase">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black tracking-tight text-slate-900">{tier.price}</span>
                  {tier.period && <span className="text-sm font-bold text-slate-400">{tier.period}</span>}
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-500 min-h-[40px]">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <div className="h-px bg-slate-100 w-full mb-6"></div>
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 mt-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleUpgrade(tier)}
                className={`w-full py-3.5 rounded-xl text-sm font-black text-center transition-all ${
                  tier.highlight 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
