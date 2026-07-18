'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Settings, UserRound } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import RoleBadge from '@/components/ui/RoleBadge';
import { useAuth } from '@/hooks/useAuth';
import { getDisplayName, getInitials } from '@/lib/auth';
import { APP_ROUTES } from '@/constants/routes';
import notify from '@/lib/toast';

export default function Navbar({ onMenuClick, variant = 'admin' }) {
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    notify.success('Signed out successfully');
    router.replace(APP_ROUTES.LOGIN);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 glass">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {variant === 'admin' ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-secondary transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
          ) : null}

          <div className={variant === 'admin' ? 'lg:hidden' : ''}>
            <Logo size="sm" />
          </div>

          {variant === 'admin' ? (
            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-semibold text-primary">Admin Console</p>
              <p className="truncate text-[11px] text-muted">
                Car Rental Management System
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={menuRef}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white py-1.5 pr-3 pl-1.5 shadow-sm transition hover:border-slate-300"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent to-[var(--color-accent-hover)] text-xs font-semibold text-white">
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user)
              )}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-primary">
                {getDisplayName(user)}
              </span>
              <span className="block text-[11px] text-muted">{user?.email}</span>
            </span>
            <RoleBadge role={role} className="hidden md:inline-flex" />
          </motion.button>

          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-elevated)]"
                role="menu"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-medium text-primary">
                    {getDisplayName(user)}
                  </p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  {variant === 'admin' ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(APP_ROUTES.ADMIN.PROFILE);
                        }}
                      >
                        <UserRound size={16} />
                        Profile
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(APP_ROUTES.ADMIN.SETTINGS);
                        }}
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-danger transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
