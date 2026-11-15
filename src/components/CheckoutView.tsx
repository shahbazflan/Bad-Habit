import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { PolicyModal, PolicyType } from './PolicyModal';

export const CheckoutView: React.FC = () => {
  const {
    items,
    rawSubtotal,
    pairCount,
    pairDiscount,
    subtotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
    setConfirmedOrder,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Contact State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sendOrderSummaryToEmail, setSendOrderSummaryToEmail] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Delivery State
  const [country, setCountry] = useState('Pakistan');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [instructions, setInstructions] = useState('');

  // Shipping Method State
  const [shippingMethodId, setShippingMethodId] = useState<'standard' | 'express'>('standard');

  // Payment Method State ('cod' | 'bank_transfer')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);

  // Terms Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI / Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [policyType, setPolicyType] = useState<PolicyType | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Idempotency token to prevent duplicate double-clicks on a single checkout submit
  const generateIdempotencyKey = () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  // Field refs for error autofocus
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  // Scroll to top & assign fresh idempotency key whenever checkout opens
  useEffect(() => {
    if (isCheckoutOpen) {
      idempotencyKeyRef.current = generateIdempotencyKey();
      window.scrollTo(0, 0);
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Real store shipping fees
  const SHIPPING_RATES = {
    standard: {
      id: 'standard',
      name: 'Standard Courier Delivery',
      charge: 250,
      estimate: '3–5 business days',
      description: 'Tracked ground dispatch to all cities & towns across Pakistan',
    },
    express: {
      id: 'express',
      name: 'Express Courier Delivery',
      charge: 500,
      estimate: '1–2 business days',
      description: 'Priority courier with direct dispatch to major metropolitan hubs',
    },
  };

  const selectedShipping = SHIPPING_RATES[shippingMethodId];
  const totalArticles = items.reduce((sum, item) => sum + item.quantity, 0);
  const isBankTransfer = paymentMethod === 'bank_transfer';
  const codFee = 0;
  const shippingCharge = items.length > 0 ? (isBankTransfer ? 0 : selectedShipping.charge) : 0;
  const grandTotal = subtotal + shippingCharge;

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errors.phone = 'Mobile number is required for courier delivery.';
    } else {
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^(?:\+92|0092|92|0)?3[0-9]{9}$/.test(cleaned)) {
        errors.phone = 'Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567).';
      }
    }

    if (!firstName.trim()) errors.firstName = 'First name is required.';
    if (!lastName.trim()) errors.lastName = 'Last name is required.';
    if (!address.trim()) errors.address = 'Street delivery address is required.';
    if (!city.trim()) errors.city = 'City is required.';
    if (!country.trim()) errors.country = 'Country is required.';

    if (!agreedToTerms) {
      errors.terms = 'Please accept the Terms of Service to place your order.';
    }

    setFieldErrors(errors);

    // Focus first field with an error
    if (errors.email && emailRef.current) emailRef.current.focus();
    else if (errors.phone && phoneRef.current) phoneRef.current.focus();
    else if (errors.firstName && firstNameRef.current) firstNameRef.current.focus();
    else if (errors.lastName && lastNameRef.current) lastNameRef.current.focus();
    else if (errors.address && addressRef.current) addressRef.current.focus();
    else if (errors.city && cityRef.current) cityRef.current.focus();
    else if (errors.terms && termsRef.current) termsRef.current.focus();

    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (items.length === 0) {
      setSubmissionError('Your shopping bag is empty. Please add articles before checking out.');
      return;
    }

    if (!validateForm()) {
      setSubmissionError('Please correct the highlighted fields above to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        idempotencyKey: idempotencyKeyRef.current,
        shippingMethodId,
        paymentMethod,
        marketingConsent,
        sendOrderSummaryToEmail,
        customer: {
          email: email.trim(),
          phone: phone.trim(),
          marketingConsent,
        },
        delivery: {
          country,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          address: address.trim(),
          apartment: apartment.trim(),
          city: city.trim(),
          province,
          postalCode: postalCode.trim(),
          landmark: landmark.trim(),
          instructions: instructions.trim(),
        },
        shipping: {
          methodId: shippingMethodId,
          methodName: isBankTransfer ? 'Free Delivery (Bank Transfer)' : selectedShipping.name,
          charge: shippingCharge,
        },
        payment: {
          method: isBankTransfer
            ? 'Transfer to Bank account - Free Delivery'
            : 'Cash on Delivery (COD)',
          codFee,
        },
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          size: it.size,
          quantity: it.quantity,
          price: it.price,
          formattedPrice: it.formattedPrice,
          image: it.image,
        })),
        pricing: {
          subtotal,
          shippingCharge,
          codFee,
          grandTotal,
          currency: 'PKR',
        },
        createdAt: new Date().toISOString(),
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (res.status === 404
              ? 'Order service endpoint was not found on this deployment. Please redeploy with the updated backend API configuration.'
              : `Server could not complete the order (HTTP ${res.status}). Please try again.`)
        );
      }

      // Success! Set confirmed order & transition
      if (data.order) {
        setConfirmedOrder(data.order);
      } else {
        const orderNum = data.orderId || `BH-26-${Math.floor(10000 + Math.random() * 90000)}`;
        setConfirmedOrder({
          id: `ord_${Date.now()}`,
          orderNumber: orderNum,
          createdAt: new Date().toISOString(),
          customer: {
            email: email.trim(),
            phone: phone.trim(),
          },
          delivery: {
            country,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address: address.trim(),
            apartment: apartment.trim(),
            city: city.trim(),
            province,
            postalCode: postalCode.trim(),
            landmark: landmark.trim(),
            instructions: instructions.trim(),
          },
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            size: it.size,
            quantity: it.quantity,
            unitPrice: it.price,
            lineTotal: it.price * it.quantity,
            image: it.image,
          })),
          shippingMethod: {
            id: selectedShipping.id,
            name: isBankTransfer ? 'Free Delivery (Bank Transfer)' : selectedShipping.name,
            charge: shippingCharge,
            estimate: selectedShipping.estimate,
          },
          payment: isBankTransfer
            ? {
                method: 'bank_transfer',
                methodName: 'Transfer to Bank account - Free Delivery',
                status: 'pending_verification',
                statusLabel: 'Send transfer screenshot to 03310266534',
                accountNumber: '01210113983722',
                accountTitle: 'Meezan Bank - Hassan Ahmed',
                confirmationPhone: '03310266534',
              }
            : {
                method: 'cod',
                methodName: 'Cash on Delivery (COD)',
                status: 'pending_delivery',
                statusLabel: 'Payment due on delivery',
                codFee,
              },
          pricing: {
            currency: 'PKR',
            rawSubtotal,
            pairCount,
            pairDiscount,
            subtotal,
            shippingCharge,
            codFee,
            total: grandTotal,
            formattedRawSubtotal: `PKR ${rawSubtotal.toLocaleString()}`,
            formattedPairDiscount: `PKR ${pairDiscount.toLocaleString()}`,
            formattedSubtotal: `PKR ${subtotal.toLocaleString()}`,
            formattedShippingCharge: `PKR ${shippingCharge.toLocaleString()}`,
            formattedCodFee: `PKR ${codFee.toLocaleString()}`,
            formattedTotal: `PKR ${grandTotal.toLocaleString()}`,
          },
        });
      }

      idempotencyKeyRef.current = generateIdempotencyKey();
      clearCart();
      setIsCheckoutOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'A network error occurred. Please try again.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToBag = () => {
    setIsCheckoutOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto text-white selection:bg-cyan-500/30 flex flex-col justify-between"
      role="dialog"
      aria-modal="true"
      aria-label="BAD HABIT Checkout"
    >
      {/* Universal Website Background: Architectural Runway & Sky (Pristine sky blue continuing from previous pages) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="/clean_plate.jpg"
          alt="BAD HABIT architectural background"
          className="w-full h-full object-cover object-center pointer-events-none"
        />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/[0.12] border-b border-white/20 backdrop-blur-xl px-5 sm:px-12 py-4 flex items-center justify-between select-none shadow-[0_4px_20px_rgba(4,24,43,0.15)]">
        <div className="flex flex-col">
          <span className="font-display text-xl sm:text-2xl font-black tracking-[0.08em] text-white uppercase leading-none drop-shadow-sm">
            BAD HABIT
          </span>
          <span className="font-display text-[9px] sm:text-[10px] font-medium tracking-[0.26em] text-white/80 uppercase mt-1">
            YOU KNOW YOU WANT IT
          </span>
        </div>

        <button
          type="button"
          onClick={handleReturnToBag}
          className="flex items-center gap-2 text-xs font-display text-white hover:text-white transition-all cursor-pointer outline-none bg-white/15 hover:bg-white/25 px-4 py-2 rounded-full border border-white/25 shadow-sm active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return to showroom</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Accordion Order Summary Header (< 1024px) */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full rounded-2xl p-4 flex items-center justify-between text-left cursor-pointer border border-white/20 bg-white/[0.12] backdrop-blur-xl shadow-[0_8px_24px_rgba(4,24,43,0.15)]"
            aria-expanded={mobileSummaryOpen}
          >
            <div className="flex items-center gap-2 text-xs font-display text-white/90">
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <span>ORDER SUMMARY ({totalArticles} articles)</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileSummaryOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="font-display text-base font-bold text-white tracking-tight">
              PKR {grandTotal.toLocaleString()}
            </div>
          </button>

          {/* Collapsible Mobile Summary Details */}
          {mobileSummaryOpen && (
            <div className="mt-2 rounded-2xl p-5 border border-white/20 bg-white/[0.14] backdrop-blur-xl space-y-4 shadow-xl">
              <div className="divide-y divide-white/10 max-h-72 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-white/70 font-display">Bag is currently empty.</p>
                ) : (
                  items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="py-3 flex items-center gap-3">
                      <div className="w-12 h-14 shrink-0 bg-white/[0.08] rounded-xl border border-white/15 p-1 flex items-center justify-center overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs font-bold text-white truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-white/70 font-display">Size {item.size} ·</span>
                          {/* Quantity +/- controls */}
                          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                              className="w-4 h-4 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-xs font-display font-bold transition-all active:scale-90 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="text-[11px] font-display text-white font-semibold px-0.5">
                              Qty {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                              className="w-4 h-4 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-xs font-display font-bold transition-all active:scale-90 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-white font-display mt-0.5">
                          PKR {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-white/15 space-y-1.5 text-xs font-display">
                {pairDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-white/75">
                      <span>Articles Total</span>
                      <span>PKR {rawSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-200 font-semibold">
                      <span>Pair Discount (15% Off · {pairCount} {pairCount === 1 ? 'pair' : 'pairs'})</span>
                      <span>-PKR {pairDiscount.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-white/80">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Delivery ({isBankTransfer ? 'Free Delivery · Bank Transfer' : selectedShipping.name})</span>
                  <span>{isBankTransfer ? 'FREE (PKR 0)' : `PKR ${shippingCharge.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/15">
                  <span>Total Amount</span>
                  <span className="text-white font-bold">PKR {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {submissionError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/70 border border-red-400/40 text-red-200 text-sm font-display flex items-start gap-3 backdrop-blur-xl shadow-lg">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Order could not be submitted</p>
              <p className="text-xs mt-0.5 text-red-300">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Desktop 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form in Pristine Sky Blue Theme */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmitOrder} noValidate className="space-y-6">
              {/* SECTION 1: CUSTOMER CONTACT */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/40 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,24,43,0.3)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                    <h2 className="font-display text-sm sm:text-base uppercase tracking-[0.15em] text-white font-bold drop-shadow-sm">
                      1. Customer Contact
                    </h2>
                  </div>
                  <span className="text-[11px] font-display font-semibold tracking-wider uppercase text-white/70">Guest Checkout</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="checkout-email" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                      Email Address <span className="text-red-300">*</span>
                    </label>
                    <input
                      ref={emailRef}
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="e.g. client@example.com"
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-300 mt-1.5 font-display">{fieldErrors.email}</p>
                    )}
                    <p className="text-[11px] text-white/70 mt-1.5 font-display">
                      Order updates and courier tracking will be sent here.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                      Mobile Number <span className="text-red-300">*</span>
                    </label>
                    <input
                      ref={phoneRef}
                      id="checkout-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="e.g. 0300 1234567 or +92 300 1234567"
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-300 mt-1.5 font-display">{fieldErrors.phone}</p>
                    )}
                    <p className="text-[11px] text-white/70 mt-1.5 font-display">
                      For courier rider call upon doorstep arrival.
                    </p>
                  </div>

                  {/* Direct Order Summary & Marketing Consent */}
                  <div className="pt-2 space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer text-xs text-white/90 font-display select-none">
                      <input
                        type="checkbox"
                        checked={sendOrderSummaryToEmail}
                        onChange={(e) => setSendOrderSummaryToEmail(e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-slate-900 focus:ring-white cursor-pointer w-4 h-4"
                      />
                      <span>Send order summary directly to my registered email</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-xs text-white/80 font-display select-none">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-slate-900 focus:ring-white cursor-pointer w-4 h-4"
                      />
                      <span>Email me private previews of future BAD HABIT drops (optional).</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DELIVERY ADDRESS */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/40 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,24,43,0.3)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                    <h2 className="font-display text-sm sm:text-base uppercase tracking-[0.15em] text-white font-bold drop-shadow-sm">
                      2. Delivery Address
                    </h2>
                  </div>
                  <span className="text-[11px] font-display font-semibold tracking-wider uppercase text-white/70">Pakistan Nationwide</span>
                </div>

                <div className="space-y-4">
                  {/* Country Selector */}
                  <div>
                    <label htmlFor="checkout-country" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                      Country / Region <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="checkout-country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 text-white border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display cursor-pointer shadow-inner appearance-none pr-10 backdrop-blur-md"
                      >
                        <option value="Pakistan" className="bg-slate-800 text-white font-display">Pakistan</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/70">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {fieldErrors.country && (
                      <p className="text-xs text-red-300 mt-1 font-display">{fieldErrors.country}</p>
                    )}
                  </div>

                  {/* First & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-firstname" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                        First Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        ref={firstNameRef}
                        id="checkout-firstname"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        placeholder="e.g. Shahbaz"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                      {fieldErrors.firstName && (
                        <p className="text-xs text-red-300 mt-1 font-display">{fieldErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-lastname" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                        Last Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        ref={lastNameRef}
                        id="checkout-lastname"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        placeholder="e.g. Khan"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                      {fieldErrors.lastName && (
                        <p className="text-xs text-red-300 mt-1 font-display">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label htmlFor="checkout-address" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                      Street Address <span className="text-red-300">*</span>
                    </label>
                    <input
                      ref={addressRef}
                      id="checkout-address"
                      type="text"
                      autoComplete="address-line1"
                      required
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      placeholder="House / building number and street name"
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                    />
                    {fieldErrors.address && (
                      <p className="text-xs text-red-300 mt-1 font-display">{fieldErrors.address}</p>
                    )}
                  </div>

                  {/* Apartment, Suite (Optional) */}
                  <div>
                    <label htmlFor="checkout-apartment" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/80 mb-2">
                      Apartment, Suite, Unit, Floor (Optional)
                    </label>
                    <input
                      id="checkout-apartment"
                      type="text"
                      autoComplete="address-line2"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="e.g. Penthouse 4B, 3rd Floor"
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                    />
                  </div>

                  {/* City & Province & Postal Code (3-column) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="checkout-city" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                        City <span className="text-red-300">*</span>
                      </label>
                      <input
                        ref={cityRef}
                        id="checkout-city"
                        type="text"
                        autoComplete="address-level2"
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                        }}
                        placeholder="e.g. Lahore"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                      {fieldErrors.city && (
                        <p className="text-xs text-red-300 mt-1 font-display">{fieldErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="checkout-province" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/90 mb-2">
                        Province / Region <span className="text-red-300">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="checkout-province"
                          autoComplete="address-level1"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 text-white border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display cursor-pointer shadow-inner appearance-none pr-10 backdrop-blur-md"
                        >
                          <option value="Punjab" className="bg-slate-800 text-white font-display">Punjab</option>
                          <option value="Sindh" className="bg-slate-800 text-white font-display">Sindh</option>
                          <option value="Islamabad Capital Territory" className="bg-slate-800 text-white font-display">Islamabad ICT</option>
                          <option value="Khyber Pakhtunkhwa" className="bg-slate-800 text-white font-display">Khyber Pakhtunkhwa</option>
                          <option value="Balochistan" className="bg-slate-800 text-white font-display">Balochistan</option>
                          <option value="Gilgit-Baltistan" className="bg-slate-800 text-white font-display">Gilgit-Baltistan</option>
                          <option value="Azad Kashmir" className="bg-slate-800 text-white font-display">Azad Kashmir</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/70">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-postal" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/80 mb-2">
                        Postal Code (Optional)
                      </label>
                      <input
                        id="checkout-postal"
                        type="text"
                        autoComplete="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 54000"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Landmark & Instructions (2-column) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-landmark" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/80 mb-2">
                        Nearby Landmark (Optional)
                      </label>
                      <input
                        id="checkout-landmark"
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near Shaukat Khanum / Mall"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-instructions" className="block text-[11px] font-display font-bold tracking-[0.12em] uppercase text-white/80 mb-2">
                        Delivery Instructions (Optional)
                      </label>
                      <input
                        id="checkout-instructions"
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. Please call before delivery"
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/35 hover:bg-black/45 focus:bg-black/55 text-white placeholder:text-white/55 border border-white/25 focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm font-display transition-all backdrop-blur-md shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SHIPPING & PAYMENT METHOD */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/40 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,24,43,0.3)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                    <h2 className="font-display text-sm sm:text-base uppercase tracking-[0.15em] text-white font-bold drop-shadow-sm">
                      3. Payment & Billing
                    </h2>
                  </div>
                  <span className="text-[11px] font-display font-semibold tracking-wider uppercase text-white/70">
                    {isBankTransfer ? 'Bank Transfer · Free Delivery' : 'Cash on Delivery'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Cash On Delivery Option */}
                  <label
                    className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-md shadow-sm ${
                      paymentMethod === 'cod'
                        ? 'bg-black/50 border-white/55'
                        : 'bg-black/30 hover:bg-black/40 border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-slate-900 focus:ring-white cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-white tracking-tight">
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] font-display px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white font-medium uppercase tracking-wider">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-white/80 font-display mt-0.5">
                          Pay in cash upon physical inspection and doorstep delivery of your package.
                        </p>
                        <p className="text-[11px] text-white/75 font-display mt-1">
                          Delivery charge applies on COD · Bank Transfer includes Free Delivery.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Transfer to Bank Account - Free Delivery Option */}
                  <label
                    className={`flex items-start justify-between p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-md shadow-sm ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-black/50 border-white/55'
                        : 'bg-black/30 hover:bg-black/40 border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="mt-1 text-slate-900 focus:ring-white cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-white tracking-tight">
                            Transfer to Bank account
                          </span>
                          <span className="text-[10px] font-display px-2 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/50 text-emerald-100 font-semibold uppercase tracking-wider">
                            Free Delivery
                          </span>
                        </div>
                        <div className="mt-2.5 p-3 rounded-xl bg-white/[0.08] border border-white/15 space-y-1.5 text-xs font-display">
                          <p className="text-white/95">
                            <span className="text-white/70">Account number:</span>{' '}
                            <span className="font-display font-bold tracking-wider text-white select-all">
                              01210113983722
                            </span>
                          </p>
                          <p className="text-white font-semibold">
                            Meezan Bank - Hassan Ahmed
                          </p>
                          <p className="text-white/95">
                            <span className="text-white/70">Send screenshot to this phone number:</span>{' '}
                            <span className="font-display font-bold tracking-wider text-white select-all">
                              03310266534
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Billing Address Option */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer text-xs text-white/80 font-display select-none">
                      <input
                        type="checkbox"
                        checked={billingSameAsDelivery}
                        onChange={(e) => setBillingSameAsDelivery(e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-slate-900 focus:ring-white cursor-pointer w-4 h-4"
                      />
                      <span>Billing address is same as delivery address</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* TERMS & ORDER SUBMISSION */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/40 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,24,43,0.3)] space-y-5">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-white/90 select-none font-display">
                    <input
                      ref={termsRef}
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: '' }));
                      }}
                      className="mt-0.5 rounded border-white/30 bg-white/10 text-slate-900 focus:ring-white cursor-pointer w-4 h-4"
                    />
                    <span>
                      I have reviewed my order and agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPolicyType('terms');
                        }}
                        className="underline text-white hover:text-white/80 font-display font-medium"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPolicyType('privacy');
                        }}
                        className="underline text-white hover:text-white/80 font-display font-medium"
                      >
                        Privacy Policy
                      </button>
                      . <span className="text-red-300">*</span>
                    </span>
                  </label>
                  {fieldErrors.terms && (
                    <p className="text-xs text-red-300 mt-1.5 font-display">{fieldErrors.terms}</p>
                  )}
                </div>

                {/* Final Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full py-4 px-8 text-base font-bold tracking-wider text-slate-900 bg-white hover:bg-white/95 transition-all cursor-pointer outline-none shadow-[0_8px_24px_rgba(4,24,43,0.25)] active:scale-98 disabled:opacity-50 uppercase font-display rounded-full"
                >
                  {isSubmitting ? 'Placing your order…' : 'Place order'}
                </button>

                <p className="text-center text-[11px] font-display text-white/70">
                  {isBankTransfer
                    ? `Bank Transfer · Free Delivery · Send screenshot to 03310266534 · PKR ${grandTotal.toLocaleString()}`
                    : `Cash on Delivery · Payment due upon physical parcel arrival · PKR ${grandTotal.toLocaleString()}`}
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: ORDER SUMMARY */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <div className="rounded-3xl p-6 sm:p-7 bg-slate-950/40 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,24,43,0.3)] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                    Order Summary
                  </h3>
                </div>
                <span className="text-xs font-display text-white/80 font-semibold">
                  {totalArticles} articles
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-white/10 max-h-96 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/70 font-display">
                    Your bag is empty. Add products to place an order.
                  </div>
                ) : (
                  items.map((item) => {
                    const lineTotal = item.price * item.quantity;
                    return (
                      <div key={`${item.productId}-${item.size}`} className="py-4 first:pt-0 flex items-center gap-4">
                        <div className="w-16 h-18 shrink-0 bg-white/[0.08] rounded-2xl border border-white/15 p-2 flex items-center justify-center overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-bold text-white tracking-tight truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-display text-white/70">
                              Size {item.size} ·
                            </span>
                            {/* Quantity +/- Controls */}
                            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                                className="w-4 h-4 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-xs font-display font-bold transition-all active:scale-90 cursor-pointer"
                                title="Subtract 1 article"
                                aria-label="Subtract 1 article"
                              >
                                −
                              </button>
                              <span className="text-xs font-display text-white font-semibold px-0.5">
                                Qty {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                                className="w-4 h-4 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-xs font-display font-bold transition-all active:scale-90 cursor-pointer"
                                title="Add 1 article"
                                aria-label="Add 1 article"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-white font-display mt-1">
                            PKR {lineTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-white/15 text-xs font-display">
                {pairDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-white/75">
                      <span>Articles Total</span>
                      <span>PKR {rawSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-200 font-semibold">
                      <span>Pair Discount (15% Off · {pairCount} {pairCount === 1 ? 'pair' : 'pairs'})</span>
                      <span>-PKR {pairDiscount.toLocaleString()}</span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-white/80">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-white/80">
                  <span>Delivery ({isBankTransfer ? 'Free Delivery · Bank Transfer' : selectedShipping.name})</span>
                  <span>{isBankTransfer ? 'FREE (PKR 0)' : `PKR ${shippingCharge.toLocaleString()}`}</span>
                </div>

                <div className="flex items-center justify-between text-white pt-3 border-t border-white/15 text-base font-bold font-display">
                  <span>Total Amount</span>
                  <span className="text-white font-bold text-xl sm:text-2xl">PKR {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Real Policy Links */}
              <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-display text-white/60">
                <button
                  type="button"
                  onClick={() => setPolicyType('shipping')}
                  className="hover:text-white underline cursor-pointer"
                >
                  Shipping
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setPolicyType('returns')}
                  className="hover:text-white underline cursor-pointer"
                >
                  Returns
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setPolicyType('privacy')}
                  className="hover:text-white underline cursor-pointer"
                >
                  Privacy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setPolicyType('terms')}
                  className="hover:text-white underline cursor-pointer"
                >
                  Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Policy Modal */}
      <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />
    </div>
  );
};
