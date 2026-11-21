import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMember } from '../context/MemberContext';
import { isValidPhoneNumber, normalizePhoneToE164 } from '../utils/phone';

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
    updateMemberProfile,
    logoutMember,
  } = useMember();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Signed-in contact edit state (enforces 1-phone-per-account on profile updates)
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsMemberModalOpen(false);
    setIsEditingContact(false);
    setEditError(null);
    setEditSuccess(null);
    clearJustRegistered();
    clearPendingWishlistProduct();
  }, [setIsMemberModalOpen, clearJustRegistered, clearPendingWishlistProduct]);

  useEffect(() => {
    if (!isMemberModalOpen) return;
    setErrorMsg(null);
    setEditError(null);
    setEditSuccess(null);
    setIsEditingContact(false);
    if (member) {
      setEditPhone(member.phone || '');
      setEditName(member.displayName || '');
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMemberModalOpen, member, handleClose]);

  if (!isMemberModalOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText('BH-DETECTED');
    } catch {
      // Clipboard API fallback ignored cleanly
    }
    setCopiedCode(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopiedCode(false);
      copyTimerRef.current = null;
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanedEmail = email.trim().toLowerCase();
    const e164Phone = normalizePhoneToE164(phone);

    if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!isValidPhoneNumber(e164Phone)) {
      setErrorMsg('Please enter a valid mobile number (e.g. 0300 1234567 or +92 300 1234567).');
      return;
    }

    const result = await loginOrRegister({
      email: cleanedEmail,
      phone: e164Phone,
      displayName: displayName.trim(),
    });
    if (!result.ok) {
      setErrorMsg(result.error || 'Could not complete sign in.');
    }
  };

  const handleSaveProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    const e164Phone = normalizePhoneToE164(editPhone);
    if (!isValidPhoneNumber(e164Phone)) {
      setEditError('Please enter a valid mobile number (e.g. 0300 1234567 or +92 300 1234567).');
      return;
    }

    const result = await updateMemberProfile({
      phone: e164Phone,
      displayName: editName.trim(),
    });
    if (!result.ok) {
      setEditError(result.error || 'Could not update profile.');
      return;
    }

    setEditSuccess('Contact details updated.');
    setIsEditingContact(false);
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
              <div className="rounded-2xl bg-white/[0.10] border border-white/20 p-4 space-y-2.5 text-xs font-display">
                <div className="flex items-center justify-between text-white/80">
                  <span className="uppercase tracking-wider text-[10px] text-white/60">Email</span>
                  <span className="font-semibold text-white truncate ml-2">{member.email}</span>
                </div>

                {!isEditingContact ? (
                  <>
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
                    {editSuccess && (
                      <p className="text-[11px] text-emerald-200 font-display pt-1">{editSuccess}</p>
                    )}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhone(member.phone || '');
                          setEditName(member.displayName || '');
                          setEditError(null);
                          setEditSuccess(null);
                          setIsEditingContact(true);
                        }}
                        className="text-[11px] font-mono uppercase tracking-wider text-cyan-200 hover:text-white underline cursor-pointer"
                      >
                        Update Phone / Name
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveProfileUpdate} className="space-y-2.5 pt-1 border-t border-white/15">
                    {editError && (
                      <div className="p-2.5 rounded-xl bg-red-950/75 border border-red-400/45 text-red-200 text-[11px] font-display">
                        {editError}
                      </div>
                    )}
                    <div>
                      <label htmlFor="member-edit-phone" className="block text-[10px] font-display uppercase tracking-wider text-white/75 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="member-edit-phone"
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+923001234567"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/35 focus:bg-black/50 text-white placeholder:text-white/50 border border-white/25 focus:border-white/65 focus:outline-none text-xs font-display"
                      />
                    </div>
                    <div>
                      <label htmlFor="member-edit-name" className="block text-[10px] font-display uppercase tracking-wider text-white/75 mb-1">
                        Full Name
                      </label>
                      <input
                        id="member-edit-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Optional display name"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/35 focus:bg-black/50 text-white placeholder:text-white/50 border border-white/25 focus:border-white/65 focus:outline-none text-xs font-display"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingContact(false);
                          setEditError(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 text-[11px] font-mono uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 font-display text-[11px] font-bold uppercase tracking-wider hover:bg-white/90 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
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
                  className="w-full py-3 px-4.5 selected-reveal-capsule font-grotesk text-white text-[15px] font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
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
                <span className="inline-block px-3 py-0.5 glass-capsule font-grotesk text-white font-black text-[11px] tracking-[0.16em] uppercase mb-2">
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
                  className="w-full py-3 px-5 selected-reveal-capsule font-grotesk text-white text-[15px] font-bold tracking-wider uppercase transition-all cursor-pointer active:scale-98 disabled:opacity-50"
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
