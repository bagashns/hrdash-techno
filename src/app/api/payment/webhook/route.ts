import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
const Midtrans = require('midtrans-client');

export async function POST(request: Request) {
  try {
    const notification = await request.json();

    let snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const statusResponse = await snap.transaction.notification(notification);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Parsing companyId from orderId (ORDER-companyIdPart-timestamp)
    const parts = orderId.split('-');
    const companyIdPart = parts[1]; // Note: This might be partial if companyId was long

    console.log(`Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud Status: ${fraudStatus}`);

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        // TODO: handle challenge
      } else if (fraudStatus == 'accept') {
        // Success
        await upgradeCompany(orderId);
      }
    } else if (transactionStatus == 'settlement') {
      // Success
      await upgradeCompany(orderId);
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      // Failure
    } else if (transactionStatus == 'pending') {
      // Pending
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function upgradeCompany(orderId: string) {
  // Extract info from orderId or use metadata if passed via Midtrans
  // For now, let's assume we can find the company that made this transaction
  // In a real app, you should store the orderId in a 'transactions' table first
  
  // Try to find the company by last_transaction_id (if we saved it during creation)
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('last_transaction_id', orderId)
    .single();

  if (company) {
    // Upgrade to PRO
    const subEnd = new Date();
    subEnd.setMonth(subEnd.getMonth() + 1); // 1 month from now

    await supabase
      .from('companies')
      .update({
        tier: 'pro',
        subscription_end: subEnd.toISOString()
      })
      .eq('id', company.id);
    
    console.log(`Company ${company.id} upgraded to PRO via webhook.`);
  } else {
    console.warn(`Webhook: Company not found for orderId ${orderId}`);
  }
}
