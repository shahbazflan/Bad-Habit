import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Official Product Catalogue with Authoritative Prices & Stock
const CATALOG_ITEMS = [
  // Authoritative Trousers Collection
  { id: 'BH-T01', name: 'Midnight Blue', price: 6499, stock: 12 },
  { id: 'BH-T06', name: 'Ivory Trousers', price: 6499, stock: 8 },
  { id: 'BH-T07', name: 'Sage Trousers', price: 6499, stock: 11 },
  { id: 'BH-T08', name: 'Stone Trousers', price: 6499, stock: 10 },
  { id: 'BH-T10', name: 'Classic Brown Trousers', price: 6499, stock: 9 },
  { id: 'BH-T09', name: 'Deep Charcoal Balloon Pants', price: 7999, stock: 9 },
  { id: 'BH-T05', name: 'Ash Baggy', price: 6499, stock: 14 },
  { id: 'BH-T11', name: 'Chocolate Balloon Pants', price: 7999, stock: 0, soldOut: true },

  // Authoritative Hoodies & Sweatshirts Collection
  { id: 'BH-H01', name: 'Storm Blue Sweatshirt', price: 4499, stock: 12 },
  { id: 'BH-H02', name: 'Onyx Hoodie', price: 4499, stock: 15 },
  { id: 'BH-H03', name: 'Ivory Sweatshirt', price: 4499, stock: 10 },
  { id: 'BH-H04', name: 'Dusty Rose Hoodie', price: 4499, stock: 8 },
  { id: 'BH-H05', name: 'Off-White Hoodie', price: 4499, stock: 10 },
  { id: 'BH-H06', name: 'Charcoal Raglan Hoodie', price: 4499, stock: 10 },
  { id: 'BH-H07', name: 'Slate Grey Sweatshirt', price: 4499, stock: 10 },
  { id: 'BH-H08', name: 'Washed Umber Hoodie', price: 4499, stock: 10 },
  { id: 'BH-H09', name: 'Oatmeal Hoodie', price: 4499, stock: 12 },

  // Authoritative Shirts Collection
  { id: 'BH-S01', name: 'Foam BOXY', price: 4999, stock: 12 },
  { id: 'BH-S02', name: 'Cream BOXY', price: 4999, stock: 10 },
  { id: 'BH-S03', name: 'Espresso BOXY', price: 4999, stock: 10 },
  { id: 'BH-S04', name: 'Maroon BOXY', price: 4999, stock: 14 },
  { id: 'BH-S05', name: 'Magnum BOXY', price: 4999, stock: 12 },
  { id: 'BH-S06', name: 'Rough BOXY', price: 4999, stock: 11 },

  // Backwards compatibility legacy aliases
  { id: 'BH-001', name: 'Midnight Blue', price: 6499, stock: 12 },
  { id: 'BH-002', name: 'Cream', price: 6499, stock: 8 },
  { id: 'BH-003', name: 'Mocha Essentials', price: 6499, stock: 15 },
  { id: 'BH-004', name: 'Latte Essentials', price: 6499, stock: 10 },
  { id: 'BH-005', name: 'Milk Foam', price: 6499, stock: 6 },
  { id: 'BH-006', name: 'Charcoal Balloon Trousers', price: 8000, stock: 9 },
  { id: 'BH-007', name: 'Ash Baggy', price: 6499, stock: 14 },
  { id: 'BH-008', name: 'Ivory Relaxed Linen', price: 6499, stock: 7 },
  { id: 'BH-009', name: 'Sage', price: 6499, stock: 11 },
  { id: 'BH-010', name: 'Stone', price: 6499, stock: 10 },
  { id: 'BH-011', name: 'Chocolate Balloon Pants', price: 7999, stock: 0, soldOut: true },
];

const SHIPPING_METHODS: Record<string, { id: string; name: string; charge: number; estimate: string; description: string }> = {
  standard: {
    id: 'standard',
    name: 'Standard Courier Delivery',
    charge: 250,
    estimate: '3–5 business days',
    description: 'Tracked ground courier to all cities & towns across Pakistan',
  },
  express: {
    id: 'express',
    name: 'Express Courier Delivery',
    charge: 500,
    estimate: '1–2 business days',
    description: 'Priority courier with direct dispatch to major metropolitan hubs',
  },
};

const VALID_SIZES = ['S', 'M', 'L', 'XL'];
const PAIR_DISCOUNT_RATE = 0.15;

function calculateServerPairPricing(validatedItems: Array<{ productId: string; unitPrice: number; quantity: number }>) {
  const topUnitPrices: number[] = [];
  const trouserUnitPrices: number[] = [];
  let rawSubtotal = 0;

  for (const item of validatedItems) {
    rawSubtotal += item.unitPrice * item.quantity;
    if (item.productId.startsWith('BH-S') || item.productId.startsWith('BH-H')) {
      for (let i = 0; i < item.quantity; i++) topUnitPrices.push(item.unitPrice);
    } else if (item.productId.startsWith('BH-T') || item.productId.startsWith('BH-0')) {
      for (let i = 0; i < item.quantity; i++) trouserUnitPrices.push(item.unitPrice);
    }
  }

  topUnitPrices.sort((a, b) => b - a);
  trouserUnitPrices.sort((a, b) => b - a);

  const pairCount = Math.min(topUnitPrices.length, trouserUnitPrices.length);
  let pairDiscount = 0;
  for (let i = 0; i < pairCount; i++) {
    pairDiscount += Math.round((topUnitPrices[i] + trouserUnitPrices[i]) * PAIR_DISCOUNT_RATE);
  }

  const subtotal = Math.max(0, rawSubtotal - pairDiscount);
  return { rawSubtotal, pairCount, pairDiscount, subtotal };
}

const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerlessRuntime
  ? path.join('/tmp', 'bad-habit-data')
  : path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');

const memoryOrders: any[] = [];
const memoryMembers: any[] = [];
const idempotencyCache = new Map<string, any>();

const ensureOrderStore = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(MEMBERS_FILE)) {
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify([], null, 2));
    }
    return true;
  } catch {
    return false;
  }
};

const readOrders = (): any[] => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to in-memory orders in read-only runtimes
  }
  return memoryOrders;
};

const saveOrder = (order: any) => {
  memoryOrders.unshift(order);
  if (memoryOrders.length > 200) memoryOrders.pop();

  try {
    if (ensureOrderStore()) {
      const orders = readOrders();
      const filtered = orders.filter((o: any) => o.orderNumber !== order.orderNumber);
      filtered.unshift(order);
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(filtered, null, 2));
    }
  } catch (err: any) {
    console.warn('[BAD HABIT] File order persistence skipped:', err?.message || err);
  }
};

const normalizeEmail = (raw: unknown): string => String(raw ?? '').trim().toLowerCase();

