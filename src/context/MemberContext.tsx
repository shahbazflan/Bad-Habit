import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { Product } from '../data/products';
import {
  auth,
  syncFirebaseMemberProfile,
  syncFirebaseWishlistItem,
} from '../firebase';

export interface WishlistItem {
  productId: string;
  name: string;
  price: string;
  image: string;
  category: string;
  addedAt: string;
}

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
  }) => Promise<{ ok: boolean; isNewMember?: boolean; error?: string }>;
  logoutMember: () => Promise<void>;
  refreshMember: () => Promise<void>;
  syncMemberSnapshot: (updated: MemberProfile | null | undefined) => void;
  hasOrderedIdentity: (params: { email?: string; phone?: string; memberId?: string }) => boolean;
  recordOrderedIdentity: (params: { email?: string; phone?: string; memberId?: string }) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeWishlistItem: (productId: string) => Promise<void>;
  wishlistLoadingId: string | null;
  wishlistNotice: string | null;
  clearWishlistNotice: () => void;
}

const MemberContext = createContext<MemberContextType | null>(null);

const MEMBER_STORAGE_KEY = 'bad_habit_member_v1';
const ORDERED_IDENTITIES_KEY = 'bad_habit_ordered_identities_v1';

const normEmail = (raw?: string) => String(raw || '').trim().toLowerCase();
const normPhone = (raw?: string) => {
  const digits = String(raw || '').replace(/[\s\-\(\)]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+92')) return `0${digits.slice(3).replace(/^0+/, '')}`;
  if (digits.startsWith('0092')) return `0${digits.slice(4).replace(/^0+/, '')}`;
  if (digits.startsWith('92') && digits.length >= 12) return `0${digits.slice(2).replace(/^0+/, '')}`;
  if (digits.startsWith('3') && digits.length === 10) return `0${digits}`;
  return digits;
};

interface OrderedIdentityLedger {
  emails: string[];
  phones: string[];
  memberIds: string[];
}

function readOrderedLedger(): OrderedIdentityLedger {
  try {
    const raw = localStorage.getItem(ORDERED_IDENTITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emails: Array.isArray(parsed?.emails) ? parsed.emails : [],
        phones: Array.isArray(parsed?.phones) ? parsed.phones : [],
        memberIds: Array.isArray(parsed?.memberIds) ? parsed.memberIds : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return { emails: [], phones: [], memberIds: [] };
}

export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [member, setMember] = useState<MemberProfile | null>(() => {
    try {
      const saved = localStorage.getItem(MEMBER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.email && parsed.phone) {
          return parsed as MemberProfile;
        }
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState<Product | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);

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
    (next: MemberProfile | null) => {
      if (next && hasOrderedIdentity({ email: next.email, phone: next.phone, memberId: next.id })) {
        next = {
          ...next,
          firstOrderDiscountUsed: true,
          orderCount: Math.max(1, Number(next.orderCount || 0)),
        };
      }
      setMember(next);
      try {
        if (next) {
          localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(next));
        } else {
          localStorage.removeItem(MEMBER_STORAGE_KEY);
        }
      } catch {
        // ignore
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
      try {
        localStorage.setItem(ORDERED_IDENTITIES_KEY, JSON.stringify(ledger));
      } catch {
        // ignore
      }
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
        try {
          localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  // Track Firebase Auth user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Hydrate persisted member profile from backend on mount
  const refreshMember = useCallback(async () => {
    if (!member) return;
    try {
      const res = await fetch('/api/members/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          email: member.email,
          phone: member.phone,
          clientPriorOrderUsed: hasOrderedIdentity({
            memberId: member.id,
            email: member.email,
            phone: member.phone,
          }),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.member) {
          persistMember(data.member);
        }
      }
    } catch {
      // keep existing cached profile on offline
    }
  }, [member?.id, member?.email, member?.phone, hasOrderedIdentity, persistMember]);

  useEffect(() => {
    if (member?.id) {
      void refreshMember();
    }
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
      setWishlistLoadingId(product.id);
      try {
        const res = await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: activeMember.id,
            email: activeMember.email,
            phone: activeMember.phone,
            productId: product.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data?.success && data.member) {
          persistMember(data.member);
          setWishlistNotice(`${product.name} added to your wishlist`);
          setTimeout(() => setWishlistNotice(null), 2600);
          if (auth.currentUser) {
            void syncFirebaseWishlistItem({
              uid: auth.currentUser.uid,
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              action: 'add',
            }).catch(() => {});
          }
        }
      } catch {
        // ignore network issues gracefully
      } finally {
        setWishlistLoadingId(null);
      }
    },
    [persistMember]
  );

  const loginOrRegister = useCallback(
    async ({
      email,
      phone,
      displayName,
    }: {
      email: string;
      phone: string;
      displayName?: string;
    }): Promise<{ ok: boolean; isNewMember?: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/members/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            phone: phone.trim(),
            displayName: displayName?.trim() || undefined,
            clientPriorOrderUsed: hasOrderedIdentity({ email, phone }),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data.member) {
          return {
            ok: false,
            error: data?.error || 'Could not complete member registration. Please verify your email and phone number.',
          };
        }

        const savedMember: MemberProfile = data.member;
        persistMember(savedMember);
        setJustRegistered(Boolean(data.isNewMember));

        if (auth.currentUser) {
          void syncFirebaseMemberProfile({
            uid: auth.currentUser.uid,
            email: savedMember.email,
            phone: savedMember.phone,
            displayName: savedMember.displayName,
            orderCount: savedMember.orderCount,
            firstOrderDiscountUsed: savedMember.firstOrderDiscountUsed,
          }).catch(() => {});
        }

        if (pendingWishlistProduct) {
          const itemToSave = pendingWishlistProduct;
          setPendingWishlistProduct(null);
          await addWishlistInternal(savedMember, itemToSave);
        }

        return { ok: true, isNewMember: Boolean(data.isNewMember) };
      } catch {
        return { ok: false, error: 'Network error while connecting to member service.' };
      } finally {
        setIsLoading(false);
      }
    },
    [persistMember, hasOrderedIdentity, pendingWishlistProduct, addWishlistInternal]
  );

  const logoutMember = useCallback(async () => {
    persistMember(null);
    setJustRegistered(false);
    setPendingWishlistProduct(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // ignore signOut errors
    }
  }, [persistMember]);

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!member?.wishlist) return false;
      return member.wishlist.some((item) => item.productId === productId);
    },
    [member?.wishlist]
  );

  const removeWishlistItem = useCallback(
    async (productId: string) => {
      if (!member) return;
      setWishlistLoadingId(productId);
      try {
        const res = await fetch('/api/wishlist/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: member.id,
            email: member.email,
            phone: member.phone,
            productId,
          }),
        });
        const data = await res.json();
        if (res.ok && data?.success && data.member) {
          persistMember(data.member);
          if (auth.currentUser) {
            void syncFirebaseWishlistItem({
              uid: auth.currentUser.uid,
              productId,
              name: '',
              price: '',
              image: '',
              category: '',
              action: 'remove',
            }).catch(() => {});
          }
        }
      } catch {
        // ignore
      } finally {
        setWishlistLoadingId(null);
      }
    },
    [member, persistMember]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!member) {
        setPendingWishlistProduct(product);
        setIsMemberModalOpen(true);
        return;
      }
      if (isInWishlist(product.id)) {
        await removeWishlistItem(product.id);
      } else {
        await addWishlistInternal(member, product);
      }
    },
    [member, isInWishlist, removeWishlistItem, addWishlistInternal]
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
        logoutMember,
        refreshMember,
        syncMemberSnapshot,
        hasOrderedIdentity,
        recordOrderedIdentity,
        isInWishlist,
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
