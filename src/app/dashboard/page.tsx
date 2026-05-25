'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const router = useRouter();
  const { openLoginModal } = useAuth();

  useEffect(() => {
    const name = localStorage.getItem('hrdash_company');
    const id = localStorage.getItem('hrdash_company_id');
    
    if (!name || !id) {
      router.push('/');
      return;
    }
    
    setCompanyName(name);
    setCompanyId(id);

    async function fetchJobs() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Fetch jobs with candidate count
        const { data, error } = await supabase
          .from('jobs')
          .select('*, candidates(count)')
          .eq('company_id', id)
          .order('created_at', { ascending: false });
        
        if (data) {
          setJobs(data);
        } else if (error) {
          console.error("Error fetching jobs:", error);
        }
      }
      setLoading(false);
    }
    
    fetchJobs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hrdash_company');
    localStorage.removeItem('hrdash_company_id');
    window.location.href = '/dashboard';
  };

  if (!companyName) return null;

  return (
    <div className="flex-1 flex flex-col md:h-screen bg-slate-50/50 md:overflow-hidden">
      {/* Topbar */}
      <div className="bg-white px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center sticky top-0 z-10 shadow-sm">
        <div className="select-none cursor-default">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Manajemen Lowongan</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">Kelola posisi pekerjaan yang sedang aktif dan temukan kandidat terbaik.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
          {companyId ? (
            <button onClick={handleLogout} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider select-none cursor-pointer">
              Logout
            </button>
          ) : (
            <button 
              onClick={openLoginModal} 
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-wider cursor-pointer select-none outline-none"
            >
              Masuk
            </button>
          )}
          <Link href="/jobs/create" className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] flex items-center gap-2 cursor-pointer select-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Buka Lowongan
          </Link>
        </div>
      </div>

      <div className="flex-1 md:overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 h-48 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                    <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="w-3/4 h-5 bg-slate-100 rounded mb-3"></div>
                  <div className="w-full h-4 bg-slate-100 rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm max-w-2xl mx-auto mt-10 select-none cursor-default">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Belum Ada Lowongan Aktif</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">Mulai perjalanan rekrutmen Anda dengan membuka lowongan pertama. Biarkan sistem AI kami membantu Anda menyeleksi kandidat terbaik.</p>
              <Link href="/jobs/create" className="inline-flex px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]">
                Buat Lowongan Pertama
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                  <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                    {/* Decorative background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wider">
                        Aktif
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors relative z-10 tracking-tight select-none">{job.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 relative z-10 leading-relaxed select-none">
                      {job.description}
                    </p>
                    
                    <div className="pt-5 border-t border-slate-100 flex justify-between items-center relative z-10 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none select-none">Total Pelamar</span>
                          <span className="text-sm font-bold text-slate-900 select-none">{job.candidates[0]?.count || 0} Kandidat</span>
                        </div>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
