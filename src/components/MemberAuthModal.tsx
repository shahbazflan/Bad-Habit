import React, { useState, useEffect } from 'react';
import { useMember } from '../context/MemberContext';

export const MemberAuthModal: React.FC = () => {
  const {
    member,
    isLoading,
    isMemberModalOpen,
    setIsMemberModalOpen,
    setIsWishlistOpen,
    justRegistered,
    clearJustRegistered,
    pendingWishlistProduct,
    clearPendingWishlistProduct,
    loginOrRegister,
    logoutMember,
  } = useMember();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isMemberModalOpen) return;
    setErrorMsg(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMemberModalOpen]);

  if (!isMemberModalOpen) return null;

  const handleClose = () => {
    setIsMemberModalOpen(false);
    clearJustRegistered();
    clearPendingWishlistProduct();
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText('BH-DETECTED');
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = await loginOrRegister({ email, phone, displayName });
    if (!result.ok) {
      setErrorMsg(result.error || 'Could not complete sign in.');
    }
  };

  const isFirstOrderAvailable = member ? !member.firstOrderDiscountUsed && member.orderCount === 0 : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-md animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="BAD HABIT Membership"
    >
      <div className="absolute inset-0 cursor-pointer" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#1c446c]/95 border border-white/30 backdrop-blur-2xl shadow-[0_24px_70px_rgba(4,24,43,0.55)] overflow-hidden text-white">
        {/* Top Banner */}
        <div className="px-6 py-5 border-b border-white/20 bg-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-[0.26em] uppercase text-cyan-200 font-semibold block">
              BAD HABIT CLUB
            </span>
            <h2 className="font-display text-xl font-black tracking-wide uppercase text-white mt-0.5">
              {member ? 'Member Pass' : 'Become a Member'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer outline-none"
            aria-label="Close membership dialog"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {member ? (
            /* SIGNED-IN MEMBER VIEW */
            <div className="space-y-5">
              {justRegistered && (
                <div className="p-3.5 rounded-2xl bg-emerald-400/20 border border-emerald-200/45 text-emerald-100 text-xs font-display leading-relaxed">
                  Welcome to BAD HABIT! Your membership is active and your first-order promo code is ready below.
                </div>
              )}

              {/* Promo Code Spotlight */}
              <div className="rounded-2xl bg-gradient-to-br from-sky-400/30 via-cyan-300/25 to-slate-900/40 border border-cyan-200/50 p-5 text-center shadow-inner">
                <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-cyan-100 block">
                  {isFirstOrderAvailable
                    ? 'FIRST ORDER BENEFIT · FLAT 10% OFF'
                    : 'FIRST ORDER BENEFIT REDEEMED'}
                </span>

                <div className="mt-3 flex items-center justify-center gap-2.5">
                  <span
                    className={`px-5 py-2.5 rounded-xl font-mono text-lg sm:text-xl font-black tracking-[0.14em] border ${
                      isFirstOrderAvailable
                        ? 'bg-slate-950/80 border-white/50 text-white shadow-md select-all'
                        : 'bg-slate-950/40 border-white/20 text-white/50 line-through'
                    }`}
                  >
                    BH-DETECTED
                  </span>

                  {isFirstOrderAvailable && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3.5 py-2.5 rounded-xl bg-white text-slate-900 font-display text-xs font-bold uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-white/85 font-display mt-3 leading-relaxed">
                  {isFirstOrderAvailable
                    ? 'Enter code BH-DETECTED at checkout to take 10% off your very first BAD HABIT order only.'
                    : `Redeemed${member.firstOrderNumber ? ` on order ${member.firstOrderNumber}` : ''}. The 10% BH-DETECTED discount applies on a member's first order only.`}
                </p>
              </div>

              {/* Member Identity Card */}
              <div className="rounded-2xl bg-white/[0.10] border border-white/20 p-4 space-y-2 text-xs font-display">
                <div className="flex items-center justify-between text-white/80">
                  <span className="uppercase tracking-wider text-[10px] text-white/60">Email</span>
                  <span className="font-semibold text-white">{member.email}</span>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="uppercase tracking-wider text-[10px] text-white/60">Phone</span>
                  <span className="font-semibold text-white">{member.phone}</span>
                </div>
                {member.displayName && (
                  <div className="flex items-center justify-between text-white/80">
                    <span className="uppercase tracking-wider text-[10px] text-white/60">Name</span>
                    <span className="font-semibold text-white">{member.displayName}</span>
                  </div>
                )}
              </div>

              {/* Wishlist Quick Link */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setIsWishlistOpen(true);
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-white text-slate-900 font-display text-sm font-bold tracking-wide uppercase hover:bg-white/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-98"
                >
                  <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>Open My Wishlist ({member.wishlist?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={logoutMember}
                  className="w-full py-2.5 text-xs font-mono uppercase tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* GUEST SIGN IN / JOIN VIEW */
            <div className="space-y-4">
              {/* Offer Highlight Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-cyan-400/25 via-sky-300/25 to-cyan-400/25 border border-cyan-200/45 p-4 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-white text-slate-950 font-display font-black text-[10px] tracking-[0.16em] uppercase mb-2">
                  FLAT 10% OFF FIRST ORDER ONLY
                </span>
                <p className="text-xs sm:text-[13px] font-display text-white leading-relaxed">
                  {pendingWishlistProduct
                    ? `Become a member to save "${pendingWishlistProduct.name}" to your wishlist and get a flat 10% off on your first order.`
                    : 'Become a member and get a flat 10% off on your first order.'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/75 border border-red-400/45 text-red-200 text-xs font-display">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="member-phone" className="block text-[11px] font-display font-bold uppercase tracking-wider text-white/90 mb-1.5">
                    Phone Number <span className="text-red-300">*</span>
                  </label>
                  <input
                    id="member-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    className="w-full px-4 py-3 rounded-2xl bg-black/35 focus:bg-black/50 text-white placeholder:text-white/50 border border-white/25 focus:border-white/65 focus:outline-none text-sm font-display"
                  />
                </div>

                <div>
                  <label htmlFor="member-email" className="block text-[11px] font-display font-bold uppercase tracking-wider text-white/90 mb-1.5">
                    Email Address <span className="text-red-300">*</span>
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-2xl bg-black/35 focus:bg-black/50 text-white placeholder:text-white/50 border border-white/25 focus:border-white/65 focus:outline-none text-sm font-display"
                  />
                </div>

                <div>
                  <label htmlFor="member-name" className="block text-[11px] font-display font-bold uppercase tracking-wider text-white/80 mb-1.5">
                    Full Name (Optional)
                  </label>
                  <input
                    id="member-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Hassan Ahmed"
                    className="w-full px-4 py-3 rounded-2xl bg-black/35 focus:bg-black/50 text-white placeholder:text-white/50 border border-white/25 focus:border-white/65 focus:outline-none text-sm font-display"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-full bg-white text-slate-900 font-display text-sm font-bold tracking-wider uppercase hover:bg-white/90 transition-all cursor-pointer shadow-[0_10px_28px_rgba(4,24,43,0.3)] active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? 'Activating Membership…' : 'JOIN AND GET A CODE'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
