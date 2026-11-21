import React from 'react';
import { useCart } from '../context/CartContext';
import { getProductSubtitle } from '../data/products';
import { BrandLogo } from './BrandLogo';
import { CleanPlatePicture } from './CleanPlatePicture';
import { SmartImage } from './SmartImage';

export const OrderConfirmationView: React.FC = () => {
  const { confirmedOrder, setConfirmedOrder } = useCart();

  if (!confirmedOrder) return null;

  const orderItems = Array.isArray(confirmedOrder.items) ? confirmedOrder.items : [];
  const delivery = confirmedOrder.delivery ?? {
    country: 'Pakistan',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
  };
  const payment = confirmedOrder.payment ?? {
    method: 'cod' as const,
    methodName: 'Cash on Delivery (COD)',
    status: 'pending_delivery',
    statusLabel: 'Payment due on delivery',
  };
  const shippingMethod = confirmedOrder.shippingMethod ?? {
    id: 'standard',
    name: 'Standard Courier Delivery',
    charge: 0,
    estimate: '3–5 business days',
  };
  const pricing = confirmedOrder.pricing ?? {
    currency: 'PKR',
    subtotal: 0,
    shippingCharge: 0,
    codFee: 0,
    total: 0,
    formattedSubtotal: 'PKR 0',
    formattedShippingCharge: 'PKR 0',
    formattedCodFee: 'PKR 0',
    formattedTotal: 'PKR 0',
  };
  const customer = confirmedOrder.customer ?? { email: '', phone: '' };

  const handleContinueShopping = () => {
    setConfirmedOrder(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto text-white selection:bg-cyan-500/30 flex flex-col justify-between"
      role="dialog"
      aria-modal="true"
      aria-label="Order Confirmation - BAD HABIT DETECTED"
    >
      {/* Pristine Sky Blue Architectural Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <CleanPlatePicture
          alt="BAD HABIT architectural background"
          className="w-full h-full object-cover object-center pointer-events-none"
          sizes="100vw"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full px-5 sm:px-12 py-4 flex items-center justify-between select-none bg-white/[0.12] border-b border-white/20 backdrop-blur-xl shadow-[0_4px_20px_rgba(4,24,43,0.15)]">
        <BrandLogo onClick={handleContinueShopping} />

        <button
          type="button"
          onClick={handleContinueShopping}
          className="glass-capsule glass-capsule-hover flex items-center gap-1.5 text-[13px] font-grotesk font-semibold text-white transition-all cursor-pointer outline-none px-3.5 py-1.5 active:scale-95"
        >
          <span>Continue shopping</span>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </header>

      {/* Main Branded Confirmation Panel */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto">
        <div className="rounded-3xl p-6 sm:p-10 bg-white/[0.14] border border-white/25 backdrop-blur-2xl shadow-[0_20px_60px_rgba(4,24,43,0.2)] text-center animate-in fade-in zoom-in-95 duration-500">
          {/* Accent Line */}
          <div className="w-12 h-1 bg-white rounded-full mx-auto mb-6 shadow-[0_0_14px_rgba(255,255,255,0.8)]" />

          {/* EXACT HEADLINE PROMINENTLY */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.08em] text-white uppercase drop-shadow-[0_4px_16px_rgba(4,24,43,0.3)] leading-tight">
            BAD HABIT DETECTED
          </h1>

          {/* EXACT FOLLOW-UP */}
          <p className="text-xs sm:text-sm font-display tracking-widest uppercase text-white/85 mt-3">
            Your order has been received.
          </p>

          {/* Order Reference Badge */}
          <div className="glass-capsule font-grotesk inline-flex items-center gap-2 px-3.5 py-1.5 mt-6">
            <span className="text-[12px] font-grotesk text-white/80 uppercase tracking-widest">Order Number:</span>
            <span className="font-grotesk text-[15px] font-bold text-white tracking-wider">
              {confirmedOrder.orderNumber}
            </span>
          </div>

          {/* Order Details Grid */}
          <div className="mt-8 text-left bg-white/[0.10] rounded-2xl p-5 sm:p-6 border border-white/15 divide-y divide-white/10 space-y-4 shadow-inner">
            {/* Ordered Articles */}
            <div className="space-y-3 pb-4">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white/80">
                Ordered Articles ({orderItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)})
              </h3>
              <div className="divide-y divide-white/10">
                {orderItems.map((item) => {
                  const itemSubtitle = getProductSubtitle(item.productId);
                  return (
                    <div key={`${item.productId}-${item.size}`} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-14 object-contain rounded-xl bg-white/[0.08] border border-white/15 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <SmartImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            sizes="56px"
                            skeletonClassName="inset-1 rounded-lg"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                            {item.name}
                          </p>
                          {itemSubtitle && (
                            <p className="text-[10.5px] font-sans text-white/75 truncate">
                              {itemSubtitle}
                            </p>
                          )}
                          <p className="text-[11px] font-display text-white/70">
                            Size: {item.size} · Quantity: {Number(item.quantity) || 1}
                          </p>
                        </div>
                      </div>
                      <span className="font-display text-xs sm:text-sm font-bold text-white shrink-0">
                        PKR {(Number(item.lineTotal) || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery & Payment Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-display">
              <div>
                <span className="text-white/60 uppercase tracking-wider block mb-1">
                  Delivery Destination
                </span>
                <p className="text-white font-semibold">
                  {delivery.firstName} {delivery.lastName}
                </p>
                <p className="text-white/90">{delivery.address}</p>
                {delivery.apartment && (
                  <p className="text-white/80">{delivery.apartment}</p>
                )}
                <p className="text-white/90">
                  {delivery.city}, {delivery.province}
                </p>
                {delivery.postalCode && (
                  <p className="text-white/70">{delivery.postalCode}</p>
                )}
                <p className="text-white/70 mt-1 font-bold">Pakistan</p>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-white/60 uppercase tracking-wider block mb-1">
                    Payment Method
                  </span>
                  <p className="text-white font-semibold">
                    {payment.methodName}
                  </p>
                  <p className="text-white/90 font-medium mt-0.5">
                    {payment.statusLabel}
                  </p>
                  {payment.method === 'bank_transfer' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white/[0.08] border border-white/15 space-y-1 text-[11px]">
                      <p className="text-white/90">
                        Account number:{' '}
                        <span className="font-bold text-white">
                          {payment.accountNumber || '01210113983722'}
                        </span>
                      </p>
                      <p className="text-white font-semibold">
                        {payment.accountTitle || 'Meezan Bank - Hassan Ahmed'}
                      </p>
                      <p className="text-white/90">
                        Send screenshot to:{' '}
                        <span className="font-bold text-white">
                          {payment.confirmationPhone || '03310266534'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-white/60 uppercase tracking-wider block mb-1">
                    Delivery Estimate
                  </span>
                  <p className="text-white">
                    {shippingMethod.estimate} ({shippingMethod.name})
                  </p>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="pt-4 space-y-1.5 text-xs font-display">
              {(pricing.pairDiscount ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-white/75">
                    <span>Articles Total</span>
                    <span>PKR {(Number(pricing.rawSubtotal ?? pricing.subtotal) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-200 font-semibold">
                    <span>
                      Pair Discount (15% Off · {pricing.pairCount || 1}{' '}
                      {(pricing.pairCount || 1) === 1 ? 'pair' : 'pairs'})
                    </span>
                    <span>-PKR {(Number(pricing.pairDiscount) || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
              {(pricing.promoDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-cyan-200 font-semibold">
                  <span>Member Code ({pricing.promoCode || 'BH-DETECTED'} · 10% Off)</span>
                  <span>-PKR {(Number(pricing.promoDiscount) || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-white/80">
                <span>Subtotal</span>
                <span>PKR {(Number(pricing.subtotal) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Delivery Charge</span>
                <span>
                  {(Number(pricing.shippingCharge) || 0) === 0
                    ? 'FREE (PKR 0)'
                    : `PKR ${(Number(pricing.shippingCharge) || 0).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm sm:text-base pt-2 border-t border-white/10 font-display">
                <span>
                  {payment.method === 'bank_transfer'
                    ? 'Total Amount (Bank Transfer)'
                    : 'Total Due on Arrival'}
                </span>
                <span className="text-white text-lg">
                  PKR {(Number(pricing.total) || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Transactional Notification Note */}
          <p className="text-xs font-display text-white/70 mt-6 max-w-md mx-auto">
            Your order summary will be shortly sent to{' '}
            <span className="text-white font-bold">{customer.email}</span> and courier dispatch updates will be sent to{' '}
            <span className="text-white font-bold">{customer.phone}</span>.
          </p>

          {/* Primary Action Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleContinueShopping}
              className="w-full sm:w-auto min-w-[216px] py-3.5 px-7 selected-reveal-capsule text-white font-grotesk text-[15px] font-bold tracking-wider transition-all cursor-pointer active:scale-95 uppercase"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[10px] font-display text-white/70 border-t border-white/15 bg-white/[0.08] backdrop-blur-md">
        BAD HABIT · ARCHITECTURAL FASHION SHOWROOM · YOU KNOW YOU WANT IT
      </footer>
    </div>
  );
};
