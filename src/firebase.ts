import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}

export async function syncFirebaseMemberProfile(params: {
  uid: string;
  email: string;
  phone: string;
  displayName?: string;
  orderCount?: number;
  firstOrderDiscountUsed?: boolean;
}) {
  const profilePath = `users/${params.uid}/private/info`;
  const ref = doc(db, 'users', params.uid, 'private', 'info');
  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        uid: params.uid,
        email: params.email.trim().toLowerCase().slice(0, 200),
        phone: params.phone.trim().slice(0, 32),
        ...(params.displayName ? { displayName: params.displayName.trim().slice(0, 100) } : {}),
        promoCode: 'BH-DETECTED',
        firstOrderDiscountUsed: false,
        orderCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        {
          phone: params.phone.trim().slice(0, 32),
          ...(params.displayName ? { displayName: params.displayName.trim().slice(0, 100) } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
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
