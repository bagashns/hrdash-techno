'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, { status: string, progress: number, error?: string, limitExceeded?: boolean }>>({});
  const [tierInfo, setTierInfo] = useState({ tier: 'guest', uploads: 0, limit: 1 });

  useEffect(() => {
    const cid = localStorage.getItem('hrdash_company_id');
    setCompanyId(cid);

    async function fetchJobAndCandidates() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Ambil data lowongan
        const { data: jobData } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (jobData) {
          setJob(jobData);
        } else {
          router.push('/dashboard');
          return;
        }

        // Ambil data kandidat
        const { data: candData } = await supabase
          .from('candidates')
          .select('*')
          .eq('job_id', jobId)
          .order('score', { ascending: false });
        
        if (candData) {
          setCandidates(candData);
        }

        // Ambil info tier & limit
        if (cid) {
          const { data: comp } = await supabase.from('companies').select('tier, total_uploads').eq('id', cid).single();
          const tier = comp?.tier || 'free';
          const uploads = comp?.total_uploads || 0;
          let limit = 5;
          if (tier === 'pro') limit = 50;
          if (tier === 'enterprise') limit = 10000;
          setTierInfo({ tier, uploads, limit });
        } else {
          // GUEST: Count candidates with null company_id for this job
          const { count } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).is('company_id', null).eq('job_id', jobId);
          setTierInfo({ tier: 'guest', uploads: count || 0, limit: 1 });
        }
      }
      setLoading(false);
    }
    
    if (jobId) {
      fetchJobAndCandidates();
    }
  }, [jobId, router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '');
        if ((encoded?.length || 0) % 4 > 0) {
          encoded += '='.repeat(4 - (encoded?.length || 0) % 4);
        }
        resolve(encoded || '');
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFiles = async () => {
    for (const file of files) {
      const fileId = file.name;
      setUploadStatuses((prev) => ({
        ...prev,
        [fileId]: { status: 'parsing', progress: 30 }
      }));

      try {
        const base64Data = await fileToBase64(file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            jobId: job.id,
            companyId: companyId,
            jobTitle: job.title,
            jobDescription: job.description
          }),
        });

        if (res.ok) {
          setUploadStatuses((prev) => ({
            ...prev,
            [fileId]: { status: 'success', progress: 100 }
          }));
        } else {
          const data = await res.json();
          setUploadStatuses((prev) => ({
            ...prev,
            [fileId]: { 
              status: 'error', 
              progress: 100, 
              error: data.error || 'Analisis gagal',
              limitExceeded: data.limitExceeded
            }
          }));
        }
      } catch (err) {
        setUploadStatuses((prev) => ({
          ...prev,
          [fileId]: { status: 'error', progress: 100, error: 'Network error' }
        }));
      }
    }
    
    // Refresh list kandidat
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (loading || !job) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
        <div className="text-slate-500 font-medium">Memuat Detail Lowongan...</div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] md:h-screen md:overflow-hidden bg-slate-50/50">
      {/* Topbar */}
      <div className="bg-white px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm select-none cursor-default">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <Link href="/dashboard" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">{job.title}</h1>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-md uppercase tracking-wider">AKTIF</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 max-w-2xl">{job.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 md:overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          
          {/* KOLOM KIRI: Upload */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 select-none cursor-default">
                <h3 className="text-base font-bold text-slate-900">Upload CV Kandidat</h3>
              </div>
              <label 
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 mb-4 border border-slate-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <div className="text-sm font-semibold text-slate-900 text-center select-none">Tarik & Letakkan Dokumen</div>
                <div className="text-xs text-slate-500 mt-1.5 text-center select-none">
                  Mendukung format PDF & DOCX
                </div>
                <input type="file" className="hidden" accept=".pdf,.docx" multiple onChange={handleFileSelect} />
              </label>

              {/* Usage Info */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-1.5 select-none cursor-default">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Penggunaan Paket {tierInfo.tier.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">
                    {tierInfo.uploads} / {tierInfo.limit} CV
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${tierInfo.uploads >= tierInfo.limit ? 'bg-red-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min((tierInfo.uploads / tierInfo.limit) * 100, 100)}%` }}
                  ></div>
                </div>
                {tierInfo.uploads >= tierInfo.limit && (
                  <div className="mt-2 text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Kuota penuh! <Link href="/pricing" className="underline hover:text-red-600">Upgrade sekarang</Link>
                  </div>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {files.map((file, idx) => {
                    const status = uploadStatuses[file.name] || { status: 'idle', progress: 0 };
                    return (
                      <div key={`${file.name}-${idx}`} className="flex flex-col p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-medium text-slate-800 truncate flex-1 pr-3" title={file.name}>{file.name}</div>
                          <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">{(file.size / 1024).toFixed(0)} KB</span>
                          {status.status === 'success' && <span className="text-emerald-600 font-bold">✓ Selesai</span>}
                          {status.status === 'parsing' && <span className="text-indigo-600 font-bold flex items-center gap-1"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menganalisis...</span>}
                          {status.status === 'error' && <span className="text-red-600 font-bold">⚠ Gagal</span>}
                        </div>
                        {status.status !== 'idle' && (
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                            <div 
                              className={`h-full transition-all duration-500 ease-out ${status.status === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button 
                onClick={processFiles}
                disabled={files.length === 0 || tierInfo.uploads >= tierInfo.limit}
                className="mt-5 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 select-none"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Mulai Analisis AI
              </button>
            </div>

          </div>

          {/* KOLOM KANAN: Leaderboard */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center select-none cursor-default">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  Peringkat Kandidat
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{candidates.length}</span>
                </h3>
              </div>
              
              {candidates.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center flex-1 select-none cursor-default">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h4 className="text-slate-900 font-semibold mb-1">Belum ada pelamar</h4>
                  <p className="text-sm text-slate-500 max-w-sm">Unggah dokumen CV kandidat pada panel di sebelah kiri untuk melihat hasil penilaian AI.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto">
                  {candidates.map((candidate, idx) => {
                    const isTopMatch = idx === 0 && candidate.score >= 80;
                    return (
                      <div key={candidate.id} className="p-5 sm:p-8 hover:bg-slate-50/50 transition-colors relative group select-none cursor-default">
                        {isTopMatch && (
                          <div className="absolute top-0 right-0 -mt-1 -mr-1">
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-bl-lg rounded-tr-xl shadow-sm uppercase tracking-wider">Top Match</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6 mb-6">
                          <div className="flex gap-4 sm:gap-5 items-start w-full md:w-auto">
                            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-sm shrink-0 ${
                              idx === 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' : 
                              idx === 1 ? 'bg-slate-800 text-white' : 
                              idx === 2 ? 'bg-slate-600 text-white' : 
                              'bg-white border border-slate-200 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight truncate">{candidate.nama || 'Nama Tidak Terbaca'}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs sm:text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-1.5 truncate"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {candidate.email || '-'}</span>
                                <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {candidate.telepon || '-'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full md:w-auto flex items-center md:flex-col justify-between md:justify-center md:text-right shrink-0 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 sm:px-5 sm:py-3 gap-2 md:gap-0">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest md:hidden">AI Match Score</div>
                            <div className={`text-2xl sm:text-3xl font-black ${candidate.score >= 80 ? 'text-emerald-600' : candidate.score >= 60 ? 'text-amber-500' : 'text-slate-700'}`}>
                              {candidate.score}<span className="text-sm sm:text-lg text-slate-400 font-medium">/100</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 hidden md:block">AI Match Score</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Pengalaman Terakhir
                            </div>
                            <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {candidate.pengalaman?.[0]?.posisi || 'Tidak ada data'}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {candidate.pengalaman?.[0]?.perusahaan || '-'}
                            </div>
                          </div>
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> Pendidikan Terakhir
                            </div>
                            <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {candidate.pendidikan?.[0]?.jenjang || 'Tidak ada data'}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {candidate.pendidikan?.[0]?.institusi || '-'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                          <div className="text-[11px] font-black text-indigo-800 mb-2 flex items-center gap-2 uppercase tracking-wider">
                            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            AI Insight & Reasoning
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">
                            {candidate.analysis_notes || 'Sistem tidak memberikan catatan spesifik.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