const normalizePakPhone = (raw: unknown): string => {
  const digits = String(raw ?? '').replace(/[\s\-\(\)]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+92')) return `0${digits.slice(3).replace(/^0+/, '')}`;
  if (digits.startsWith('0092')) return `0${digits.slice(4).replace(/^0+/, '')}`;
  if (digits.startsWith('92') && digits.length >= 12) return `0${digits.slice(2).replace(/^0+/, '')}`;
  if (digits.startsWith('3') && digits.length === 10) return `0${digits}`;
  return digits;
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPakPhone = (raw: string): boolean => {
  const cleaned = String(raw ?? '').replace(/[\s\-\(\)]/g, '');
  return /^(?:\+92|0092|92)?0?3[0-9]{9}$/.test(cleaned);
};

const MEMBER_PROMO_CODE = 'BH-DETECTED';
const MEMBER_FIRST_ORDER_RATE = 0.10;

const PRODUCT_IMAGE_MAP: Record<string, { image: string; category: string }> = {
  'BH-T01': { image: '/assets/trousers_v2/midnight_blue_front_only.webp', category: 'Trousers' },
  'BH-T06': { image: '/assets/trousers_v2/ivory_trousers_front_only.webp', category: 'Trousers' },
  'BH-T07': { image: '/assets/trousers_v2/sage_trousers_front_only.webp', category: 'Trousers' },
  'BH-T08': { image: '/assets/trousers_v2/stone_trousers_front_only.webp', category: 'Trousers' },
  'BH-T10': { image: '/assets/trousers_v2/classic_brown_front_only.webp', category: 'Trousers' },
  'BH-T09': { image: '/assets/trousers_v2/deep_charcoal_front_only.webp', category: 'Trousers' },
  'BH-T05': { image: '/assets/trousers_v2/ash_baggy_front_only.webp', category: 'Trousers' },
  'BH-T11': { image: '/assets/trousers_v2/chocolate_balloon_front_only.webp', category: 'Trousers' },
  'BH-H01': { image: '/assets/hoodies/storm_blue_front_only.webp', category: 'Hoodies' },
  'BH-H02': { image: '/assets/hoodies/onyx_hoodie_front_only.webp', category: 'Hoodies' },
  'BH-H03': { image: '/assets/hoodies/ivory_sweatshirt_front_only.webp', category: 'Hoodies' },
  'BH-H04': { image: '/assets/hoodies/dusty_rose_hoodie_front_only.webp', category: 'Hoodies' },
  'BH-H05': { image: '/assets/hoodies/off_white_hoodie_front_only.webp', category: 'Hoodies' },
  'BH-H06': { image: '/assets/hoodies/charcoal_raglan_hoodie_front.webp', category: 'Hoodies' },
  'BH-H07': { image: '/assets/hoodies/slate_grey_sweatshirt_front.webp', category: 'Hoodies' },
  'BH-H08': { image: '/assets/hoodies/washed_umber_hoodie_front.webp', category: 'Hoodies' },
  'BH-H09': { image: '/assets/hoodies/oatmeal_hoodie_front.webp', category: 'Hoodies' },
  'BH-S05': { image: '/assets/aistudio/MAGNUM_BOXY_FRONT__36e853c5.png', category: 'Shirts' },
  'BH-S06': { image: '/assets/aistudio/ROUGH_BOXY_FRONT__a3520722.png', category: 'Shirts' },
  'BH-S04': { image: '/assets/aistudio/MAROON_BOXY_FRONT__dce5cb1c.png', category: 'Shirts' },
  'BH-S03': { image: '/assets/aistudio/ESPRESSO_BOXYFRONT_.png_0d972f00.png', category: 'Shirts' },
  'BH-S02': { image: '/assets/aistudio/IVORY_BOXY_front_png_8c2431ce', category: 'Shirts' },
  'BH-S01': { image: '/assets/aistudio/FOAM_BOXY_FRONT__348b6797.png', category: 'Shirts' },
};

const readMembers = (): any[] => {
  try {
    if (fs.existsSync(MEMBERS_FILE)) {
      const data = fs.readFileSync(MEMBERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to memoryMembers
  }
  return memoryMembers;
};

const writeMembers = (members: any[]) => {
  memoryMembers.length = 0;
  memoryMembers.push(...members.slice(0, 500));

  try {
    if (ensureOrderStore()) {
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2));
    }
  } catch (err: any) {
    console.warn('[BAD HABIT] File member persistence skipped:', err?.message || err);
  }
};

const upsertMemberRecord = (member: any) => {
  const members = readMembers();
  const filtered = members.filter((m: any) => m.id !== member.id);
  filtered.unshift(member);
  writeMembers(filtered);
};

const findAllMatchingMembers = ({
  memberId,
  email,
  phone,
}: {
  memberId?: string;
  email?: string;
  phone?: string;
}) => {
  const members = readMembers();
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePakPhone(phone);

  return members.filter((m: any) => {
    if (memberId && m.id === memberId) return true;
    if (normEmail && normalizeEmail(m.email) === normEmail) return true;
    if (normPhone && normalizePakPhone(m.phone) === normPhone) return true;
    return false;
  });
};

const findMemberByIdentity = ({
  memberId,
  email,
  phone,
}: {
  memberId?: string;
  email?: string;
  phone?: string;
}) => {
  const matches = findAllMatchingMembers({ memberId, email, phone });
  if (matches.length === 0) return null;
  if (memberId) {
    const byId = matches.find((m: any) => m.id === memberId);
    if (byId) return byId;
  }
  const normEmail = normalizeEmail(email);
  if (normEmail) {
    const byEmail = matches.find((m: any) => normalizeEmail(m.email) === normEmail);
    if (byEmail) return byEmail;
  }
  return matches[0];
};

const hasPriorOrderByIdentity = ({
  memberId,
  email,
  phone,
}: {
  memberId?: string;
  email?: string;
  phone?: string;
}): boolean => {
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePakPhone(phone);
  const orders = readOrders();
  const members = readMembers();

  const orderedInHistory = orders.some((o: any) => {
    const oEmail = normalizeEmail(o?.customer?.email);
    const oPhone = normalizePakPhone(o?.customer?.phone);
    const oMemberId = o?.memberId ? String(o.memberId) : '';
    return (
      (memberId && oMemberId === memberId) ||
      (normEmail && oEmail === normEmail) ||
      (normPhone && oPhone === normPhone)
    );
  });
  if (orderedInHistory) return true;

  return members.some((m: any) => {
    if ((m.orderCount || 0) <= 0 && !m.firstOrderDiscountUsed) return false;
    const mEmail = normalizeEmail(m.email);
    const mPhone = normalizePakPhone(m.phone);
    return (
      (memberId && m.id === memberId) ||
      (normEmail && mEmail === normEmail) ||
      (normPhone && mPhone === normPhone)
    );
  });
};

const validateFirstOrderPromo = ({
  code,
  memberId,
  email,
  phone,
  subtotalAfterPair,
  clientPriorOrderUsed,
}: {
  code?: string;
  memberId?: string;
  email?: string;
  phone?: string;
  subtotalAfterPair: number;
  clientPriorOrderUsed?: boolean;
}) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, applied: false, discountAmount: 0, error: '' };
  }
  if (normalizedCode !== MEMBER_PROMO_CODE) {
    return {
      valid: false,
      applied: false,
      discountAmount: 0,
      error: `Invalid promo code "${normalizedCode}".`,
    };
  }

  const matchedMembers = findAllMatchingMembers({ memberId, email, phone });
  const primaryMember = findMemberByIdentity({ memberId, email, phone });
  if (!primaryMember || matchedMembers.length === 0) {
    return {
      valid: false,
      applied: false,
      requiresMembership: true,
      discountAmount: 0,
      error: 'Become a member and get a flat 10% off on your first order. Join to unlock your code.',
    };
  }

  const alreadyUsed =
    Boolean(clientPriorOrderUsed) ||
    matchedMembers.some(
      (m: any) =>
        Boolean(m.firstOrderDiscountUsed) ||
        Number(m.orderCount || 0) > 0 ||
        hasPriorOrderByIdentity({ memberId: m.id, email: m.email, phone: m.phone })
    ) ||
    hasPriorOrderByIdentity({ memberId, email, phone });

  if (alreadyUsed) {
    for (const m of matchedMembers) {
      if (!m.firstOrderDiscountUsed || Number(m.orderCount || 0) === 0) {
        m.firstOrderDiscountUsed = true;
        m.orderCount = Math.max(1, Number(m.orderCount || 0));
        m.updatedAt = new Date().toISOString();
        upsertMemberRecord(m);
      }
    }
    return {
      valid: false,
      applied: false,
      alreadyUsed: true,
      discountAmount: 0,
      error: `Code ${MEMBER_PROMO_CODE} applies to your first order only and has already been used for this account.`,
    };
  }

  const discountAmount = Math.round(Math.max(0, subtotalAfterPair) * MEMBER_FIRST_ORDER_RATE);
  return {
    valid: true,
    applied: true,
    code: MEMBER_PROMO_CODE,
    discountRate: MEMBER_FIRST_ORDER_RATE,
    discountAmount,
    memberId: primaryMember.id,
  };
};

const ORDER_NOTIFICATION_EMAIL =
  (process.env.ORDER_NOTIFICATION_EMAIL || '').trim() || 'wear@storebadhabit.com';

const formatFromHeader = (rawAddress: string) => {
  const trimmed = rawAddress.trim();
  if (trimmed.includes('<') && trimmed.includes('>')) return trimmed;
  return `"BAD HABIT" <${trimmed}>`;
};

const getEmailTransportConfig = () => {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const rawSmtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpUser = (
    (process.env.SMTP_USER || '').trim() ||
    (rawSmtpPass ? ORDER_NOTIFICATION_EMAIL : '')
  ).trim();
  const smtpHost = (
    (process.env.SMTP_HOST || '').trim() ||
    (smtpUser.toLowerCase().endsWith('@storebadhabit.com') ? 'smtp.sg.aliyun.com' : '')
  ).toLowerCase();
  const smtpPort = Number(
    (process.env.SMTP_PORT || '').trim() || (smtpHost.includes('aliyun.com') ? 465 : 587)
  );
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  const customerEmailEnv = (process.env.CUSTOMER_ORDER_EMAIL_ENABLED || 'true').trim().toLowerCase();
  const customerEmailEnvEnabled = !['false', '0', 'no', 'off'].includes(customerEmailEnv);

  return {
    resendKey,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass: rawSmtpPass,
    useCustomSmtp: Boolean(smtpHost && smtpUser && rawSmtpPass),
    gmailUser,
    gmailPass,
    useGmailSmtp: Boolean(gmailUser && gmailPass),
    customerEmailEnvEnabled,
  };
};

