'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function ReportHubCard({
  title,
  description,
  href,
  icon: Icon,
  tone = 'accent',
  delay = 0,
}) {
  const tones = {
    accent: 'from-blue-500/15 to-blue-500/5 text-accent',
    success: 'from-emerald-500/15 to-emerald-500/5 text-success',
    warning: 'from-amber-500/15 to-amber-500/5 text-warning',
    danger: 'from-rose-500/15 to-rose-500/5 text-danger',
    secondary: 'from-slate-500/15 to-slate-500/5 text-secondary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link
        href={href}
        className="surface-card group flex h-full flex-col p-5 transition hover:border-accent/30 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}
        >
          {Icon ? <Icon size={20} strokeWidth={1.9} aria-hidden /> : null}
        </div>
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent">
          Open report
          <ArrowRight
            size={13}
            className="transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </motion.div>
  );
}
