import React from 'react';

export type PolicyType = 'shipping' | 'returns' | 'privacy' | 'terms';

interface PolicyModalProps {
  type: PolicyType | null;
  onClose: () => void;
}

const POLICY_CONTENT: Record<PolicyType, { title: string; subtitle: string; content: string[] }> = {
  shipping: {
    title: 'Shipping & Delivery Policy',
    subtitle: 'Luxury Courier Fulfilment Across Pakistan',
    content: [
      'BAD HABIT partners with premier logistics couriers across Pakistan to deliver garments with white-glove care.',
      'STANDARD DELIVERY (PKR 250): Expected delivery within 3 to 5 business days to all cities, towns, and regions nationwide.',
      'EXPRESS DELIVERY (PKR 500): Priority air and direct road courier dispatched within 24 hours, arriving in 1 to 2 business days to major metropolitan areas (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad).',
      'TRACKING & PACKAGING: Each piece is enclosed in our signature architectural protective garment bag. A real-time tracking code is dispatched once your parcel leaves our studio.',
      'CASH ON DELIVERY (COD): Pay in cash upon physical receipt of the parcel at your doorstep. Courier riders provide an official delivery receipt.',
    ],
  },
  returns: {
    title: 'Returns & Exchange Policy',
    subtitle: '7-Day Architectural Assurance',
    content: [
      'ELIGIBILITY: Garments may be returned or exchanged for an alternative size or colour within 7 days of delivery.',
      'CONDITION: Articles must be unworn, unwashed, unaltered, and retained in their original packaging with all BAD HABIT tags intact.',
      'EXCHANGE PROCESS: Contact our concierge service with your order number. A courier will collect the article from your address.',
      'DEFECTIVE MERCHANDISE: In the rare event of a material flaw or manufacturing discrepancy, a full reimbursement or immediate replacement will be fulfilled at zero cost to you.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Data Integrity & Customer Confidentiality',
    content: [
      'DATA PROTECTION: BAD HABIT treats customer information with strict confidentiality. We do not sell, rent, or lease customer data to third parties.',
      'INFORMATION COLLECTED: We collect only the contact information (email, telephone number) and delivery destination necessary to process, verify, and fulfill your order.',
      'NO SENSITIVE CARD STORAGE: Payment processing adheres to PCI-DSS standards. We never receive or store raw banking or payment credentials.',
      'MARKETING COMMUNICATIONS: Promotional dispatches are optional and only transmitted if you explicitly opt-in during checkout. You may unsubscribe at any time.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'BAD HABIT Client Agreement',
    content: [
      'ORDER COMMITMENT: By confirming your order on BAD HABIT, you place an authoritative request for manufactured luxury garments at the stated PKR valuation.',
      'PAYMENT OBLIGATION: For Cash on Delivery (COD) orders, full payment in PKR is due upon presentation of the package by the delivery rider.',
      'PRODUCT ACCURACY: Garments are created with precision craftsmanship. Textures, drape, and tones correspond to the architectural photographs displayed in the showroom.',
      'LIMITATION OF LIABILITY: BAD HABIT ensures parcels are handed over to certified couriers in immaculate condition.',
    ],
  },
};

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;
  const policy = POLICY_CONTENT[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-3xl p-6 sm:p-8 bg-[#0a1828]/95 border border-white/30 backdrop-blur-2xl shadow-2xl flex flex-col text-white select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="pr-8 mb-4">
          <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-300 uppercase block mb-1">
            BAD HABIT CONCIERGE
          </span>
          <h3 id="policy-modal-title" className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {policy.title}
          </h3>
          <p className="text-xs text-white/60 font-mono mt-0.5">{policy.subtitle}</p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 my-2 text-xs sm:text-sm text-white/80 leading-relaxed font-sans divide-y divide-white/10">
          {policy.content.map((paragraph, idx) => (
            <p key={idx} className={idx > 0 ? 'pt-3' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="selected-reveal-capsule font-grotesk px-5 py-2 text-[13px] font-semibold text-white tracking-wider cursor-pointer"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};