const resolvePublicAssetUrl = (assetPath?: string, fallbackOrigin?: string) => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
  const envBase = (process.env.APP_URL || '').trim();
  const rawFallback = (fallbackOrigin || '').trim();
  const isPrivateOrAuthOrigin =
    /localhost|127\.0\.0\.1|ais-dev-|ais-pre-|\.run\.app|\.ai\.studio/i.test(rawFallback);
  const base = (
    envBase ||
    (!isPrivateOrAuthOrigin && rawFallback ? rawFallback : 'https://www.storebadhabit.com')
  ).replace(/\/+$/, '');
  return `${base}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface EmailInlineAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  contentDisposition: 'inline';
  cid: string;
}

const prepareOrderEmailThumbnails = async (
  order: any,
  baseOrigin?: string
): Promise<{ srcByItemIndex: string[]; attachments: EmailInlineAttachment[] }> => {
  const attachments: EmailInlineAttachment[] = [];
  const cidByProductId = new Map<string, string>();
  const srcByItemIndex: string[] = [];

  for (const item of order.items || []) {
    const productId = String(item.productId || '').trim();
    const existingCid = productId ? cidByProductId.get(productId) : undefined;
    if (existingCid) {
      srcByItemIndex.push(`cid:${existingCid}`);
      continue;
    }

    const thumbRelPath = productId ? `/assets/email-thumbs/${productId}.png` : '';
    const diskThumbPath = thumbRelPath
      ? path.join(process.cwd(), 'public', thumbRelPath.replace(/^\/+/, ''))
      : '';
    const publicThumbUrl = thumbRelPath
      ? resolvePublicAssetUrl(thumbRelPath, baseOrigin)
      : resolvePublicAssetUrl(item.image, baseOrigin);

    let pngBuffer: Buffer | null = null;
    if (diskThumbPath && fs.existsSync(diskThumbPath)) {
      try {
        pngBuffer = fs.readFileSync(diskThumbPath);
      } catch {
        pngBuffer = null;
      }
    }

    if (!pngBuffer && publicThumbUrl && publicThumbUrl.toLowerCase().endsWith('.png')) {
      try {
        const res = await fetch(publicThumbUrl, { signal: AbortSignal.timeout(3000) });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.startsWith('image/')) {
          pngBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {
        pngBuffer = null;
      }
    }

    if (pngBuffer && pngBuffer.length > 0 && productId) {
      const cid = `bh-item-${productId.toLowerCase()}@storebadhabit.com`;
      cidByProductId.set(productId, cid);
      attachments.push({
        filename: `${productId}.png`,
        content: pngBuffer,
        contentType: 'image/png',
        contentDisposition: 'inline',
        cid,
      });
      srcByItemIndex.push(`cid:${cid}`);
    } else {
      srcByItemIndex.push(publicThumbUrl || resolvePublicAssetUrl(item.image, baseOrigin));
    }
  }

  return { srcByItemIndex, attachments };
};

const buildOrderSummaryContent = (
  order: any,
  options: { forCustomer?: boolean; baseOrigin?: string; itemImageSrcs?: string[] } = {}
) => {
  const isBankTransfer = order.payment?.method === 'bank_transfer';
  const totalArticlesCount = order.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0);

  const itemsLines = order.items
    .map(
      (it: any) =>
        `- ${it.name} (${it.productId}) | Size: ${it.size} | Qty: ${it.quantity} | Line Total: PKR ${it.lineTotal.toLocaleString()}`
    )
    .join('\n');

  const subject = options.forCustomer
    ? `BAD HABIT · Order #${order.orderNumber} Invoice`
    : `[BAD HABIT Order #${order.orderNumber}] ${order.delivery.firstName} ${order.delivery.lastName} · ${order.pricing.formattedTotal}`;

  const textBody = [
    `BAD HABIT · ORDER INVOICE`,
    `ORDER #${order.orderNumber}`,
    `BAD HABIT DETECTED. Your order has been received.`,
    `Placed At: ${order.createdAt}`,
    `========================================`,
    ``,
    `ORDERED ARTICLES (${totalArticlesCount})`,
    itemsLines,
    ``,
    order.pricing.pairDiscount > 0 ? `Articles Total: ${order.pricing.formattedRawSubtotal}` : '',
    order.pricing.pairDiscount > 0
      ? `Pair Discount (15% Off · ${order.pricing.pairCount} ${order.pricing.pairCount === 1 ? 'pair' : 'pairs'}): -${order.pricing.formattedPairDiscount}`
      : '',
    order.pricing.promoDiscount > 0
      ? `First-Order Member Code (${order.pricing.promoCode || MEMBER_PROMO_CODE} · 10% Off): -${order.pricing.formattedPromoDiscount}`
      : '',
    `Delivery Charge: ${order.pricing.shippingCharge === 0 ? 'FREE (PKR 0)' : order.pricing.formattedShippingCharge}`,
    `Order total: ${order.pricing.formattedTotal}`,
    ``,
    `DELIVERY DESTINATION`,
    `${order.delivery.firstName} ${order.delivery.lastName}`,
    `${order.delivery.address}${order.delivery.apartment ? `, ${order.delivery.apartment}` : ''}`,
    `${order.delivery.city}, ${order.delivery.province}${order.delivery.postalCode ? ` ${order.delivery.postalCode}` : ''}, ${order.delivery.country}`,
    `${order.customer.phone} · ${order.customer.email}`,
    order.delivery.landmark ? `Landmark: ${order.delivery.landmark}` : '',
    order.delivery.instructions ? `Instructions: ${order.delivery.instructions}` : '',
    ``,
    `PAYMENT METHOD`,
    `${order.payment.methodName}`,
    isBankTransfer
      ? `Account number: ${order.payment.accountNumber} (${order.payment.accountTitle || 'Meezan Bank - Hassan Ahmed'}) · Send screenshot to: ${order.payment.confirmationPhone}`
      : `${order.payment.statusLabel} · ${order.shippingMethod.estimate} (${order.shippingMethod.name})`,
    ``,
    `storebadhabit.com`,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlItemsRows = order.items
    .map((it: any, idx: number) => {
      const thumbFallback = it.productId
        ? resolvePublicAssetUrl(`/assets/email-thumbs/${it.productId}.png`, options.baseOrigin)
        : resolvePublicAssetUrl(it.image, options.baseOrigin);
      const imgSrc = options.itemImageSrcs?.[idx] || thumbFallback;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #cbd9e6;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="56" height="56" valign="middle" style="width:56px;height:56px;background-color:#dbeaf7;padding:0;text-align:center;">
                  ${
                    imgSrc
                      ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(it.name)}" width="56" height="56" style="display:block;width:56px;height:56px;margin:0;border:0;" />`
                      : ''
                  }
                </td>
                <td valign="middle" style="padding-left:16px;">
                  <div style="font-size:16px;font-weight:800;line-height:1.25;color:#133853;">${escapeHtml(it.name)}</div>
                  <div style="font-size:13px;line-height:1.4;color:#2b4c65;margin-top:3px;">Size ${escapeHtml(it.size)} &nbsp;/&nbsp; Qty ${escapeHtml(it.quantity)}</div>
                </td>
                <td valign="middle" align="right" style="padding-left:12px;text-align:right;white-space:nowrap;font-size:15px;font-weight:600;color:#133853;">
                  PKR ${Number(it.lineTotal || 0).toLocaleString()}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  const fullAddressLine = [
    order.delivery.address,
    order.delivery.apartment,
    `${order.delivery.city}, ${order.delivery.province}${order.delivery.postalCode ? ` ${order.delivery.postalCode}` : ''}`,
    order.delivery.country,
  ]
    .filter(Boolean)
    .map((part) => escapeHtml(part))
    .join('<br/>');

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>BAD HABIT · Order #${escapeHtml(order.orderNumber)}</title>
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    @media (prefers-color-scheme: dark) {
      .bh-top-bar { background-color: #133853 !important; }
      .bh-top-brand { color: #ffffff !important; }
      .bh-top-label { color: #e2edf6 !important; }
      .bh-hero-box { background-color: #173d59 !important; }
      .bh-hero-ink { color: #ffffff !important; }
      .bh-hero-sub { color: #dcecf8 !important; }
    }
    [data-ogsc] .bh-top-bar { background-color: #133853 !important; }
    [data-ogsc] .bh-top-brand { color: #ffffff !important; }
    [data-ogsc] .bh-top-label { color: #e2edf6 !important; }
    [data-ogsc] .bh-hero-box { background-color: #173d59 !important; }
    [data-ogsc] .bh-hero-ink { color: #ffffff !important; }
    [data-ogsc] .bh-hero-sub { color: #dcecf8 !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#133853;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef4f9;padding:16px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-collapse:collapse;overflow:hidden;">
          <!-- TOP NAVY HEADER BAR -->
          <tr>
            <td class="bh-top-bar" style="background-color:#133853;padding:15px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="left" valign="middle" class="bh-top-brand" style="font-size:15px;font-weight:800;letter-spacing:0.05em;color:#ffffff;text-transform:uppercase;">
                    BAD HABIT
                  </td>
                  <td align="right" valign="middle" class="bh-top-label" style="font-size:12px;font-weight:500;letter-spacing:0.08em;color:#e2edf6;text-transform:uppercase;">
                    ORDER INVOICE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SKY-BLUE HERO BANNER (Solid dark-mode-safe background so text never washes out) -->
          <tr>
            <td class="bh-hero-box" style="background-color:#a5d1ef;padding:34px 32px 32px;">
              <div class="bh-hero-sub" style="font-size:12px;font-weight:700;letter-spacing:0.06em;color:#0e2c42;text-transform:uppercase;margin-bottom:14px;">
                ORDER #${escapeHtml(order.orderNumber)}
              </div>
              <div class="bh-hero-ink" style="font-size:44px;font-weight:900;line-height:0.98;letter-spacing:-0.01em;color:#0e2c42;text-transform:uppercase;margin:0 0 16px 0;">
                BAD HABIT<br/>DETECTED.
              </div>
              <div class="bh-hero-sub" style="font-size:15px;font-weight:500;line-height:1.4;color:#0e2c42;">
                Your order has been received.
              </div>
            </td>
          </tr>

          <!-- MAIN WHITE BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 32px 26px;">
              <div style="font-size:12px;font-weight:800;letter-spacing:0.05em;color:#133853;text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid #cbd9e6;">
                ORDERED ARTICLES (${totalArticlesCount})
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                ${htmlItemsRows}
              </table>

              ${
                order.pricing.pairDiscount > 0 || order.pricing.promoDiscount > 0 || order.pricing.shippingCharge > 0 || isBankTransfer
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:14px;font-size:13px;color:#2b4c65;">
                      ${
                        order.pricing.pairDiscount > 0
                          ? `<tr>
                              <td style="padding:3px 0;">Articles Total</td>
                              <td align="right" style="padding:3px 0;text-align:right;">${escapeHtml(order.pricing.formattedRawSubtotal)}</td>
                            </tr>
                            <tr>
                              <td style="padding:3px 0;color:#0f766e;font-weight:600;">Pair Discount (15% Off · ${order.pricing.pairCount} ${order.pricing.pairCount === 1 ? 'pair' : 'pairs'})</td>
                              <td align="right" style="padding:3px 0;text-align:right;color:#0f766e;font-weight:600;">-${escapeHtml(order.pricing.formattedPairDiscount)}</td>
                            </tr>`
                          : ''
                      }
                      ${
                        order.pricing.promoDiscount > 0
                          ? `<tr>
                              <td style="padding:3px 0;color:#0f766e;font-weight:600;">First-Order Member Code (${escapeHtml(order.pricing.promoCode || MEMBER_PROMO_CODE)} · 10% Off)</td>
                              <td align="right" style="padding:3px 0;text-align:right;color:#0f766e;font-weight:600;">-${escapeHtml(order.pricing.formattedPromoDiscount)}</td>
                            </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:3px 0;">Delivery (${escapeHtml(order.shippingMethod.name)})</td>
                        <td align="right" style="padding:3px 0;text-align:right;">${order.pricing.shippingCharge === 0 ? 'FREE (PKR 0)' : escapeHtml(order.pricing.formattedShippingCharge)}</td>
                      </tr>
                    </table>`
                  : ''
              }

              <!-- ORDER TOTAL HIGHLIGHT BOX -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:16px;background-color:#e9f2f9;">
                <tr>
                  <td align="left" valign="middle" style="padding:16px 18px;font-size:16px;font-weight:800;color:#133853;">
                    Order total
                  </td>
                  <td align="right" valign="middle" style="padding:16px 18px;font-size:19px;font-weight:800;color:#133853;text-align:right;white-space:nowrap;">
                    ${escapeHtml(order.pricing.formattedTotal)}
                  </td>
                </tr>
              </table>

              <!-- DELIVERY DESTINATION -->
              <div style="margin-top:26px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.05em;color:#133853;text-transform:uppercase;margin-bottom:6px;">
                  DELIVERY DESTINATION
                </div>
                <div style="font-size:14px;line-height:1.55;color:#1f3f58;">
                  <strong style="color:#133853;">${escapeHtml(order.delivery.firstName)} ${escapeHtml(order.delivery.lastName)}</strong><br/>
                  ${fullAddressLine}<br/>
                  ${escapeHtml(order.customer.phone)} &middot; ${escapeHtml(order.customer.email)}
                  ${order.delivery.landmark ? `<br/>Landmark: ${escapeHtml(order.delivery.landmark)}` : ''}
                  ${order.delivery.instructions ? `<br/>Notes: ${escapeHtml(order.delivery.instructions)}` : ''}
                </div>
              </div>

              <!-- PAYMENT METHOD -->
              <div style="margin-top:22px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.05em;color:#133853;text-transform:uppercase;margin-bottom:6px;">
                  PAYMENT METHOD
                </div>
                <div style="font-size:14px;line-height:1.55;color:#1f3f58;">
                  <strong style="color:#133853;">${escapeHtml(order.payment.methodName)}</strong>
                  ${
                    isBankTransfer
                      ? `<br/>Account: <strong>${escapeHtml(order.payment.accountNumber)}</strong> (${escapeHtml(order.payment.accountTitle || 'Meezan Bank - Hassan Ahmed')})<br/>Send transfer screenshot to: <strong>${escapeHtml(order.payment.confirmationPhone)}</strong>`
                      : `<br/>${escapeHtml(order.payment.statusLabel)} &middot; ${escapeHtml(order.shippingMethod.estimate)}`
                  }
                </div>
              </div>
            </td>
          </tr>

          <!-- FOOTER BAR -->
          <tr>
            <td style="background-color:#ffffff;border-top:1px solid #cbd9e6;padding:18px 32px 22px;">
              <a href="https://www.storebadhabit.com" style="font-size:13px;color:#133853;text-decoration:none;font-weight:500;">
                storebadhabit.com
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, textBody, htmlBody, itemsLines, isBankTransfer };
};

const dispatchEmailToRecipient = async ({
  order,
  toEmail,
  replyTo,
  subject,
  textBody,
  htmlBody,
  attachments,
  itemsLines,
  allowRelayFallback,
}: {
  order: any;
  toEmail: string;
  replyTo: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  attachments?: EmailInlineAttachment[];
  itemsLines: string;
  isBankTransfer: boolean;
  allowRelayFallback: boolean;
}): Promise<{ sent: boolean; provider: string; recipient: string; reason?: string; activationRequired?: boolean }> => {
  let lastError = '';
  const cfg = getEmailTransportConfig();
  const rawEmailFrom = (process.env.EMAIL_FROM || '').trim();

  // 1. Direct Resend API (when RESEND_API_KEY is configured)
  if (cfg.resendKey) {
    try {
      const resendBody: Record<string, any> = {
        from: rawEmailFrom || 'BAD HABIT Orders <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: replyTo,
        subject,
        text: textBody,
        html: htmlBody,
      };
      if (attachments && attachments.length > 0) {
        resendBody.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          content_id: att.cid,
        }));
      }
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendBody),
        signal: AbortSignal.timeout(8000),
      });
      if (!resendRes.ok) {
        const errText = await resendRes.text();
        throw new Error(`Resend HTTP ${resendRes.status}: ${errText}`);
      }
      console.log(`[BAD HABIT] Order email sent via Resend to ${toEmail} for ${order.orderNumber}`);
      return { sent: true, provider: 'resend', recipient: toEmail };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`[BAD HABIT] Failed sending order email via Resend to ${toEmail}:`, lastError);
    }
  }

  // 2A. Direct Domain / Enterprise SMTP (e.g., wear@storebadhabit.com via Aliyun Mail SSL/465)
  if (cfg.useCustomSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: { minVersion: 'TLSv1.2' },
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      });

      const safeCustomFrom =
        rawEmailFrom && !rawEmailFrom.toLowerCase().includes('resend.dev')
          ? rawEmailFrom
          : cfg.smtpUser;
      await transporter.sendMail({
        from: formatFromHeader(safeCustomFrom),
        to: toEmail,
        replyTo,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });
      console.log(`[BAD HABIT] Order email sent via Custom SMTP (${cfg.smtpHost}) to ${toEmail} for ${order.orderNumber}`);
      return {
        sent: true,
        provider: 'custom_smtp',
        recipient: toEmail,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`[BAD HABIT] Failed sending order email via Custom SMTP to ${toEmail}:`, lastError);
    }
  }

  // 2B. Gmail SMTP fallback (supports Google App Password)
  if (cfg.useGmailSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
      });

      const safeGmailFrom =
        rawEmailFrom && !rawEmailFrom.toLowerCase().includes('resend.dev')
          ? rawEmailFrom
          : cfg.gmailUser;
      await transporter.sendMail({
        from: formatFromHeader(safeGmailFrom),
        to: toEmail,
        replyTo,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });
      console.log(`[BAD HABIT] Order email sent via Gmail SMTP to ${toEmail} for ${order.orderNumber}`);
      return {
        sent: true,
        provider: 'gmail_smtp',
        recipient: toEmail,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error(`[BAD HABIT] Failed sending order email via Gmail SMTP to ${toEmail}:`, lastError);
    }
  }

  if (!allowRelayFallback) {
    return {
      sent: false,
      provider: cfg.useCustomSmtp ? 'custom_smtp' : cfg.useGmailSmtp ? 'gmail_smtp' : cfg.resendKey ? 'resend' : 'none',
      recipient: toEmail,
      reason:
        lastError ||
        'Configure SMTP_PASS (or GMAIL_APP_PASSWORD / RESEND_API_KEY) in Environment Variables / Secrets to send confirmations directly to customers.',
    };
  }

  // 3. Zero-config HTTPS FormSubmit relay directly targeting store/automation inbox
  try {
    const originHeader = process.env.APP_URL || 'https://www.storebadhabit.com';
    const relayRes = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: originHeader,
          Referer: `${originHeader}/`,
        },
        body: JSON.stringify({
          _subject: subject,
          _replyto: replyTo,
          _template: 'table',
          _captcha: 'false',
          Order_Number: order.orderNumber,
          Placed_At: order.createdAt,
          Customer_Name: `${order.delivery.firstName} ${order.delivery.lastName}`,
          Customer_Email: order.customer.email,
          Customer_Phone: order.customer.phone,
          Delivery_Address: `${order.delivery.address}${order.delivery.apartment ? `, ${order.delivery.apartment}` : ''}, ${order.delivery.city}, ${order.delivery.province}${order.delivery.postalCode ? ` (${order.delivery.postalCode})` : ''}, ${order.delivery.country}`,
          Landmark_and_Notes: [order.delivery.landmark, order.delivery.instructions].filter(Boolean).join(' · ') || 'None',
          Payment_Method: order.payment.methodName,
          Shipping_Method: `${order.shippingMethod.name} (${order.shippingMethod.estimate})`,
          Articles_Ordered: itemsLines,
          Pair_Discount: order.pricing.pairDiscount > 0 ? `-${order.pricing.formattedPairDiscount} (${order.pricing.pairCount} pair)` : 'PKR 0',
          Delivery_Charge: order.pricing.shippingCharge === 0 ? 'FREE (PKR 0)' : order.pricing.formattedShippingCharge,
          Total_Amount: order.pricing.formattedTotal,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    const relayJson: any = await relayRes.json().catch(() => null);
    const relayOk = relayRes.ok && (relayJson?.success === 'true' || relayJson?.success === true);
    const needsActivation =
      typeof relayJson?.message === 'string' &&
      relayJson.message.toLowerCase().includes('activation');

    if (relayOk) {
      console.log(
        `[BAD HABIT] Order ${order.orderNumber} dispatched via HTTPS relay to ${toEmail}`
      );
      return {
        sent: true,
        provider: 'formsubmit_relay',
        recipient: toEmail,
      };
    }

    console.warn(
      `[BAD HABIT] Relay status for ${toEmail} (${order.orderNumber}):`,
      relayJson?.message || relayRes.status
    );
    return {
      sent: false,
      provider: 'formsubmit_relay',
      recipient: toEmail,
      activationRequired: needsActivation,
      reason: relayJson?.message || `HTTP ${relayRes.status}`,
    };
  } catch (err: any) {
    console.error(`[BAD HABIT] Relay dispatch error for ${toEmail}:`, err?.message || err);
    return {
      sent: false,
      provider: 'none',
      recipient: toEmail,
      reason: err?.message || 'Relay unavailable',
    };
  }
};

const sendOrderNotifications = async (
  order: any,
  sendCustomerSummary: boolean,
  baseOrigin?: string
) => {
  const cfg = getEmailTransportConfig();
  const { srcByItemIndex, attachments } = await prepareOrderEmailThumbnails(order, baseOrigin);
  const storePayload = buildOrderSummaryContent(order, {
    forCustomer: false,
    baseOrigin,
    itemImageSrcs: srcByItemIndex,
  });
  const automationEmail = (process.env.ORDER_AUTOMATION_EMAIL || '').trim();
  const customerEmailEnabled = sendCustomerSummary && cfg.customerEmailEnvEnabled;
  const webhookUrl = (process.env.ORDER_WEBHOOK_URL || '').trim();

  const storePromise = dispatchEmailToRecipient({
    order,
    toEmail: ORDER_NOTIFICATION_EMAIL,
    replyTo: order.customer.email,
    ...storePayload,
    attachments,
    allowRelayFallback: true,
  });

  const automationPromise =
    automationEmail && automationEmail.toLowerCase() !== ORDER_NOTIFICATION_EMAIL.toLowerCase()
      ? dispatchEmailToRecipient({
          order,
          toEmail: automationEmail,
          replyTo: order.customer.email,
          ...storePayload,
          attachments,
          allowRelayFallback: true,
        })
      : Promise.resolve(null);

  const customerPromise =
    customerEmailEnabled && order.customer?.email
      ? dispatchEmailToRecipient({
          order,
          toEmail: order.customer.email,
          replyTo: ORDER_NOTIFICATION_EMAIL,
          ...buildOrderSummaryContent(order, {
            forCustomer: true,
            baseOrigin,
            itemImageSrcs: srcByItemIndex,
          }),
          attachments,
          allowRelayFallback: false,
        })
      : Promise.resolve(null);

  const webhookPromise = webhookUrl
    ? fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.created',
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customer: order.customer,
          delivery: order.delivery,
          items: order.items,
          shippingMethod: order.shippingMethod,
          payment: order.payment,
          pricing: order.pricing,
          formattedSummary: storePayload.textBody,
        }),
        signal: AbortSignal.timeout(8000),
      })
        .then((hookRes) => hookRes.ok)
        .catch((err: any) => {
          console.error(
            `[BAD HABIT] Automation webhook failed for ${order.orderNumber}:`,
            err?.message || err
          );
          return false;
        })
    : Promise.resolve(false);

  const [storeNotification, automationNotification, customerNotification, webhookSent] =
    await Promise.all([storePromise, automationPromise, customerPromise, webhookPromise]);

  return {
    storeNotification,
    automationNotification,
    customerNotification,
    webhookSent,
  };
};

