'use client';

import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layouts/bottom-nav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell min-h-screen px-4 pb-28 pt-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {children}
      </motion.div>
      <BottomNav />
    </div>
  );
}