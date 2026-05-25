'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function TalentPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCandidates = async () => {
      const companyId = localStorage.getItem('hrdash_company_id');
      if (!companyId) {
        router.push('/');
        return;
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { data, error } = await supabase
          .from('candidates')
          .select('*, jobs(title)')
          .eq('company_id', companyId)
          .order('score', { ascending: false });

        if (data) {
          setCandidates(data);
        }
      }
      setLoading(false);
    };

    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = c.nama?.toLowerCase().includes(q);
    const emailMatch = c.email?.toLowerCase().includes(q);
    const skillMatch = c.skills?.some((s: string) => s.toLowerCase().includes(q));
    const jobMatch = c.jobs?.title?.toLowerCase().includes(q);
    return nameMatch || emailMatch || skillMatch || jobMatch;
  });

  return (
    <div className="flex-1 flex flex-col md:h-screen bg-slate-50/50 md:overflow-hidden">
      <div className="bg-white px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center sticky top-0 z-10 shadow-sm">
        <div className="select-none cursor-default">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Database Talent</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">Jelajahi seluruh profil kandidat yang pernah melamar di perusahaan Anda.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            placeholder="Cari nama, email, atau skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:overflow-y-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
              <div className="text-slate-500 font-medium">Memuat Database...</div>
            </div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 p-16 shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight select-none cursor-default">Tidak Ada Kandidat</h3>
            <p className="text-slate-500 mb-0 max-w-md mx-auto leading-relaxed text-sm select-none cursor-default">
              {searchQuery ? 'Pencarian tidak menemukan hasil yang cocok.' : 'Belum ada kandidat di database Anda.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold select-none cursor-default">
                    <th className="px-6 py-4">Kandidat</th>
                    <th className="px-6 py-4">Lowongan</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Pengalaman</th>
                    <th className="px-6 py-4 text-center">Skor AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate) => {
                    const isTopMatch = candidate.score >= 80;
                    return (
                      <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group select-none cursor-default">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${isTopMatch ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-300'}`}>
                              {candidate.nama ? candidate.nama.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                {candidate.nama || 'Tanpa Nama'}
                                {isTopMatch && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Top Match</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {candidate.jobs?.title || 'Unknown Job'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-slate-900">{candidate.email || '-'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{candidate.telepon || '-'}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-slate-900 line-clamp-1 max-w-[200px]" title={candidate.pengalaman?.[0]?.posisi}>
                            {candidate.pengalaman?.[0]?.posisi || '-'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">
                            {candidate.pengalaman?.[0]?.perusahaan || ''}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${isTopMatch ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : candidate.score >= 60 ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-slate-200 text-slate-600 bg-slate-50'} font-black text-lg`}>
                            {candidate.score}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
