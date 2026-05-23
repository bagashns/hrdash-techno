'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, { status: string, progress: number, error?: string }>>({});
  const [jobDescription, setJobDescription] = useState<string>('');
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return <div className="p-12 text-center text-slate-500">Mengarahkan ke dashboard...</div>;
}
