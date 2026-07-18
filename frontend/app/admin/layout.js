'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import RoleGuard from '@/components/common/RoleGuard';
import { ROLES } from '@/constants/roles';
import categoryService from '@/services/categoryService';

const COLLAPSE_KEY = 'crms_admin_sidebar_collapsed';

/** Warm shared GET caches so list/filter pages feel faster after first visit. */
function prefetchAdminLookups() {
  Promise.allSettled([
    categoryService.getAll(),
  ]).catch(() => {});
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) prefetchAdminLookups();
    };

    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 600);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  function handleCollapseToggle() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <RoleGuard allow={ROLES.ADMIN}>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onCollapseToggle={handleCollapseToggle}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${
            collapsed
              ? 'lg:pl-[var(--sidebar-collapsed)]'
              : 'lg:pl-[var(--sidebar-width)]'
          }`}
        >
          <Navbar
            variant="admin"
            onMenuClick={() => setMobileOpen(true)}
          />

          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>

          <Footer />
        </div>
      </div>
    </RoleGuard>
  );
}
