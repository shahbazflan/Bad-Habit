import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateBagTotals } from '../utils/pairPricing';

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
    subtotal: number;
    shippingCharge: number;
    codFee?: number;
    total: number;
    formattedRawSubtotal?: string;
    formattedPairDiscount?: string;
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
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<CartItem | null>(null);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  // Persist non-sensitive cart items to localStorage across refreshes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage may fail in restricted environments
    }
  }, [items]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const pairBreakdown = React.useMemo(() => calculateBagTotals(items), [items]);
  const rawSubtotal = pairBreakdown.rawSubtotal;
  const pairCount = pairBreakdown.pairCount;
  const pairDiscount = pairBreakdown.pairDiscount;
  const subtotal = pairBreakdown.discountedSubtotal;
  const formattedRawSubtotal = pairBreakdown.formattedRawSubtotal;
  const formattedPairDiscount = pairBreakdown.formattedPairDiscount;
  const formattedSubtotal = pairBreakdown.formattedDiscountedSubtotal;

  const addToCart = useCallback(
    async (productData: Omit<CartItem, 'quantity'> & { quantity?: number }): Promise<boolean> => {
      if (isAdding) return false;
      setIsAdding(true);

      const qtyToAdd = productData.quantity || 1;
      const targetItem: CartItem = {
        productId: productData.productId,
        name: productData.name,
        price: productData.price,
        formattedPrice: productData.formattedPrice,
        size: productData.size,
        quantity: qtyToAdd,
        image: productData.image,
      };

      try {
        setItems((prevItems) => {
          const existingIdx = prevItems.findIndex(
            (it) => it.productId === targetItem.productId && it.size === targetItem.size
          );

          if (existingIdx !== -1) {
            const updated = [...prevItems];
            const newQty = Math.min(updated[existingIdx].quantity + qtyToAdd, 5); // Stock limit 5 per size
            updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
            return updated;
          } else {
            return [...prevItems, targetItem];
          }
        });

        setRecentlyAddedItem(targetItem);
        return true;
      } finally {
        setTimeout(() => setIsAdding(false), 300);
      }
    },
    [isAdding]
  );

  const addPairToCart = useCallback(
    async (
      shirtData: Omit<CartItem, 'quantity'> & { quantity?: number },
      trouserData: Omit<CartItem, 'quantity'> & { quantity?: number }
    ): Promise<boolean> => {
      if (isAdding) return false;
      setIsAdding(true);

      const upsertItem = (list: CartItem[], data: Omit<CartItem, 'quantity'> & { quantity?: number }): CartItem[] => {
        const qtyToAdd = data.quantity || 1;
        const targetItem: CartItem = {
          productId: data.productId,
          name: data.name,
          price: data.price,
          formattedPrice: data.formattedPrice,
          size: data.size,
          quantity: qtyToAdd,
          image: data.image,
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
        setItems((prev) => upsertItem(upsertItem(prev, shirtData), trouserData));
        return true;
      } finally {
        setTimeout(() => setIsAdding(false), 300);
      }
    },
    [isAdding]
  );

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.size === size) {
          const clampedQty = Math.min(Math.max(1, quantity), 5); // Stock limit
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((item) => !(item.productId === productId && item.size === size)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
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
