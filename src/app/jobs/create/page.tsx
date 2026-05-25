'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function CreateJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [additionalCriteria, setAdditionalCriteria] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('hrdash_company_id');
    if (!id) {
      router.push('/login');
      return;
    }
    setCompanyId(id);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (title.trim().length < 3) {
      alert('Judul posisi terlalu pendek');
      return;
    }

    setIsSubmitting(true);

    const generatedDescription = `Mencari ${title.trim()}. ${additionalCriteria.trim() ? `Kriteria tambahan: ${additionalCriteria.trim()}.` : ''} AI akan melakukan pemindaian menyeluruh berdasarkan standar industri untuk posisi ini.`;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{ 
          company_id: companyId,
          title: title.trim(),
          description: generatedDescription
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Redirect back to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      alert('Gagal membuat lowongan: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (!companyId) return null;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] md:h-screen md:overflow-hidden bg-slate-50">
      {/* Topbar */}
      <div className="bg-white px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200 flex items-center sticky top-0 z-20 gap-4 sm:gap-5 shadow-sm select-none cursor-default">
        <Link href="/dashboard" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Buka Lowongan Baru</h1>
          <p className="text-slate-500 text-[10px] sm:text-xs font-medium">Buat kriteria posisi agar AI dapat menyeleksi kandidat secara presisi.</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm select-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 cursor-default">
                Nama Posisi Pekerjaan
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Senior Backend Engineer"
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50 hover:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 cursor-default">
                Kriteria Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={additionalCriteria}
                onChange={(e) => setAdditionalCriteria(e.target.value)}
                placeholder="Contoh: Pengalaman 3 tahun, S1 Informatika"
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white transition-colors sm:text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-4 mt-6">
              <Link href="/dashboard" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 transition-all select-none cursor-pointer">
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 select-none"
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Buka Lowongan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
