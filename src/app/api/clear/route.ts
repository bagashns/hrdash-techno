import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Menghapus semua baris dari tabel candidates untuk memastikan privasi (Auto-Wipe)
      const { error } = await supabase
        .from('candidates')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error auto-wiping Supabase:', error);
        return NextResponse.json({ error: 'Gagal mengosongkan database' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Database telah dikosongkan untuk privasi' });
  } catch (error: any) {
    console.error('API Clear Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
