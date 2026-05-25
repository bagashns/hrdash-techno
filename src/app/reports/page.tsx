'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    avgScore: 0,
    topTalents: 0,
  });
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      const companyId = localStorage.getItem('hrdash_company_id');
      if (!companyId) {
        router.push('/');
        return;
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Fetch jobs with candidates
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, candidates(id, score)')
          .eq('company_id', companyId);

        if (jobsData) {
          let totalCands = 0;
          let totalScore = 0;
          let topTalentsCount = 0;
          const jobsStats = jobsData.map((job: any) => {
            const candCount = job.candidates ? job.candidates.length : 0;
            totalCands += candCount;

            if (job.candidates) {
              job.candidates.forEach((c: any) => {
                totalScore += c.score || 0;
                if (c.score >= 80) topTalentsCount++;
              });
            }

            return {
              id: job.id,
              title: job.title,
              count: candCount,
            };
          });

          // Sort by applicant count
          jobsStats.sort((a: any, b: any) => b.count - a.count);

          setStats({
            totalJobs: jobsData.length,
            totalCandidates: totalCands,
            avgScore: totalCands > 0 ? Math.round(totalScore / totalCands) : 0,
            topTalents: topTalentsCount,
          });
          setTopJobs(jobsStats.slice(0, 5)); // top 5
        }
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] md:h-screen md:overflow-hidden bg-slate-50">
      <div className="bg-white px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="select-none cursor-default">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Laporan AI</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">Lihat ringkasan kinerja rekrutmen dan wawasan yang dihasilkan oleh AI.</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 md:overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
              <div className="text-slate-500 font-medium">Memuat Laporan...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group select-none cursor-default">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mb-1 select-none cursor-default">{stats.totalJobs}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider select-none cursor-default">Total Lowongan</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group select-none cursor-default">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mb-1 select-none cursor-default">{stats.totalCandidates}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider select-none cursor-default">Kandidat Diproses</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group select-none cursor-default">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div className="text-3xl font-black text-emerald-600 tracking-tight mb-1 select-none cursor-default">{stats.avgScore}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider select-none cursor-default">Rata-rata Skor AI</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group select-none cursor-default">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  </div>
                  <div className="text-3xl font-black text-amber-500 tracking-tight mb-1 select-none cursor-default">{stats.topTalents}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider select-none cursor-default">Top Match (&gt;80)</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-8">
              {/* Top Jobs by Applicants */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <h3 className="font-black text-slate-900 flex items-center gap-2 mb-8 select-none cursor-default">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Top Lowongan Berdasarkan Pelamar
                </h3>

                {topJobs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm select-none cursor-default">Belum ada data pelamar.</div>
                ) : (
                  <div className="space-y-6">
                    {topJobs.map((job, idx) => {
                      const maxCount = Math.max(...topJobs.map(j => j.count), 1);
                      const percentage = (job.count / maxCount) * 100;
                      return (
                        <div key={job.id}>
                          <div className="flex justify-between items-end mb-2">
                            <div className="font-semibold text-slate-800 text-sm select-none cursor-default">{job.title}</div>
                            <div className="font-bold text-indigo-600 text-sm select-none cursor-default">{job.count} Kandidat</div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