// Shared notification sender for non-order events (new member registration, wishlist updates)
const dispatchStoreEventEmail = async ({
  toEmail,
  replyTo,
  subject,
  textBody,
  htmlBody,
  attachments,
  relayFields,
  allowRelayFallback = true,
}: {
  toEmail: string;
  replyTo?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  attachments?: EmailInlineAttachment[];
  relayFields?: Record<string, string>;
  allowRelayFallback?: boolean;
}) => {
  const cfg = getEmailTransportConfig();
  const rawEmailFrom = (process.env.EMAIL_FROM || '').trim();
  let lastError = '';

  if (cfg.resendKey) {
    try {
      const resendBody: Record<string, any> = {
        from: rawEmailFrom || 'BAD HABIT <onboarding@resend.dev>',
        to: [toEmail],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text: textBody,
        html: htmlBody,
      };
      if (attachments && attachments.length > 0) {
        resendBody.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          content_id: att.cid,
        }));
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendBody),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { sent: true, provider: 'resend', recipient: toEmail };
      lastError = await res.text();
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  if (cfg.useCustomSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: { minVersion: 'TLSv1.2' },
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      });
      const safeCustomFrom =
        rawEmailFrom && !rawEmailFrom.toLowerCase().includes('resend.dev')
          ? rawEmailFrom
          : cfg.smtpUser;
      await transporter.sendMail({
        from: formatFromHeader(safeCustomFrom),
        to: toEmail,
        replyTo,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });
      return { sent: true, provider: 'custom_smtp', recipient: toEmail };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  if (cfg.useGmailSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
      });
      const safeGmailFrom =
        rawEmailFrom && !rawEmailFrom.toLowerCase().includes('resend.dev')
          ? rawEmailFrom
          : cfg.gmailUser;
      await transporter.sendMail({
        from: formatFromHeader(safeGmailFrom),
        to: toEmail,
        replyTo,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });
      return { sent: true, provider: 'gmail_smtp', recipient: toEmail };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  if (!allowRelayFallback) {
    return { sent: false, provider: 'none', recipient: toEmail, reason: lastError || 'Direct SMTP not configured' };
  }

  try {
    const originHeader = process.env.APP_URL || 'https://www.storebadhabit.com';
    const relayRes = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: originHeader,
          Referer: `${originHeader}/`,
        },
        body: JSON.stringify({
          _subject: subject,
          _replyto: replyTo || toEmail,
          _template: 'table',
          _captcha: 'false',
          ...(relayFields || { Message: textBody }),
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    const relayJson: any = await relayRes.json().catch(() => null);
    const relayOk = relayRes.ok && (relayJson?.success === 'true' || relayJson?.success === true);
    return {
      sent: relayOk,
      provider: 'formsubmit_relay',
      recipient: toEmail,
      reason: relayOk ? undefined : relayJson?.message || `HTTP ${relayRes.status}`,
    };
  } catch (err: any) {
    return { sent: false, provider: 'none', recipient: toEmail, reason: err?.message || 'Relay unavailable' };
  }
};

