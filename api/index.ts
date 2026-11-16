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

const memoryOrders: any[] = [];
const idempotencyCache = new Map<string, any>();

const ensureOrderStore = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
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
                order.pricing.pairDiscount > 0 || order.pricing.shippingCharge > 0 || isBankTransfer
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

// 3. POST /api/orders & /api/orders/create: Create real order with server-authoritative verification
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

  // Validate shipping method & charge (Free Delivery when transferring to Bank Account)
  const selectedShipping = SHIPPING_METHODS[shippingMethodId] || SHIPPING_METHODS.standard;
  const shippingCharge = isBankTransfer ? 0 : selectedShipping.charge;
  const codFee = 0;

  const grandTotal = pairPricing.subtotal + shippingCharge;

  // Generate unique branded order number (e.g. BH-26-84920)
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `BH-26-${randomSuffix}`;
  const orderId = `ord_${Date.now()}_${randomSuffix}`;

  const newOrder = {
    id: orderId,
    orderNumber,
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
      subtotal: pairPricing.subtotal,
      shippingCharge,
      codFee,
      total: grandTotal,
      formattedRawSubtotal: `PKR ${pairPricing.rawSubtotal.toLocaleString()}`,
      formattedPairDiscount: `PKR ${pairPricing.pairDiscount.toLocaleString()}`,
      formattedSubtotal: `PKR ${pairPricing.subtotal.toLocaleString()}`,
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

  // Save in idempotency cache
  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, enrichedOrder);
  }

  res.status(201).json({
    success: true,
    order: enrichedOrder,
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
