import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
const Midtrans = require('midtrans-client');

export async function POST(request: Request) {
  try {
    const { companyId, companyName, amount, tierName } = await request.json();

    if (!companyId || !amount) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Initialize Midtrans Snap
    let snap = new Midtrans.Snap({
      isProduction: false, // Set to true for production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const orderId = `ORDER-${companyId.substring(0, 8)}-${Date.now()}`;

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: companyName,
        email: `${companyId}@hrdash.ai` // Placeholder email
      },
      item_details: [
        {
          id: tierName.toLowerCase(),
          price: amount,
          quantity: 1,
          name: `HRDash ${tierName} Subscription`
        }
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?status=success`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?status=error`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?status=pending`
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Save orderId to company record for webhook tracking
    await supabase.from('companies').update({ last_transaction_id: orderId }).eq('id', companyId);
    
    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId
    });

  } catch (error: any) {
    console.error('Midtrans Create Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat transaksi' }, { status: 500 });
  }
}
