import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { calculateBagTotals } from '../utils/pairPricing';
import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  sanitizeCartItems,
} from '../utils/runtimeSafety';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  formattedPrice: string;
  size: 'S' | 'M' | 'L' | 'XL';
  quantity: number;
  image: string;
}

export interface ConfirmedOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    email: string;
    phone: string;
  };
  delivery: {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    province: string;
    postalCode?: string;
    landmark?: string;
    instructions?: string;
    country: string;
  };
  items: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image: string;
  }[];
  shippingMethod: {
    id: string;
    name: string;
    charge: number;
    estimate: string;
  };
  payment: {
    method: string;
    methodName: string;
    status: string;
    statusLabel: string;
    accountNumber?: string;
    accountTitle?: string;
    confirmationPhone?: string;
    codFee?: number;
  };
  pricing: {
    currency: string;
    rawSubtotal?: number;
    pairCount?: number;
    pairDiscount?: number;
    promoCode?: string;
    promoDiscount?: number;
    subtotalAfterPair?: number;
    subtotal: number;
    shippingCharge: number;
    codFee?: number;
    total: number;
    formattedRawSubtotal?: string;
    formattedPairDiscount?: string;
    formattedPromoDiscount?: string;
    formattedSubtotal: string;
    formattedShippingCharge: string;
    formattedCodFee?: string;
    formattedTotal: string;
  };
  notifications?: {
    storeEmailSent: boolean;
    customerEmailSent: boolean;
    automationEmailSent?: boolean;
    webhookSent?: boolean;
    provider?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  rawSubtotal: number;
  pairCount: number;
  pairDiscount: number;
  subtotal: number;
  formattedRawSubtotal: string;
  formattedPairDiscount: string;
  formattedSubtotal: string;
  isAdding: boolean;
  recentlyAddedItem: CartItem | null;
  setRecentlyAddedItem: (item: CartItem | null) => void;
  isBagOpen: boolean;
  setIsBagOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  confirmedOrder: ConfirmedOrder | null;
  setConfirmedOrder: (order: ConfirmedOrder | null) => void;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<boolean>;
  addPairToCart: (
    shirt: Omit<CartItem, 'quantity'> & { quantity?: number },
    trouser: Omit<CartItem, 'quantity'> & { quantity?: number }
  ) => Promise<boolean>;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'bad_habit_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() =>
    sanitizeCartItems(safeStorageGet<unknown>(STORAGE_KEY, []))
  );

  const [isAdding, setIsAdding] = useState(false);
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<CartItem | null>(null);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const isAddingRef = useRef(false);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (addTimerRef.current) {
        clearTimeout(addTimerRef.current);
        addTimerRef.current = null;
      }
    };
  }, []);

  // Persist non-sensitive cart items to localStorage across refreshes
  useEffect(() => {
    safeStorageSet(STORAGE_KEY, items);
  }, [items]);

  const safeItems = Array.isArray(items) ? items : [];
  const cartCount = safeItems.reduce((sum, item) => sum + Math.max(0, Number(item?.quantity) || 0), 0);
  const pairBreakdown = React.useMemo(() => calculateBagTotals(safeItems), [safeItems]);
  const rawSubtotal = pairBreakdown.rawSubtotal;
  const pairCount = pairBreakdown.pairCount;
  const pairDiscount = pairBreakdown.pairDiscount;
  const subtotal = pairBreakdown.discountedSubtotal;
  const formattedRawSubtotal = pairBreakdown.formattedRawSubtotal;
  const formattedPairDiscount = pairBreakdown.formattedPairDiscount;
  const formattedSubtotal = pairBreakdown.formattedDiscountedSubtotal;

  const scheduleAddUnlock = useCallback(() => {
    if (addTimerRef.current) {
      clearTimeout(addTimerRef.current);
    }
    addTimerRef.current = setTimeout(() => {
      isAddingRef.current = false;
      if (mountedRef.current) {
        setIsAdding(false);
      }
      addTimerRef.current = null;
    }, 280);
  }, []);

  const addToCart = useCallback(
    async (productData: Omit<CartItem, 'quantity'> & { quantity?: number }): Promise<boolean> => {
      if (isAddingRef.current || !productData?.productId) return false;
      isAddingRef.current = true;
      setIsAdding(true);

      const qtyToAdd = Math.min(Math.max(1, Math.floor(Number(productData.quantity) || 1)), 5);
      const validSize =
        productData.size === 'S' || productData.size === 'M' || productData.size === 'L' || productData.size === 'XL'
          ? productData.size
          : 'M';
      const numericPrice = Math.max(0, Number(productData.price) || 0);

      const targetItem: CartItem = {
        productId: String(productData.productId),
        name: String(productData.name || productData.productId),
        price: numericPrice,
        formattedPrice: productData.formattedPrice || `PKR ${numericPrice.toLocaleString()}`,
        size: validSize,
        quantity: qtyToAdd,
        image: String(productData.image || ''),
      };

      try {
        setItems((prevItems) => {
          const list = Array.isArray(prevItems) ? prevItems : [];
          const existingIdx = list.findIndex(
            (it) => it.productId === targetItem.productId && it.size === targetItem.size
          );

          if (existingIdx !== -1) {
            const updated = [...list];
            const newQty = Math.min(updated[existingIdx].quantity + qtyToAdd, 5);
            updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
            return updated;
          }
          return [...list, targetItem];
        });

        setRecentlyAddedItem(targetItem);
        return true;
      } finally {
        scheduleAddUnlock();
      }
    },
    [scheduleAddUnlock]
  );

  const addPairToCart = useCallback(
    async (
      shirtData: Omit<CartItem, 'quantity'> & { quantity?: number },
      trouserData: Omit<CartItem, 'quantity'> & { quantity?: number }
    ): Promise<boolean> => {
      if (isAddingRef.current || !shirtData?.productId || !trouserData?.productId) return false;
      isAddingRef.current = true;
      setIsAdding(true);

      const upsertItem = (list: CartItem[], data: Omit<CartItem, 'quantity'> & { quantity?: number }): CartItem[] => {
        const qtyToAdd = Math.min(Math.max(1, Math.floor(Number(data.quantity) || 1)), 5);
        const validSize =
          data.size === 'S' || data.size === 'M' || data.size === 'L' || data.size === 'XL' ? data.size : 'M';
        const numericPrice = Math.max(0, Number(data.price) || 0);
        const targetItem: CartItem = {
          productId: String(data.productId),
          name: String(data.name || data.productId),
          price: numericPrice,
          formattedPrice: data.formattedPrice || `PKR ${numericPrice.toLocaleString()}`,
          size: validSize,
          quantity: qtyToAdd,
          image: String(data.image || ''),
        };
        const idx = list.findIndex((it) => it.productId === targetItem.productId && it.size === targetItem.size);
        if (idx !== -1) {
          const copy = [...list];
          copy[idx] = { ...copy[idx], quantity: Math.min(copy[idx].quantity + qtyToAdd, 5) };
          return copy;
        }
        return [...list, targetItem];
      };

      try {
        setItems((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return upsertItem(upsertItem(list, shirtData), trouserData);
        });
        return true;
      } finally {
        scheduleAddUnlock();
      }
    },
    [scheduleAddUnlock]
  );

  const removeFromCart = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId, size);
        return;
      }
      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((item) => {
          if (item.productId === productId && item.size === size) {
            const clampedQty = Math.min(Math.max(1, Math.floor(quantity)), 5);
            return { ...item, quantity: clampedQty };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    safeStorageRemove(STORAGE_KEY);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items: safeItems,
        cartCount,
        rawSubtotal,
        pairCount,
        pairDiscount,
        subtotal,
        formattedRawSubtotal,
        formattedPairDiscount,
        formattedSubtotal,
        isAdding,
        recentlyAddedItem,
        setRecentlyAddedItem,
        isBagOpen,
        setIsBagOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        confirmedOrder,
        setConfirmedOrder,
        addToCart,
        addPairToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
