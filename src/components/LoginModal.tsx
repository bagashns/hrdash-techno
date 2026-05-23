
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isLoginModalOpen) {
      setCompanyName('');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(false);
      setShowPassword(false);
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (companyName.trim().length < 3) {
      setErrorMsg('Nama perusahaan harus diisi minimal 3 karakter!');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }

    setIsLoading(true);
    const nameToSave = companyName.trim();

    try {
      // Check if company exists
      let { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, password')
        .ilike('name', nameToSave)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (isLogin) {
        if (!company) {
          setErrorMsg('Akun belum terdaftar.');
          setIsLoading(false);
          return;
        }
        
        if (company.password && company.password !== password) {
          setErrorMsg('Kata sandi salah.');
          setIsLoading(false);
          return;
        }
      } else {
        if (company) {
          setErrorMsg('Perusahaan sudah terdaftar.');
          setIsLoading(false);
          return;
        }

        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert([{ 
            name: nameToSave, 
            password: password, 
            tier: 'free' 
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        company = newCompany;
        setSuccessMsg('Berhasil! Mengarahkan...');
      }

      localStorage.setItem('hrdash_company_id', company.id);
      localStorage.setItem('hrdash_company', company.name);
      
      // Close modal and refresh page to update UI
      closeLoginModal();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeLoginModal}
      ></div>
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-[10000] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                HR
              </div>
              <div className="font-black text-2xl tracking-tight text-slate-900">
                HR<span className="text-indigo-600">Dash</span>
              </div>
            </div>
            <button 
              onClick={closeLoginModal}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 select-none cursor-default">
            {isLogin ? 'Selamat Datang' : 'Daftar Perusahaan'}
          </h2>
          <p className="text-sm text-slate-500 mb-8 font-medium select-none cursor-default">
            {isLogin ? 'Masuk untuk mengelola portal rekrutmen Anda.' : 'Mulailah revolusi rekrutmen perusahaan Anda hari ini.'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold rounded-2xl flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[13px] font-bold rounded-2xl flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest select-none cursor-default">Nama Perusahaan</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder-slate-300"
                placeholder="Contoh: PT. Teknologi Nusantara"
              />
            </div>


            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest select-none cursor-default">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLogin ? 'Masuk Sekarang' : 'Daftar Perusahaan'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100 select-none">
            <p className="text-xs font-bold text-slate-400">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-indigo-600 hover:text-indigo-700 transition-colors underline-offset-4 hover:underline"
              >
                {isLogin ? 'Daftar Sekarang' : 'Masuk Sekarang'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