const sendMemberSignupNotification = async (member: any, baseOrigin?: string) => {
  const subject = `[BAD HABIT New Member] ${member.email} · ${member.phone}`;
  const textBody = [
    `BAD HABIT · NEW MEMBER REGISTRATION`,
    `Member ID: ${member.id}`,
    member.displayName ? `Name: ${member.displayName}` : '',
    `Email: ${member.email}`,
    `Phone: ${member.phone}`,
    `Promo Code Issued: ${MEMBER_PROMO_CODE} (Flat 10% Off First Order Only)`,
    `Registered At: ${member.createdAt}`,
    `storebadhabit.com`,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:16px;background:#eef4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#133853;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
    <tr><td style="background:#133853;padding:16px 28px;color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.06em;">BAD HABIT · NEW MEMBER SIGNUP</td></tr>
    <tr><td style="background:#a5d1ef;padding:28px;color:#0e2c42;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">MEMBER #${escapeHtml(member.id)}</div>
      <div style="font-size:32px;font-weight:900;line-height:1.05;margin:10px 0;">NEW MEMBER<br/>JOINED.</div>
      <div style="font-size:14px;font-weight:600;">First-Order Code Issued: ${MEMBER_PROMO_CODE} (10% Off First Order Only)</div>
    </td></tr>
    <tr><td style="padding:24px 28px;font-size:14px;line-height:1.6;">
      ${member.displayName ? `<div><strong>Name:</strong> ${escapeHtml(member.displayName)}</div>` : ''}
      <div><strong>Email:</strong> ${escapeHtml(member.email)}</div>
      <div><strong>Phone:</strong> ${escapeHtml(member.phone)}</div>
      <div><strong>Promo Code:</strong> ${MEMBER_PROMO_CODE} (10% off first order only)</div>
      <div><strong>Joined At:</strong> ${escapeHtml(member.createdAt)}</div>
    </td></tr>
    <tr><td style="border-top:1px solid #cbd9e6;padding:14px 28px;font-size:12px;color:#133853;">storebadhabit.com</td></tr>
  </table>
</body></html>`;

  const storePromise = dispatchStoreEventEmail({
    toEmail: ORDER_NOTIFICATION_EMAIL,
    replyTo: member.email,
    subject,
    textBody,
    htmlBody,
    relayFields: {
      Event: 'New Member Account Created',
      Member_ID: member.id,
      Member_Name: member.displayName || 'Customer',
      Member_Email: member.email,
      Member_Phone: member.phone,
      First_Order_Code: `${MEMBER_PROMO_CODE} (10% Off First Order Only)`,
      Joined_At: member.createdAt,
    },
    allowRelayFallback: true,
  });

  const customerWelcomeHtml = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:16px;background:#eef4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#133853;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
    <tr><td style="background:#133853;padding:16px 28px;color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.06em;">BAD HABIT · MEMBERSHIP</td></tr>
    <tr><td style="background:#a5d1ef;padding:30px 28px;color:#0e2c42;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">YOU KNOW YOU WANT IT</div>
      <div style="font-size:36px;font-weight:900;line-height:1.02;margin:12px 0;">WELCOME TO<br/>BAD HABIT.</div>
      <div style="font-size:15px;font-weight:600;">Enjoy a flat 10% off your first order with your exclusive member code:</div>
    </td></tr>
    <tr><td style="padding:26px 28px;text-align:center;">
      <div style="display:inline-block;padding:14px 28px;background:#133853;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:0.12em;">${MEMBER_PROMO_CODE}</div>
      <p style="font-size:13px;color:#2b4c65;margin-top:14px;">Enter <strong>${MEMBER_PROMO_CODE}</strong> at checkout to unlock 10% off your first order. Valid for first-time member orders only.</p>
    </td></tr>
    <tr><td style="border-top:1px solid #cbd9e6;padding:14px 28px;font-size:12px;color:#133853;"><a href="${escapeHtml(resolvePublicAssetUrl('/', baseOrigin))}" style="color:#133853;text-decoration:none;font-weight:600;">storebadhabit.com</a></td></tr>
  </table>
</body></html>`;

  const customerPromise = dispatchStoreEventEmail({
    toEmail: member.email,
    replyTo: ORDER_NOTIFICATION_EMAIL,
    subject: `Welcome to BAD HABIT · Your 10% Off First-Order Code (${MEMBER_PROMO_CODE})`,
    textBody: `Welcome to BAD HABIT! Enter promo code ${MEMBER_PROMO_CODE} at checkout to get a flat 10% off your first order only.\n\nstorebadhabit.com`,
    htmlBody: customerWelcomeHtml,
    allowRelayFallback: false,
  });

  const [storeNotification, customerNotification] = await Promise.all([storePromise, customerPromise]);
  return { storeNotification, customerNotification };
};

const sendWishlistNotification = async ({
  member,
  item,
  baseOrigin,
}: {
  member: any;
  item: { productId: string; name: string; price: string; image: string; category: string; addedAt: string };
  baseOrigin?: string;
}) => {
  const { srcByItemIndex, attachments } = await prepareOrderEmailThumbnails(
    { items: [{ productId: item.productId, image: item.image }] },
    baseOrigin
  );
  const imgSrc =
    srcByItemIndex[0] ||
    resolvePublicAssetUrl(`/assets/email-thumbs/${item.productId}.png`, baseOrigin) ||
    resolvePublicAssetUrl(item.image, baseOrigin);

  const subject = `[BAD HABIT Wishlist] ${member.email} saved ${item.name}`;
  const textBody = [
    `BAD HABIT · WISHLIST ACTIVITY`,
    `Article Added: ${item.name} (${item.productId})`,
    `Category: ${item.category}`,
    `Price: ${item.price}`,
    `Member Email: ${member.email}`,
    `Member Phone: ${member.phone}`,
    member.displayName ? `Member Name: ${member.displayName}` : '',
    `Total Wishlist Items: ${(member.wishlist || []).length}`,
    `Added At: ${item.addedAt}`,
    `storebadhabit.com`,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:16px;background:#eef4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#133853;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
    <tr><td style="background:#133853;padding:16px 28px;color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.06em;">BAD HABIT · WISHLIST ALERT</td></tr>
    <tr><td style="background:#a5d1ef;padding:28px;color:#0e2c42;">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">WISHLIST UPDATE</div>
      <div style="font-size:30px;font-weight:900;line-height:1.05;margin:10px 0;">ARTICLE ADDED<br/>TO WISHLIST.</div>
      <div style="font-size:14px;font-weight:600;">${escapeHtml(member.email)} (${escapeHtml(member.phone)})</div>
    </td></tr>
    <tr><td style="padding:24px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td width="64" height="64" style="background:#dbeaf7;text-align:center;">
            ${imgSrc ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.name)}" width="64" height="64" style="display:block;width:64px;height:64px;border:0;" />` : ''}
          </td>
          <td style="padding-left:16px;">
            <div style="font-size:17px;font-weight:800;color:#133853;">${escapeHtml(item.name)}</div>
            <div style="font-size:13px;color:#2b4c65;margin-top:4px;">${escapeHtml(item.category)} &middot; ${escapeHtml(item.productId)}</div>
            <div style="font-size:15px;font-weight:700;color:#133853;margin-top:4px;">${escapeHtml(item.price)}</div>
          </td>
        </tr>
      </table>
      <div style="margin-top:20px;font-size:13px;line-height:1.6;color:#1f3f58;border-top:1px solid #cbd9e6;padding-top:14px;">
        <div><strong>Member Email:</strong> ${escapeHtml(member.email)}</div>
        <div><strong>Member Phone:</strong> ${escapeHtml(member.phone)}</div>
        <div><strong>Added At:</strong> ${escapeHtml(item.addedAt)}</div>
      </div>
    </td></tr>
    <tr><td style="border-top:1px solid #cbd9e6;padding:14px 28px;font-size:12px;color:#133853;">storebadhabit.com</td></tr>
  </table>
</body></html>`;

  return dispatchStoreEventEmail({
    toEmail: ORDER_NOTIFICATION_EMAIL,
    replyTo: member.email,
    subject,
    textBody,
    htmlBody,
    attachments,
    relayFields: {
      Event: 'Member Added Article To Wishlist',
      Article_Name: `${item.name} (${item.productId})`,
      Article_Price: item.price,
      Article_Category: item.category,
      Member_Email: member.email,
      Member_Phone: member.phone,
      Added_At: item.addedAt,
    },
    allowRelayFallback: true,
  });
};

const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    isProd: process.env.NODE_ENV === 'production',
    serverless: isServerlessRuntime,
  });
});

// Safe non-secret email configuration check endpoint (for deployment verification)
apiRouter.get('/email-config-status', async (req, res) => {
  const cfg = getEmailTransportConfig();
  const directDeliveryConfigured = cfg.useCustomSmtp || cfg.useGmailSmtp || Boolean(cfg.resendKey);
  const payload: any = {
    storeNotificationRecipient: ORDER_NOTIFICATION_EMAIL,
    customerOrderEmailEnabled: cfg.customerEmailEnvEnabled,
    directDeliveryConfigured,
    providersConfigured: {
      customSmtp: cfg.useCustomSmtp,
      smtpHost: cfg.smtpHost || null,
      smtpPort: cfg.smtpPort || null,
      smtpUserConfigured: Boolean(cfg.smtpUser),
      gmailSmtp: cfg.useGmailSmtp,
      resend: Boolean(cfg.resendKey),
    },
  };

  if (req.query.verify === '1') {
    const checks: Record<string, { ok: boolean; error?: string }> = {};
    if (cfg.useCustomSmtp) {
      try {
        const t = nodemailer.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort,
          secure: cfg.smtpPort === 465,
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
          tls: { minVersion: 'TLSv1.2' },
          auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
        });
        await t.verify();
        checks.customSmtp = { ok: true };
      } catch (err: any) {
        checks.customSmtp = { ok: false, error: err?.message || String(err) };
      }
    }
    if (cfg.useGmailSmtp) {
      try {
        const t = nodemailer.createTransport({
          service: 'gmail',
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
          auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
        });
        await t.verify();
        checks.gmailSmtp = { ok: true };
      } catch (err: any) {
        checks.gmailSmtp = { ok: false, error: err?.message || String(err) };
      }
    }
    payload.smtpVerify = checks;
  }

  res.json(payload);
});

// 1. GET /api/config: Store configuration, shipping rules, payment methods
apiRouter.get('/config', (_req, res) => {
  res.json({
    storeName: 'BAD HABIT',
    tagline: 'YOU KNOW YOU WANT IT',
    supportedCountries: ['Pakistan'],
    defaultCountry: 'Pakistan',
    shippingMethods: Object.values(SHIPPING_METHODS),
    paymentMethods: [
      {
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        enabled: true,
        fee: 0,
        description: 'Payment due on delivery at your doorstep (Delivery charge applies).',
      },
      {
        id: 'bank_transfer',
        name: 'Transfer to Bank account - Free Delivery',
        enabled: true,
        fee: 0,
        freeDelivery: true,
        accountNumber: '01210113983722',
        accountTitle: 'Meezan Bank - Hassan Ahmed',
        confirmationPhone: '03310266534',
        description: 'Transfer to Bank account 01210113983722 (Meezan Bank - Hassan Ahmed) and send screenshot to 03310266534 for Free Delivery.',
      },
    ],
    policies: {
      shipping: 'Standard delivery takes 3–5 business days within Pakistan (PKR 250). Express delivery takes 1–2 business days (PKR 500). Bank Transfer orders receive Free Delivery (PKR 0).',
      returns: 'Articles in original condition with tags and packaging may be exchanged within 7 days of delivery. Cash refunds are provided for manufacturing defects.',
      privacy: 'BAD HABIT respects your privacy. Personal contact and shipping details are used strictly for order fulfilment and tracking.',
      terms: 'By placing an order, you agree to receive the selected luxury garments and complete payment via Cash on Delivery or Bank Transfer.',
    },
  });
});

// 2. POST /api/cart/validate: Server-authoritative price & stock check
apiRouter.post('/cart/validate', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ valid: false, error: 'Shopping bag is empty.' });
  }

  const validatedItems = [];

  for (const item of items) {
    const product = CATALOG_ITEMS.find((p) => p.id === item.productId) as
      | ((typeof CATALOG_ITEMS)[number] & { soldOut?: boolean })
      | undefined;
    if (!product) {
      return res.status(400).json({ valid: false, error: `Invalid product: ${item.productId}` });
    }
    if (product.soldOut || product.stock <= 0) {
      return res.status(400).json({ valid: false, error: `${product.name} is currently Sold Out.` });
    }

    if (!VALID_SIZES.includes(item.size)) {
      return res.status(400).json({ valid: false, error: `Invalid size ${item.size} for ${product.name}` });
    }

    const qty = Math.max(1, Math.min(Number(item.quantity) || 1, product.stock));
    const lineTotal = product.price * qty;

    validatedItems.push({
      productId: product.id,
      name: product.name,
      size: item.size,
      quantity: qty,
      unitPrice: product.price,
      lineTotal,
      image: item.image,
    });
  }

  const pricing = calculateServerPairPricing(validatedItems);

  res.json({
    valid: true,
    items: validatedItems,
    rawSubtotal: pricing.rawSubtotal,
    pairCount: pricing.pairCount,
    pairDiscount: pricing.pairDiscount,
    subtotal: pricing.subtotal,
    formattedRawSubtotal: `PKR ${pricing.rawSubtotal.toLocaleString()}`,
    formattedPairDiscount: `PKR ${pricing.pairDiscount.toLocaleString()}`,
    formattedSubtotal: `PKR ${pricing.subtotal.toLocaleString()}`,
  });
});

// 3. Member Signup / Login (Phone + Email) & Wishlist & First-Order Promo Validation
apiRouter.post('/members/session', async (req, res) => {
  const { email, phone, displayName, dryRun, clientPriorOrderUsed } = req.body || {};
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePakPhone(phone);

  if (!normEmail || !isValidEmail(normEmail)) {
    return res.status(400).json({ success: false, field: 'email', error: 'Please enter a valid email address.' });
  }
  if (!phone || !isValidPakPhone(String(phone))) {
    return res.status(400).json({
      success: false,
      field: 'phone',
      error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567).',
    });
  }

  const matched = findAllMatchingMembers({ email: normEmail, phone: normPhone });
  const existing = findMemberByIdentity({ email: normEmail, phone: normPhone });
  const now = new Date().toISOString();

  if (existing) {
    const priorOrdered =
      Boolean(clientPriorOrderUsed) ||
      matched.some(
        (m: any) =>
          Boolean(m.firstOrderDiscountUsed) ||
          Number(m.orderCount || 0) > 0 ||
          hasPriorOrderByIdentity({ memberId: m.id, email: m.email, phone: m.phone })
      ) ||
      hasPriorOrderByIdentity({ email: normEmail, phone: normPhone });
    if (priorOrdered && (!existing.firstOrderDiscountUsed || Number(existing.orderCount || 0) === 0)) {
      existing.firstOrderDiscountUsed = true;
      existing.orderCount = Math.max(1, Number(existing.orderCount || 0));
    }
    if (displayName && !existing.displayName) {
      existing.displayName = String(displayName).trim().slice(0, 100);
    }
    existing.updatedAt = now;
    upsertMemberRecord(existing);
    return res.json({
      success: true,
      isNewMember: false,
      member: existing,
    });
  }

  const priorOrdered =
    Boolean(clientPriorOrderUsed) || hasPriorOrderByIdentity({ email: normEmail, phone: normPhone });
  const rand = Math.floor(10000 + Math.random() * 90000);
  const newMember = {
    id: `mem_${Date.now()}_${rand}`,
    email: normEmail,
    phone: normPhone,
    displayName: displayName ? String(displayName).trim().slice(0, 100) : '',
    promoCode: MEMBER_PROMO_CODE,
    orderCount: priorOrdered ? 1 : 0,
    firstOrderDiscountUsed: priorOrdered,
    firstOrderNumber: null,
    wishlist: [],
    createdAt: now,
    updatedAt: now,
  };

  upsertMemberRecord(newMember);

  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const reqOrigin = host ? `${proto}://${host}` : '';

  let notification: any = null;
  if (!dryRun) {
    notification = await sendMemberSignupNotification(newMember, reqOrigin);
  }

  return res.status(201).json({
    success: true,
    isNewMember: true,
    member: newMember,
    emailNotification: notification?.storeNotification || null,
  });
});

