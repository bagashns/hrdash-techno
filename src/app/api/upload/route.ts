import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { analyzeCVWithGemini } from '@/utils/gemini';

export const maxDuration = 60; // Izinkan proses Vercel hingga 60 detik jika di-deploy
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileData, fileName, mimeType, jobId, companyId, jobTitle, jobDescription } = body;

    if (!fileData || !jobId) {
      return NextResponse.json({ error: 'Data tidak lengkap (fileData / jobId hilang)' }, { status: 400 });
    }

    // --- CHECK LIMITS ---
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      if (!companyId) {
        // GUEST: Limit 1 CV per Job (for simplicity)
        const { count } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .is('company_id', null)
          .eq('job_id', jobId);
        
        if ((count || 0) >= 1) {
          return NextResponse.json({ 
            error: 'Batas Guest tercapai (1 CV). Silakan daftar gratis untuk upload hingga 5 CV!',
            limitExceeded: true 
          }, { status: 403 });
        }
      } else {
        // REGISTERED: Get tier and current count
        const { data: company } = await supabase
          .from('companies')
          .select('tier, total_uploads')
          .eq('id', companyId)
          .single();
        
        const tier = company?.tier || 'free';
        const uploads = company?.total_uploads || 0;
        
        let limit = 5; // Default FREE
        if (tier === 'pro') limit = 50;
        if (tier === 'enterprise') limit = 10000; // Large number for enterprise

        if (uploads >= limit) {
          return NextResponse.json({ 
            error: `Batas paket ${tier.toUpperCase()} tercapai (${limit} CV). Silakan upgrade paket Anda!`,
            limitExceeded: true
          }, { status: 403 });
        }
      }
    }
    // --------------------

    // 1. Ekstrak & Analisis menggunakan Gemini AI
    let parsedResult;
    try {
      parsedResult = await analyzeCVWithGemini(fileData, mimeType, fileName, jobTitle, jobDescription);
    } catch (err: any) {
      console.error('Gemini Error:', err.message || err);
      return NextResponse.json({ error: `Gagal memproses dengan Gemini AI: ${err.message || ''}` }, { status: 500 });
    }

    // 2. Simpan ke Supabase
    let candidateId = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            job_id: jobId,
            company_id: companyId,
            filename: fileName,
            nama: parsedResult.nama,
            email: parsedResult.email,
            telepon: parsedResult.telepon,
            pendidikan: parsedResult.pendidikan,
            pengalaman: parsedResult.pengalaman,
            skills: parsedResult.skills,
            score: parsedResult.score,
            analysis_notes: parsedResult.analysis_notes
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving to Supabase:', error);
        return NextResponse.json({ error: 'Gagal menyimpan ke database' }, { status: 500 });
      } else if (data) {
        candidateId = data.id;

        // 3. Increment upload count for company
        if (companyId) {
          const { data: currentComp } = await supabase.from('companies').select('total_uploads').eq('id', companyId).single();
          const newCount = (currentComp?.total_uploads || 0) + 1;
          await supabase.from('companies').update({ total_uploads: newCount }).eq('id', companyId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      id: candidateId,
      filename: fileName,
      parsed: parsedResult,
      scoring: { score: parsedResult.score }
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
