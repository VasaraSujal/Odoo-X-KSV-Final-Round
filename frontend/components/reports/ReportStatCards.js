'use client';

import StatCard from '@/components/dashboard/StatCard';

export default function ReportStatCards({ cards = [], loading = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          {...card}
          loading={loading}
          delay={index * 0.04}
        />
      ))}
    </div>
  );
}
