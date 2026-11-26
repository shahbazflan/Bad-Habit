import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  runTransaction,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { isValidPhoneNumber, normalizePhoneToE164, toPhoneRegistryKey } from './utils/phone';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function syncFirebaseMemberProfile(params: {
  uid: string;
  email: string;
  phone: string;
  displayName?: string;
  orderCount?: number;
  firstOrderDiscountUsed?: boolean;
}) {
  const normalizedPhone = normalizePhoneToE164(params.phone);
  const nextPhoneKey = toPhoneRegistryKey(normalizedPhone);
  if (!isValidPhoneNumber(normalizedPhone) || !nextPhoneKey) {
    throw new Error('Please provide a valid phone number.');
  }

  const profilePath = `users/${params.uid}/private/info`;
  const profileRef = doc(db, 'users', params.uid, 'private', 'info');
  const nextPhoneRef = doc(db, 'phoneRegistry', nextPhoneKey);

  try {
    await runTransaction(db, async (tx) => {
      const [existingProfileSnap, targetPhoneSnap] = await Promise.all([
        tx.get(profileRef),
        tx.get(nextPhoneRef),
      ]);

      if (targetPhoneSnap.exists() && targetPhoneSnap.data()?.uid !== params.uid) {
        throw new Error('Email/phone Already registered');
      }

      const prevPhoneKey = existingProfileSnap.exists()
        ? String(existingProfileSnap.data()?.phoneKey || toPhoneRegistryKey(existingProfileSnap.data()?.phone))
        : '';

      if (prevPhoneKey && prevPhoneKey !== nextPhoneKey) {
        const prevPhoneRef = doc(db, 'phoneRegistry', prevPhoneKey);
        const prevPhoneSnap = await tx.get(prevPhoneRef);
        if (prevPhoneSnap.exists() && prevPhoneSnap.data()?.uid === params.uid) {
          tx.delete(prevPhoneRef);
        }
      }

      if (!targetPhoneSnap.exists()) {
        tx.set(nextPhoneRef, {
          uid: params.uid,
          createdAt: serverTimestamp(),
        });
      }

      if (!existingProfileSnap.exists()) {
        tx.set(profileRef, {
          uid: params.uid,
          email: params.email.trim().toLowerCase().slice(0, 200),
          phone: normalizedPhone.slice(0, 32),
          phoneKey: nextPhoneKey,
          ...(params.displayName ? { displayName: params.displayName.trim().slice(0, 100) } : {}),
          promoCode: 'BH-DETECTED',
          firstOrderDiscountUsed: false,
          orderCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(profileRef, {
          phone: normalizedPhone.slice(0, 32),
          phoneKey: nextPhoneKey,
          ...(params.displayName !== undefined
            ? { displayName: params.displayName.trim().slice(0, 100) }
            : {}),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Already registered')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export async function syncFirebaseWishlistItem(params: {
  uid: string;
  productId: string;
  name: string;
  price: string;
  image: string;
  category: string;
  action: 'add' | 'remove';
}) {
  const itemPath = `users/${params.uid}/wishlist/${params.productId}`;
  const ref = doc(db, 'users', params.uid, 'wishlist', params.productId);
  try {
    if (params.action === 'add') {
      await setDoc(ref, {
        uid: params.uid,
        productId: params.productId.slice(0, 32),
        name: params.name.slice(0, 120),
        price: params.price.slice(0, 40),
        image: params.image.slice(0, 300),
        category: params.category.slice(0, 40),
        addedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(ref);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      params.action === 'add' ? OperationType.CREATE : OperationType.DELETE,
      itemPath
    );
  }
}