apiRouter.post('/members/me', (req, res) => {
  const { memberId, email, phone, clientPriorOrderUsed } = req.body || {};
  const matched = findAllMatchingMembers({ memberId, email, phone });
  const member = findMemberByIdentity({ memberId, email, phone });
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }
  const priorOrdered =
    Boolean(clientPriorOrderUsed) ||
    matched.some(
      (m: any) =>
        Boolean(m.firstOrderDiscountUsed) ||
        Number(m.orderCount || 0) > 0 ||
        hasPriorOrderByIdentity({ memberId: m.id, email: m.email, phone: m.phone })
    ) ||
    hasPriorOrderByIdentity({ memberId, email, phone });
  if (priorOrdered && (!member.firstOrderDiscountUsed || Number(member.orderCount || 0) === 0)) {
    member.firstOrderDiscountUsed = true;
    member.orderCount = Math.max(1, Number(member.orderCount || 0));
    member.updatedAt = new Date().toISOString();
    upsertMemberRecord(member);
  }
  return res.json({ success: true, member });
});

apiRouter.post('/wishlist/add', async (req, res) => {
  const { memberId, email, phone, productId, dryRun } = req.body || {};
  const member = findMemberByIdentity({ memberId, email, phone });
  if (!member) {
    return res.status(401).json({
      success: false,
      requiresMembership: true,
      error: 'Please become a member or sign in first to add articles to your wishlist.',
    });
  }

  const product = CATALOG_ITEMS.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Article not found.' });
  }

  const meta = PRODUCT_IMAGE_MAP[product.id] || {
    image: `/assets/email-thumbs/${product.id}.png`,
    category: 'Collection',
  };
  const now = new Date().toISOString();
  const wishlistEntry = {
    productId: product.id,
    name: product.name,
    price: `PKR ${product.price.toLocaleString()}`,
    image: meta.image,
    category: meta.category,
    addedAt: now,
  };

  const currentWishlist = Array.isArray(member.wishlist) ? member.wishlist : [];
  member.wishlist = [
    wishlistEntry,
    ...currentWishlist.filter((w: any) => w.productId !== product.id),
  ];
  member.updatedAt = now;
  upsertMemberRecord(member);

  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const reqOrigin = host ? `${proto}://${host}` : '';

  let emailNotification: any = null;
  if (!dryRun) {
    emailNotification = await sendWishlistNotification({
      member,
      item: wishlistEntry,
      baseOrigin: reqOrigin,
    });
  }

  return res.json({
    success: true,
    member,
    item: wishlistEntry,
    emailNotification,
  });
});

