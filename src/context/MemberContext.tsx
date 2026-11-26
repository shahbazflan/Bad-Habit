import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Product } from '../data/products';

let firebaseModulePromise: Promise<typeof import('../firebase')> | null = null;
const loadFirebase = () => {
  if (!firebaseModulePromise) {
    firebaseModulePromise = import('../firebase');
  }
  return firebaseModulePromise;
};
import { isValidPhoneNumber, normalizePhoneToE164 } from '../utils/phone';
import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  sanitizeMemberProfile,
  sanitizeWishlistItems,
} from '../utils/runtimeSafety';

export interface WishlistItem {
  productId: string;
  name: string;
  price: string;
  image: string;
  category: string;
  addedAt: string;
}

const buildWishlistEntry = (product: Product): WishlistItem => ({
  productId: product.id,
  name: product.name,
  price: product.price,
  image: product.image,
  category: product.category,
  addedAt: new Date().toISOString(),
});

export interface MemberProfile {
  id: string;
  email: string;
  phone: string;
  displayName?: string;
  promoCode: string;
  orderCount: number;
  firstOrderDiscountUsed: boolean;
  firstOrderNumber?: string | null;
  wishlist: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface MemberContextType {
  member: MemberProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isMemberModalOpen: boolean;
  setIsMemberModalOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  justRegistered: boolean;
  clearJustRegistered: () => void;
  pendingWishlistProduct: Product | null;
  clearPendingWishlistProduct: () => void;
  loginOrRegister: (params: {
    email: string;
    phone: string;
    displayName?: string;
    mode?: 'register' | 'signin';
  }) => Promise<{ ok: boolean; isNewMember?: boolean; error?: string }>;
  updateMemberProfile: (params: {
    phone?: string;
    displayName?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logoutMember: () => Promise<void>;
  refreshMember: () => Promise<void>;
  syncMemberSnapshot: (updated: MemberProfile | null | undefined) => void;
  hasOrderedIdentity: (params: { email?: string; phone?: string; memberId?: string }) => boolean;
  recordOrderedIdentity: (params: { email?: string; phone?: string; memberId?: string }) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistItems: WishlistItem[];
  toggleWishlist: (product: Product) => Promise<void>;
  removeWishlistItem: (productId: string) => Promise<void>;
  wishlistLoadingId: string | null;
  wishlistNotice: string | null;
  clearWishlistNotice: () => void;
}

const MemberContext = createContext<MemberContextType | null>(null);

const MEMBER_STORAGE_KEY = 'bad_habit_member_v1';
const WISHLIST_STORAGE_KEY = 'bad_habit_wishlist_v1';
const ORDERED_IDENTITIES_KEY = 'bad_habit_ordered_identities_v1';

const normEmail = (raw?: string) => String(raw || '').trim().toLowerCase();
const normPhone = (raw?: string) => normalizePhoneToE164(raw);

interface OrderedIdentityLedger {
  emails: string[];
  phones: string[];
  memberIds: string[];
}

function readOrderedLedger(): OrderedIdentityLedger {
  const parsed = safeStorageGet<Record<string, unknown> | null>(ORDERED_IDENTITIES_KEY, null);
  if (!parsed || typeof parsed !== 'object') {
    return { emails: [], phones: [], memberIds: [] };
  }
  const emails = Array.isArray(parsed.emails)
    ? parsed.emails.filter((e): e is string => typeof e === 'string' && e.length > 0).map(normEmail)
    : [];
  const phones = Array.isArray(parsed.phones)
    ? parsed.phones.filter((p): p is string => typeof p === 'string' && p.length > 0).map(normPhone).filter(Boolean)
    : [];
  const memberIds = Array.isArray(parsed.memberIds)
    ? parsed.memberIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  return { emails, phones, memberIds };
}

export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [member, setMember] = useState<MemberProfile | null>(() =>
    sanitizeMemberProfile(safeStorageGet<unknown>(MEMBER_STORAGE_KEY, null))
  );

  const [guestWishlist, setGuestWishlist] = useState<WishlistItem[]>(() =>
    sanitizeWishlistItems(safeStorageGet<unknown>(WISHLIST_STORAGE_KEY, []))
  );

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState<Product | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);

  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const refreshAbortRef = useRef<AbortController | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const sessionAbortRef = useRef<AbortController | null>(null);
  const profileAbortRef = useRef<AbortController | null>(null);
  const wishlistAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }
      refreshAbortRef.current?.abort();
      sessionAbortRef.current?.abort();
      profileAbortRef.current?.abort();
      wishlistAbortRef.current?.abort();
    };
  }, []);

  const showWishlistNotice = useCallback((msg: string) => {
    if (!mountedRef.current) return;
    setWishlistNotice(msg);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setWishlistNotice(null);
      }
      noticeTimerRef.current = null;
    }, 2600);
  }, []);

  const persistGuestWishlist = useCallback((next: WishlistItem[]) => {
    const clean = sanitizeWishlistItems(next);
    setGuestWishlist(clean);
    safeStorageSet(WISHLIST_STORAGE_KEY, clean);
  }, []);

  const hasOrderedIdentity = useCallback(
    ({ email, phone, memberId }: { email?: string; phone?: string; memberId?: string }) => {
      const ledger = readOrderedLedger();
      const e = normEmail(email);
      const p = normPhone(phone);
      const id = String(memberId || '').trim();
      return Boolean(
        (e && ledger.emails.includes(e)) ||
          (p && ledger.phones.includes(p)) ||
          (id && ledger.memberIds.includes(id))
      );
    },
    []
  );

  const persistMember = useCallback(
    (rawNext: MemberProfile | null) => {
      let next = sanitizeMemberProfile(rawNext);
      if (next && hasOrderedIdentity({ email: next.email, phone: next.phone, memberId: next.id })) {
        next = {
          ...next,
          firstOrderDiscountUsed: true,
          orderCount: Math.max(1, Number(next.orderCount || 0)),
        };
      }
      setMember(next);
      if (next) {
        safeStorageSet(MEMBER_STORAGE_KEY, next);
      } else {
        safeStorageRemove(MEMBER_STORAGE_KEY);
      }
    },
    [hasOrderedIdentity]
  );

  const recordOrderedIdentity = useCallback(
    ({ email, phone, memberId }: { email?: string; phone?: string; memberId?: string }) => {
      const ledger = readOrderedLedger();
      const e = normEmail(email);
      const p = normPhone(phone);
      const id = String(memberId || '').trim();
      if (e && !ledger.emails.includes(e)) ledger.emails.push(e);
      if (p && !ledger.phones.includes(p)) ledger.phones.push(p);
      if (id && !ledger.memberIds.includes(id)) ledger.memberIds.push(id);
      safeStorageSet(ORDERED_IDENTITIES_KEY, ledger);

      setMember((prev) => {
        if (!prev) return prev;
        const matchesPrev =
          (e && normEmail(prev.email) === e) ||
          (p && normPhone(prev.phone) === p) ||
          (id && prev.id === id);
        if (!matchesPrev) return prev;
        const updated: MemberProfile = {
          ...prev,
          firstOrderDiscountUsed: true,
          orderCount: Math.max(1, Number(prev.orderCount || 0)),
        };
        safeStorageSet(MEMBER_STORAGE_KEY, updated);
        return updated;
      });
    },
    []
  );

  // Lazily attach Firebase Auth listener only when a member session exists or member modal opens
  const authSubscribedRef = useRef(false);
  const ensureFirebaseAuthListener = useCallback(() => {
    if (authSubscribedRef.current || typeof window === 'undefined') return;
    authSubscribedRef.current = true;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.all([loadFirebase(), import('firebase/auth')])
      .then(([{ auth }, { onAuthStateChanged }]) => {
        if (!active || !mountedRef.current) return;
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (mountedRef.current) {
            setFirebaseUser(user);
          }
        });
      })
      .catch(() => {
        authSubscribedRef.current = false;
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!isMemberModalOpen) return;
    return ensureFirebaseAuthListener();
  }, [isMemberModalOpen, ensureFirebaseAuthListener]);

  // Hydrate persisted member profile from backend (deduplicated & cancellable)
  const refreshMember = useCallback(async () => {
    if (!member) return;
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshAbortRef.current?.abort();
    const controller = new AbortController();
    refreshAbortRef.current = controller;

    const run = (async () => {
      try {
        const res = await fetch('/api/members/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            memberId: member.id,
            email: member.email,
            phone: normPhone(member.phone),
            clientPriorOrderUsed: hasOrderedIdentity({
              memberId: member.id,
              email: member.email,
              phone: member.phone,
            }),
          }),
        });
        if (res.ok && mountedRef.current) {
          const data = await res.json().catch(() => null);
          if (data?.success && data.member && mountedRef.current) {
            persistMember(data.member);
          }
        }
      } catch {
        // Keep existing cached profile on network/abort errors
      } finally {
        if (refreshAbortRef.current === controller) {
          refreshAbortRef.current = null;
          refreshPromiseRef.current = null;
        }
      }
    })();

    refreshPromiseRef.current = run;
    return run;
  }, [member?.id, member?.email, member?.phone, hasOrderedIdentity, persistMember]);

  useEffect(() => {
    if (!member?.id || typeof window === 'undefined') return;
    const runDeferredRefresh = () => {
      if (!mountedRef.current) return;
      void refreshMember();
      ensureFirebaseAuthListener();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(runDeferredRefresh, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(runDeferredRefresh, 700);
    return () => globalThis.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMemberSnapshot = useCallback(
    (updated: MemberProfile | null | undefined) => {
      if (updated && updated.id) {
        persistMember(updated);
      }
    },
    [persistMember]
  );

  const addWishlistInternal = useCallback(
    async (activeMember: MemberProfile, product: Product) => {
      const entry = buildWishlistEntry(product);
      const currentWishlist = Array.isArray(activeMember.wishlist) ? activeMember.wishlist : [];
      const optimisticMember: MemberProfile = {
        ...activeMember,
        wishlist: [entry, ...currentWishlist.filter((w) => w.productId !== product.id)],
        updatedAt: entry.addedAt,
      };
      persistMember(optimisticMember);
      showWishlistNotice(`${product.name} added to your wishlist`);
      setWishlistLoadingId(product.id);

      wishlistAbortRef.current?.abort();
      const controller = new AbortController();
      wishlistAbortRef.current = controller;

      try {
        const res = await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            memberId: activeMember.id,
            email: activeMember.email,
            phone: normPhone(activeMember.phone),
            displayName: activeMember.displayName,
            productId: product.id,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!mountedRef.current) return;

        if (res.status === 409) {
          persistMember(activeMember);
          showWishlistNotice(data?.error || 'This phone number belongs to another account.');
          return;
        }

        if (res.ok && data?.success && data.member) {
          const sanitizedServer = sanitizeMemberProfile(data.member);
          if (sanitizedServer) {
            setMember((latest) => {
              if (!latest || latest.id !== sanitizedServer.id) {
                persistMember(sanitizedServer);
                return sanitizedServer;
              }
              const serverList: WishlistItem[] = Array.isArray(sanitizedServer.wishlist)
                ? sanitizedServer.wishlist
                : [];
              const mergedIds = new Set(serverList.map((w) => w.productId));
              const localExtras = (latest.wishlist || []).filter((w) => !mergedIds.has(w.productId));
              const mergedMember: MemberProfile = {
                ...sanitizedServer,
                wishlist: [...localExtras, ...serverList],
              };
              safeStorageSet(MEMBER_STORAGE_KEY, mergedMember);
              return mergedMember;
            });
          }

          if (firebaseUser) {
            void loadFirebase()
              .then(({ auth, syncFirebaseWishlistItem }) => {
                if (!auth.currentUser) return;
                return syncFirebaseWishlistItem({
                  uid: auth.currentUser.uid,
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  category: product.category,
                  action: 'add',
                });
              })
              .catch(() => {});
          }
        }
      } catch {
        // Optimistic local state already persisted unless aborted cleanly
      } finally {
        if (mountedRef.current) {
          setWishlistLoadingId(null);
        }
      }
    },
    [persistMember, showWishlistNotice]
  );

  const loginOrRegister = useCallback(
    async ({
      email,
      phone,
      displayName,
      mode = 'register',
    }: {
      email: string;
      phone: string;
      displayName?: string;
      mode?: 'register' | 'signin';
    }): Promise<{ ok: boolean; isNewMember?: boolean; error?: string }> => {
      const normalizedEmail = normEmail(email);
      const normalizedPhone = normPhone(phone);

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { ok: false, error: 'Please enter a valid email address.' };
      }
      if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
        return {
          ok: false,
          error: 'Please enter a valid mobile number (e.g. 03001234567 or +923001234567).',
        };
      }

      sessionAbortRef.current?.abort();
      const controller = new AbortController();
      sessionAbortRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch('/api/members/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            email: normalizedEmail,
            phone: normalizedPhone,
            displayName: displayName?.trim() || undefined,
            mode,
            clientPriorOrderUsed: hasOrderedIdentity({ email: normalizedEmail, phone: normalizedPhone }),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!mountedRef.current) return { ok: false };

        if (!res.ok || !data?.success || !data.member) {
          return {
            ok: false,
            error:
              data?.error ||
              'Could not complete member registration. Please verify your email and phone number.',
          };
        }

        const savedMember = sanitizeMemberProfile(data.member);
        if (!savedMember) {
          return { ok: false, error: 'Received an invalid member profile response.' };
        }

        if (firebaseUser) {
          try {
            const { auth, syncFirebaseMemberProfile } = await loadFirebase();
            if (auth.currentUser) {
              await syncFirebaseMemberProfile({
                uid: auth.currentUser.uid,
                email: savedMember.email,
                phone: savedMember.phone,
                displayName: savedMember.displayName,
                orderCount: savedMember.orderCount,
                firstOrderDiscountUsed: savedMember.firstOrderDiscountUsed,
              });
            }
          } catch (fbErr) {
            if (fbErr instanceof Error && fbErr.message.includes('Already registered')) {
              return { ok: false, error: fbErr.message };
            }
          }
        }

        const existingServerIds = new Set((savedMember.wishlist || []).map((w) => w.productId));
        const unsyncedGuestItems = guestWishlist.filter((w) => !existingServerIds.has(w.productId));
        const mergedSavedMember: MemberProfile =
          unsyncedGuestItems.length > 0
            ? { ...savedMember, wishlist: [...unsyncedGuestItems, ...(savedMember.wishlist || [])] }
            : savedMember;

        persistMember(mergedSavedMember);
        if (unsyncedGuestItems.length > 0) {
          persistGuestWishlist([]);
          void Promise.allSettled(
            unsyncedGuestItems.map((gItem) =>
              fetch('/api/wishlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  memberId: mergedSavedMember.id,
                  email: mergedSavedMember.email,
                  phone: mergedSavedMember.phone,
                  displayName: mergedSavedMember.displayName,
                  productId: gItem.productId,
                  dryRun: true,
                }),
              })
            )
          );
        }

        setJustRegistered(Boolean(data.isNewMember));

        if (pendingWishlistProduct) {
          const itemToSave = pendingWishlistProduct;
          setPendingWishlistProduct(null);
          await addWishlistInternal(mergedSavedMember, itemToSave);
        }

        return { ok: true, isNewMember: Boolean(data.isNewMember) };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return { ok: false, error: 'Request was cancelled. Please try again.' };
        }
        return { ok: false, error: 'Network error while connecting to member service.' };
      } finally {
        if (sessionAbortRef.current === controller) {
          sessionAbortRef.current = null;
        }
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [
      persistMember,
      hasOrderedIdentity,
      guestWishlist,
      persistGuestWishlist,
      pendingWishlistProduct,
      addWishlistInternal,
    ]
  );

  const updateMemberProfile = useCallback(
    async ({
      phone,
      displayName,
    }: {
      phone?: string;
      displayName?: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      if (!member) {
        return { ok: false, error: 'Please sign in first to update your profile.' };
      }

      const normalizedPhone = phone !== undefined ? normPhone(phone) : undefined;
      if (normalizedPhone !== undefined && (!normalizedPhone || !isValidPhoneNumber(normalizedPhone))) {
        return {
          ok: false,
          error: 'Please enter a valid mobile number (e.g. 03001234567 or +923001234567).',
        };
      }

      profileAbortRef.current?.abort();
      const controller = new AbortController();
      profileAbortRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch('/api/members/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            memberId: member.id,
            email: member.email,
            phone: normalizedPhone,
            displayName: displayName !== undefined ? displayName.trim() : undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!mountedRef.current) return { ok: false };

        if (!res.ok || !data?.success || !data.member) {
          return {
            ok: false,
            error: data?.error || 'Could not update your profile details.',
          };
        }

        const updated = sanitizeMemberProfile(data.member);
        if (!updated) {
          return { ok: false, error: 'Invalid response received while saving profile.' };
        }

        if (firebaseUser) {
          try {
            const { auth, syncFirebaseMemberProfile } = await loadFirebase();
            if (auth.currentUser) {
              await syncFirebaseMemberProfile({
                uid: auth.currentUser.uid,
                email: updated.email,
                phone: updated.phone,
                displayName: updated.displayName,
                orderCount: updated.orderCount,
                firstOrderDiscountUsed: updated.firstOrderDiscountUsed,
              });
            }
          } catch (fbErr) {
            if (fbErr instanceof Error && fbErr.message.includes('Already registered')) {
              return { ok: false, error: fbErr.message };
            }
          }
        }

        persistMember(updated);
        return { ok: true };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return { ok: false, error: 'Profile update was cancelled.' };
        }
        return { ok: false, error: 'Network error while updating profile.' };
      } finally {
        if (profileAbortRef.current === controller) {
          profileAbortRef.current = null;
        }
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [member, firebaseUser, persistMember]
  );

  const logoutMember = useCallback(async () => {
    refreshAbortRef.current?.abort();
    sessionAbortRef.current?.abort();
    profileAbortRef.current?.abort();
    persistMember(null);
    setJustRegistered(false);
    setPendingWishlistProduct(null);
    if (!firebaseUser) return;
    try {
      const [{ auth }, { signOut }] = await Promise.all([loadFirebase(), import('firebase/auth')]);
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Ignore signOut errors
    }
  }, [firebaseUser, persistMember]);

  const wishlistItems = React.useMemo(
    () => (member ? member.wishlist || [] : guestWishlist),
    [member, guestWishlist]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistItems.some((item) => item.productId === productId),
    [wishlistItems]
  );

  const removeWishlistItem = useCallback(
    async (productId: string) => {
      if (!member) {
        persistGuestWishlist(guestWishlist.filter((w) => w.productId !== productId));
        return;
      }

      const optimisticMember: MemberProfile = {
        ...member,
        wishlist: (member.wishlist || []).filter((w) => w.productId !== productId),
        updatedAt: new Date().toISOString(),
      };
      persistMember(optimisticMember);
      setWishlistLoadingId(productId);

      wishlistAbortRef.current?.abort();
      const controller = new AbortController();
      wishlistAbortRef.current = controller;

      try {
        const res = await fetch('/api/wishlist/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            memberId: member.id,
            email: member.email,
            phone: normPhone(member.phone),
            displayName: member.displayName,
            productId,
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data.member && mountedRef.current) {
          persistMember(data.member);
          if (firebaseUser) {
            void loadFirebase()
              .then(({ auth, syncFirebaseWishlistItem }) => {
                if (!auth.currentUser) return;
                return syncFirebaseWishlistItem({
                  uid: auth.currentUser.uid,
                  productId,
                  name: '',
                  price: '',
                  image: '',
                  category: '',
                  action: 'remove',
                });
              })
              .catch(() => {});
          }
        }
      } catch {
        // Optimistic local state already updated
      } finally {
        if (mountedRef.current) {
          setWishlistLoadingId(null);
        }
      }
    },
    [member, firebaseUser, guestWishlist, persistGuestWishlist, persistMember]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!product?.id) return;
      if (!member) {
        const exists = guestWishlist.some((item) => item.productId === product.id);
        if (exists) {
          persistGuestWishlist(guestWishlist.filter((item) => item.productId !== product.id));
          showWishlistNotice(`${product.name} removed from wishlist`);
        } else {
          const entry = buildWishlistEntry(product);
          persistGuestWishlist([entry, ...guestWishlist]);
          showWishlistNotice(`${product.name} added to your wishlist`);
        }
        return;
      }
      if (isInWishlist(product.id)) {
        await removeWishlistItem(product.id);
        showWishlistNotice(`${product.name} removed from wishlist`);
      } else {
        await addWishlistInternal(member, product);
      }
    },
    [
      member,
      guestWishlist,
      persistGuestWishlist,
      showWishlistNotice,
      isInWishlist,
      removeWishlistItem,
      addWishlistInternal,
    ]
  );

  return (
    <MemberContext.Provider
      value={{
        member,
        firebaseUser,
        isLoading,
        isMemberModalOpen,
        setIsMemberModalOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        justRegistered,
        clearJustRegistered: () => setJustRegistered(false),
        pendingWishlistProduct,
        clearPendingWishlistProduct: () => setPendingWishlistProduct(null),
        loginOrRegister,
        updateMemberProfile,
        logoutMember,
        refreshMember,
        syncMemberSnapshot,
        hasOrderedIdentity,
        recordOrderedIdentity,
        isInWishlist,
        wishlistItems,
        toggleWishlist,
        removeWishlistItem,
        wishlistLoadingId,
        wishlistNotice,
        clearWishlistNotice: () => setWishlistNotice(null),
      }}
    >
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => {
  const ctx = useContext(MemberContext);
  if (!ctx) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return ctx;
};
