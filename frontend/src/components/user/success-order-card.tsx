'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function SuccessOrderCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 15 }}
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100"
      >
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </motion.div>
  );
}