apiRouter.post('/wishlist/remove', (req, res) => {
  const { memberId, email, phone, productId } = req.body || {};
  const member = findMemberByIdentity({ memberId, email, phone });
  if (!member) {
    return res.status(401).json({ success: false, error: 'Member session not found.' });
  }
  const currentWishlist = Array.isArray(member.wishlist) ? member.wishlist : [];
  member.wishlist = currentWishlist.filter((w: any) => w.productId !== productId);
  member.updatedAt = new Date().toISOString();
  upsertMemberRecord(member);
  return res.json({ success: true, member });
});

apiRouter.post('/promo/validate', (req, res) => {
  const { code, memberId, email, phone, items, clientPriorOrderUsed } = req.body || {};
  let subtotalAfterPair = 0;

  if (Array.isArray(items) && items.length > 0) {
    const validatedItems = [];
    for (const item of items) {
      const product = CATALOG_ITEMS.find((p) => p.id === item.productId);
      if (product) {
        const qty = Math.max(1, Math.min(Number(item.quantity) || 1, product.stock || 5));
        validatedItems.push({ productId: product.id, unitPrice: product.price, quantity: qty });
      }
    }
    subtotalAfterPair = calculateServerPairPricing(validatedItems).subtotal;
  }

  const result = validateFirstOrderPromo({
    code,
    memberId,
    email,
    phone,
    subtotalAfterPair,
    clientPriorOrderUsed: Boolean(clientPriorOrderUsed),
  });

  if (!result.valid) {
    return res.status(400).json({
      valid: false,
      requiresMembership: Boolean(result.requiresMembership),
      alreadyUsed: Boolean(result.alreadyUsed),
      discountAmount: 0,
      error: result.error,
    });
  }

  const finalSubtotal = Math.max(0, subtotalAfterPair - result.discountAmount);
  return res.json({
    valid: true,
    code: result.code,
    discountRate: result.discountRate,
    discountAmount: result.discountAmount,
    formattedDiscountAmount: `PKR ${result.discountAmount.toLocaleString()}`,
    finalSubtotal,
    formattedFinalSubtotal: `PKR ${finalSubtotal.toLocaleString()}`,
    message: `Code ${MEMBER_PROMO_CODE} applied — 10% off your first order!`,
  });
});

