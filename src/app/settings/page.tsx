'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function SettingsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchCompany = async () => {
      const id = localStorage.getItem('hrdash_company_id');
      if (!id) {
        setName('Guest');
        setLoading(false);
        return;
      }
      setCompanyId(id);

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          setName(data.name);
        }
      }
      setLoading(false);
    };

    fetchCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    const updates: any = { name: name.trim() };
    if (newPassword.trim().length > 0) {
      if (newPassword.length < 4) {
        setMessage({ type: 'error', text: 'Password baru minimal 4 karakter.' });
        setSaving(false);
        return;
      }
      updates.password = newPassword.trim();
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;
      
      localStorage.setItem('hrdash_company', name.trim());
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
      setNewPassword(''); // clear password field after save
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hrdash_company');
    localStorage.removeItem('hrdash_company_id');
    window.location.href = '/dashboard';
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-200 rounded-full"></div>
        <div className="text-slate-500 font-medium">Memuat Pengaturan...</div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen bg-slate-50/50 overflow-hidden">
      <div className="bg-white px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="select-none cursor-default">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">Konfigurasikan profil perusahaan dan preferensi keamanan Anda.</p>
        </div>
      </div>
      
      <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto flex-1 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 select-none cursor-default">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
              Detail Perusahaan
            </h2>

            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2 select-none cursor-default ${message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {message.type === 'error' 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 max-w-xl">
              <div className="select-none">
                <label className="block text-sm font-bold text-slate-900 mb-2 cursor-default">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm select-text cursor-text"
                />
              </div>

              <div className="select-none">
                <label className="block text-sm font-bold text-slate-900 mb-2 cursor-default">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak ingin mengubah"
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors sm:text-sm select-text cursor-text"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-sm disabled:opacity-70 flex items-center gap-2 select-none cursor-pointer"
                >
                  {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
          
          <div className="p-8 border-t border-slate-100 flex items-center justify-center bg-slate-50/30">
            <button
              onClick={handleLogout}
              className="px-8 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 font-bold text-sm transition-all shadow-sm w-full max-w-xs select-none cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
