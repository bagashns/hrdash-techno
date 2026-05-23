
'use client';

import { AuthProvider } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <LoginModal />
    </AuthProvider>
  );
}