// 4. POST /api/orders & /api/orders/create: Create real order with server-authoritative verification
apiRouter.post(['/orders', '/orders/create'], async (req, res) => {
  const body = req.body || {};
  const {
    idempotencyKey,
    contact = body.customer,
    delivery,
    items,
    shippingMethodId = body.shipping?.methodId || 'standard',
    paymentMethod = 'cod',
    marketingConsent = false,
    sendOrderSummaryToEmail = true,
    promoCode = '',
    memberId = '',
    clientPriorOrderUsed = false,
  } = body;

  // Check idempotency cache first to prevent duplicate orders
  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    return res.json({
      success: true,
      order: idempotencyCache.get(idempotencyKey),
      duplicatePrevented: true,
    });
  }

  // Server-side validation of customer contact info
  if (!contact || !contact.email || !contact.phone) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both email address and phone number.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(contact.email).trim())) {
    return res.status(400).json({
      success: false,
      field: 'email',
      error: 'Please enter a valid email address.',
    });
  }

  // Pakistani phone normalization & validation (supports 03XX, +923XX, +9203XX, 00923XX, 923XX)
  const cleanPhone = String(contact.phone).replace(/[\s\-\(\)]/g, '');
  const pakPhoneRegex = /^(?:\+92|0092|92)?0?3[0-9]{9}$/;
  if (!pakPhoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      field: 'phone',
      error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567).',
    });
  }

  // Delivery validation
  if (!delivery || !delivery.firstName || !delivery.lastName || !delivery.address || !delivery.city || !delivery.province) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in all required delivery fields (first name, last name, street address, city, and province).',
    });
  }

  if (delivery.country && delivery.country !== 'Pakistan') {
    return res.status(400).json({
      success: false,
      field: 'country',
      error: 'Delivery is currently available exclusively within Pakistan.',
    });
  }

  // Validate Items on server
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot place an order with an empty shopping bag.',
    });
  }

  const validatedItems = [];

  for (const item of items) {
    const product = CATALOG_ITEMS.find((p) => p.id === item.productId) as
      | ((typeof CATALOG_ITEMS)[number] & { soldOut?: boolean })
      | undefined;
    if (!product) {
      return res.status(400).json({
        success: false,
        error: `Unrecognized product item ${item.productId}.`,
      });
    }
    if (product.soldOut || product.stock <= 0) {
      return res.status(400).json({
        success: false,
        error: `${product.name} is currently Sold Out.`,
      });
    }

    if (!VALID_SIZES.includes(item.size)) {
      return res.status(400).json({
        success: false,
        error: `Size ${item.size} is unavailable for ${product.name}.`,
      });
    }

    const qty = Math.max(1, Math.min(Number(item.quantity) || 1, product.stock));
    const lineTotal = product.price * qty;

    validatedItems.push({
      productId: product.id,
      name: product.name,
      size: item.size,
      quantity: qty,
      unitPrice: product.price,
      lineTotal,
      image: item.image,
    });
  }

  // Validate payment method
  if (paymentMethod !== 'cod' && paymentMethod !== 'bank_transfer') {
    return res.status(400).json({
      success: false,
      error: 'Unsupported payment method selected.',
    });
  }

  const isBankTransfer = paymentMethod === 'bank_transfer';
  const pairPricing = calculateServerPairPricing(validatedItems);

  // Server-authoritative First-Order Member Promo Code validation (BH-DETECTED -> 10% off 1st order only)
  let appliedPromoCode = '';
  let promoDiscount = 0;
  if (String(promoCode || '').trim()) {
    const promoCheck = validateFirstOrderPromo({
      code: promoCode,
      memberId,
      email: contact.email,
      phone: cleanPhone,
      subtotalAfterPair: pairPricing.subtotal,
      clientPriorOrderUsed: Boolean(clientPriorOrderUsed),
    });
    if (!promoCheck.valid) {
      return res.status(400).json({
        success: false,
        field: 'promoCode',
        alreadyUsed: Boolean(promoCheck.alreadyUsed),
        error: promoCheck.error,
      });
    }
    appliedPromoCode = promoCheck.code || MEMBER_PROMO_CODE;
    promoDiscount = promoCheck.discountAmount;
  }

  const discountedSubtotalAfterPromo = Math.max(0, pairPricing.subtotal - promoDiscount);

  // Validate shipping method & charge (Free Delivery when transferring to Bank Account)
  const selectedShipping = SHIPPING_METHODS[shippingMethodId] || SHIPPING_METHODS.standard;
  const shippingCharge = isBankTransfer ? 0 : selectedShipping.charge;
  const codFee = 0;

  const grandTotal = discountedSubtotalAfterPromo + shippingCharge;

  // Generate unique branded order number (e.g. BH-26-84920)
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `BH-26-${randomSuffix}`;
  const orderId = `ord_${Date.now()}_${randomSuffix}`;
  const primaryMatchedMember = findMemberByIdentity({
    memberId,
    email: contact.email,
    phone: cleanPhone,
  });

  const newOrder = {
    id: orderId,
    orderNumber,
    memberId: memberId || primaryMatchedMember?.id || undefined,
    createdAt: new Date().toISOString(),
    customer: {
      email: String(contact.email).trim(),
      phone: cleanPhone,
      marketingConsent: Boolean(marketingConsent),
    },
    delivery: {
      country: 'Pakistan',
      firstName: String(delivery.firstName).trim(),
      lastName: String(delivery.lastName).trim(),
      address: String(delivery.address).trim(),
      apartment: delivery.apartment ? String(delivery.apartment).trim() : '',
      city: String(delivery.city).trim(),
      province: String(delivery.province).trim(),
      postalCode: delivery.postalCode ? String(delivery.postalCode).trim() : '',
      landmark: delivery.landmark ? String(delivery.landmark).trim() : '',
      instructions: delivery.instructions ? String(delivery.instructions).trim() : '',
    },
    items: validatedItems,
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
          charge: 0,
          codFee: 0,
        }
      : {
          method: 'cod',
          methodName: 'Cash on Delivery (COD)',
          status: 'pending_delivery',
          statusLabel: 'Payment due on delivery',
          charge: codFee,
          codFee,
        },
    pricing: {
      currency: 'PKR',
      rawSubtotal: pairPricing.rawSubtotal,
      pairCount: pairPricing.pairCount,
      pairDiscount: pairPricing.pairDiscount,
      promoCode: appliedPromoCode || undefined,
      promoDiscount,
      subtotalAfterPair: pairPricing.subtotal,
      subtotal: discountedSubtotalAfterPromo,
      shippingCharge,
      codFee,
      total: grandTotal,
      formattedRawSubtotal: `PKR ${pairPricing.rawSubtotal.toLocaleString()}`,
      formattedPairDiscount: `PKR ${pairPricing.pairDiscount.toLocaleString()}`,
      formattedPromoDiscount: `PKR ${promoDiscount.toLocaleString()}`,
      formattedSubtotal: `PKR ${discountedSubtotalAfterPromo.toLocaleString()}`,
      formattedShippingCharge: `PKR ${shippingCharge.toLocaleString()}`,
      formattedCodFee: `PKR ${codFee.toLocaleString()}`,
      formattedTotal: `PKR ${grandTotal.toLocaleString()}`,
    },
  };

  console.log(`[BAD HABIT] Order placed successfully: ${orderNumber} for PKR ${grandTotal.toLocaleString()} (${newOrder.customer.email})`);

  // Send transactional order emails & optional automation webhook in parallel
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const reqOrigin = host ? `${proto}://${host}` : '';
  const {
    storeNotification,
    automationNotification,
    customerNotification,
    webhookSent,
  } = await sendOrderNotifications(newOrder, sendOrderSummaryToEmail !== false, reqOrigin);

  const enrichedOrder = {
    ...newOrder,
    notifications: {
      storeEmailSent: storeNotification.sent,
      customerEmailSent: Boolean(customerNotification?.sent),
      automationEmailSent: Boolean(automationNotification?.sent),
      webhookSent,
      provider: customerNotification?.provider || storeNotification.provider,
      storeResult: storeNotification,
      customerResult: customerNotification,
    },
  };

  // Store enriched order safely
  saveOrder(enrichedOrder);

  // Mark ALL matching member profiles with order completion so 10% first-order discount cannot be reused
  const matchedMembers = findAllMatchingMembers({
    memberId,
    email: newOrder.customer.email,
    phone: newOrder.customer.phone,
  });
  const nowIso = new Date().toISOString();
  for (const matched of matchedMembers) {
    matched.orderCount = Number(matched.orderCount || 0) + 1;
    matched.firstOrderDiscountUsed = true;
    matched.firstOrderNumber = matched.firstOrderNumber || orderNumber;
    matched.updatedAt = nowIso;
    upsertMemberRecord(matched);
  }
  const returnedMember =
    findMemberByIdentity({
      memberId,
      email: newOrder.customer.email,
      phone: newOrder.customer.phone,
    }) ||
    matchedMembers[0] ||
    null;

  // Save in idempotency cache
  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, enrichedOrder);
  }

  res.status(201).json({
    success: true,
    order: enrichedOrder,
    member: returnedMember,
    emailNotification: storeNotification,
    customerEmailNotification: customerNotification,
    automationNotification,
    webhookSent,
  });
});

// 4. GET /api/orders/:orderNumber: Retrieve order for confirmation and verification
apiRouter.get('/orders/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  const orders = readOrders();
  const order = orders.find((o: any) => o.orderNumber === orderNumber || o.id === orderNumber);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }
  res.json({ success: true, order });
});

export function createApiApp() {
  const app = express();
  app.use(compression({ threshold: 1024 }));
  app.use(express.json());
  app.get('/healthz', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      isProd: process.env.NODE_ENV === 'production',
    });
  });
  app.use('/api', apiRouter);
  return app;
}

// Standalone Express instance exported as default for Vercel Serverless Functions
const vercelApp = express();
vercelApp.use(compression({ threshold: 1024 }));
vercelApp.use(express.json());
vercelApp.use('/api', apiRouter);
// Fallback mount in case Vercel rewrites strip the /api prefix
vercelApp.use('/', apiRouter);
vercelApp.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found.' });
});

export default vercelApp;
