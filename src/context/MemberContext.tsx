import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { Product } from '../data/products';
import {
  auth,
  googleProvider,
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
  pendingGoogleEmail: string | null;
  pendingGoogleName: string | null;
  loginOrRegister: (params: {
    email: string;
    phone: string;
    displayName?: string;
  }) => Promise<{ ok: boolean; isNewMember?: boolean; error?: string }>;
  startGoogleSignIn: () => Promise<{ ok: boolean; needsPhone?: boolean; error?: string }>;
  logoutMember: () => Promise<void>;
  refreshMember: () => Promise<void>;
  syncMemberSnapshot: (updated: MemberProfile | null | undefined) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeWishlistItem: (productId: string) => Promise<void>;
  wishlistLoadingId: string | null;
  wishlistNotice: string | null;
  clearWishlistNotice: () => void;
}

const MemberContext = createContext<MemberContextType | null>(null);

const MEMBER_STORAGE_KEY = 'bad_habit_member_v1';

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
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState<string | null>(null);
  const [pendingGoogleName, setPendingGoogleName] = useState<string | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);

  const persistMember = useCallback((next: MemberProfile | null) => {
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
  }, []);

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
  }, [member?.id, member?.email, member?.phone, persistMember]);

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
        setPendingGoogleEmail(null);
        setPendingGoogleName(null);

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
    [persistMember, pendingWishlistProduct, addWishlistInternal]
  );

  const startGoogleSignIn = useCallback(async (): Promise<{
    ok: boolean;
    needsPhone?: boolean;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const gEmail = (user.email || '').trim().toLowerCase();
      const gName = (user.displayName || '').trim();

      if (!gEmail) {
        return { ok: false, error: 'Google account did not return an email address.' };
      }

      // Check if an account already exists for this email
      const checkRes = await fetch('/api/members/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gEmail }),
      });

      if (checkRes.ok) {
        const data = await checkRes.json().catch(() => null);
        if (data?.success && data.member) {
          persistMember(data.member);
          setJustRegistered(false);
          setPendingGoogleEmail(null);
          setPendingGoogleName(null);
          void syncFirebaseMemberProfile({
            uid: user.uid,
            email: data.member.email,
            phone: data.member.phone,
            displayName: data.member.displayName || gName,
            orderCount: data.member.orderCount,
            firstOrderDiscountUsed: data.member.firstOrderDiscountUsed,
          }).catch(() => {});
          if (pendingWishlistProduct) {
            const itemToSave = pendingWishlistProduct;
            setPendingWishlistProduct(null);
            await addWishlistInternal(data.member, itemToSave);
          }
          return { ok: true, needsPhone: false };
        }
      }

      // New Google user: request phone number to complete membership & unlock BH-DETECTED
      setPendingGoogleEmail(gEmail);
      setPendingGoogleName(gName || null);
      return { ok: true, needsPhone: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message?.includes('popup-closed')
          ? 'Google sign-in popup was closed before completion.'
          : 'Google sign-in could not be completed. You can sign up with Phone & Email below.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [persistMember, pendingWishlistProduct, addWishlistInternal]);

  const logoutMember = useCallback(async () => {
    persistMember(null);
    setJustRegistered(false);
    setPendingWishlistProduct(null);
    setPendingGoogleEmail(null);
    setPendingGoogleName(null);
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
        pendingGoogleEmail,
        pendingGoogleName,
        loginOrRegister,
        startGoogleSignIn,
        logoutMember,
        refreshMember,
        syncMemberSnapshot,
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
