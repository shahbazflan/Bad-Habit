import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  // Parse CLI flags (--port, --host) passed by dev runner (e.g., npm run dev --port 3000 --host 0.0.0.0)
  const args = process.argv.slice(2);
  let cliPort: number | null = null;
  let cliHost: string = '0.0.0.0';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      cliPort = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--host' && args[i + 1]) {
      cliHost = args[i + 1];
      i++;
    }
  }

  // In development, prioritize CLI --port or default to 3000 (ignoring ambient Cloud Run PORT=8080)
  // In production, prioritize process.env.PORT
  const PORT = cliPort || (isProd ? (Number(process.env.PORT) || 3000) : 3000);
  const HOST = cliHost || '0.0.0.0';

  app.use(compression({ threshold: 1024 }));
  app.use(express.json());

  // Health check endpoint for Cloud Run and monitoring
  app.get(['/healthz', '/api/health'], (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), isProd });
  });

  // Ensure persistent data directory and orders store exist
  const DATA_DIR = path.join(__dirname, 'data');
  const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }

  // In-memory idempotency check to prevent duplicate order submissions
  const idempotencyCache = new Map<string, any>();

  // Helper to read orders safely
  const readOrders = () => {
    try {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  // Helper to save order safely
  const saveOrder = (order: any) => {
    const orders = readOrders();
    orders.unshift(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  };

  const ORDER_NOTIFICATION_EMAIL =
    (process.env.ORDER_NOTIFICATION_EMAIL || '').trim() || 'wear@storebadhabit.com';

  const resolvePublicAssetUrl = (assetPath?: string) => {
    if (!assetPath) return '';
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
    const base = (process.env.APP_URL || '').replace(/\/+$/, '');
    return base ? `${base}${assetPath.startsWith('/') ? '' : '/'}${assetPath}` : '';
  };

  const buildOrderSummaryContent = (order: any, options: { forCustomer?: boolean } = {}) => {
    const isBankTransfer = order.payment?.method === 'bank_transfer';
    const totalArticlesCount = order.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0);

    const itemsLines = order.items
      .map(
        (it: any) =>
          `- ${it.name} (${it.productId}) | Size: ${it.size} | Qty: ${it.quantity} | Line Total: PKR ${it.lineTotal.toLocaleString()}`
      )
      .join('\n');

    const subject = options.forCustomer
      ? `BAD HABIT DETECTED · Order ${order.orderNumber} Confirmed`
      : `[BAD HABIT Order ${order.orderNumber}] ${order.delivery.firstName} ${order.delivery.lastName} · ${order.pricing.formattedTotal}`;

    const textBody = [
      `BAD HABIT DETECTED`,
      `YOUR ORDER HAS BEEN RECEIVED.`,
      `ORDER NUMBER: ${order.orderNumber}`,
      `Placed At: ${order.createdAt}`,
      `========================================`,
      ``,
      `ORDERED ARTICLES (${totalArticlesCount})`,
      itemsLines,
      ``,
      `DELIVERY DESTINATION`,
      `Name: ${order.delivery.firstName} ${order.delivery.lastName}`,
      `Email: ${order.customer.email}`,
      `Phone: ${order.customer.phone}`,
      `Address: ${order.delivery.address}${order.delivery.apartment ? `, ${order.delivery.apartment}` : ''}`,
      `City / Province: ${order.delivery.city}, ${order.delivery.province}${order.delivery.postalCode ? ` (${order.delivery.postalCode})` : ''}`,
      `Country: ${order.delivery.country}`,
      order.delivery.landmark ? `Landmark: ${order.delivery.landmark}` : '',
      order.delivery.instructions ? `Instructions: ${order.delivery.instructions}` : '',
      ``,
      `PAYMENT METHOD`,
      `Method: ${order.payment.methodName}`,
      isBankTransfer
        ? `Account number: ${order.payment.accountNumber} (${order.payment.accountTitle || 'Meezan Bank - Hassan Ahmed'}) · Send screenshot to: ${order.payment.confirmationPhone}`
        : `Status: ${order.payment.statusLabel}`,
      ``,
      `DELIVERY ESTIMATE`,
      `${order.shippingMethod.estimate} (${order.shippingMethod.name})`,
      ``,
      `PRICING SUMMARY`,
      order.pricing.pairDiscount > 0 ? `Articles Total: ${order.pricing.formattedRawSubtotal}` : '',
      order.pricing.pairDiscount > 0
        ? `Pair Discount (15% Off · ${order.pricing.pairCount} ${order.pricing.pairCount === 1 ? 'pair' : 'pairs'}): -${order.pricing.formattedPairDiscount}`
        : '',
      `Subtotal: ${order.pricing.formattedSubtotal}`,
      `Delivery Charge: ${order.pricing.shippingCharge === 0 ? 'FREE (PKR 0)' : order.pricing.formattedShippingCharge}`,
      `${isBankTransfer ? 'Total Amount (Bank Transfer)' : 'Total Due on Arrival'}: ${order.pricing.formattedTotal}`,
    ]
      .filter(Boolean)
      .join('\n');

    const htmlItemsRows = order.items
      .map((it: any) => {
        const imgSrc = resolvePublicAssetUrl(it.image);
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.16);color:#ffffff;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${
                  imgSrc
                    ? `<img src="${imgSrc}" alt="${it.name}" width="40" height="48" style="width:40px;height:48px;object-fit:contain;border-radius:8px;background:rgba(255,255,255,0.12);padding:3px;" />`
                    : ''
                }
                <div>
                  <div style="font-weight:700;font-size:13px;color:#ffffff;">${it.name}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.78);">Size: ${it.size} · Quantity: ${it.quantity}</div>
                </div>
              </div>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.16);text-align:right;font-weight:700;font-size:13px;color:#ffffff;white-space:nowrap;">PKR ${it.lineTotal.toLocaleString()}</td>
          </tr>`;
      })
      .join('');

    const htmlBody = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:linear-gradient(160deg,#7ab4e2 0%,#5698d4 52%,#6ea8dc 100%);padding:28px 20px;border-radius:20px;color:#ffffff;">
        <div style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.32);border-radius:18px;padding:26px 22px;">
          <div style="text-align:center;margin-bottom:22px;">
            <div style="width:42px;height:3px;background:#ffffff;border-radius:999px;margin:0 auto 14px;"></div>
            <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:0.08em;color:#ffffff;text-transform:uppercase;">BAD HABIT DETECTED</h1>
            <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.88);">YOUR ORDER HAS BEEN RECEIVED.</p>
            <div style="display:inline-block;margin-top:14px;padding:7px 16px;border-radius:999px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.34);font-size:12px;color:#ffffff;">
              <span style="opacity:0.8;text-transform:uppercase;letter-spacing:0.08em;">ORDER NUMBER:</span>
              <strong style="margin-left:6px;letter-spacing:0.06em;">${order.orderNumber}</strong>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:14px;padding:18px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.86);margin-bottom:8px;">
              ORDERED ARTICLES (${totalArticlesCount})
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tbody>${htmlItemsRows}</tbody>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-top:16px;border-bottom:1px solid rgba(255,255,255,0.16);padding-bottom:14px;">
              <tr>
                <td style="vertical-align:top;width:50%;padding:8px 8px 14px 0;font-size:12px;color:#ffffff;">
                  <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin-bottom:4px;">DELIVERY DESTINATION</div>
                  <div style="font-weight:700;">${order.delivery.firstName} ${order.delivery.lastName}</div>
                  <div>${order.delivery.address}${order.delivery.apartment ? `, ${order.delivery.apartment}` : ''}</div>
                  <div>${order.delivery.city}, ${order.delivery.province} ${order.delivery.postalCode || ''}</div>
                  ${order.delivery.landmark ? `<div style="opacity:0.85;">Landmark: ${order.delivery.landmark}</div>` : ''}
                  ${order.delivery.instructions ? `<div style="opacity:0.85;">Notes: ${order.delivery.instructions}</div>` : ''}
                  <div style="font-weight:700;margin-top:4px;">${order.delivery.country}</div>
                  <div style="margin-top:4px;opacity:0.9;">${order.customer.email} · ${order.customer.phone}</div>
                </td>
                <td style="vertical-align:top;width:50%;padding:8px 0 14px 8px;font-size:12px;color:#ffffff;">
                  <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin-bottom:4px;">PAYMENT METHOD</div>
                  <div style="font-weight:700;">${order.payment.methodName}</div>
                  <div style="opacity:0.9;">${order.payment.statusLabel}</div>
                  ${
                    isBankTransfer
                      ? `<div style="margin-top:6px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.1);font-size:11px;">Account: <strong>${order.payment.accountNumber}</strong><br/>${order.payment.accountTitle || 'Meezan Bank - Hassan Ahmed'}<br/>Send screenshot to: <strong>${order.payment.confirmationPhone}</strong></div>`
                      : ''
                  }
                  <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin:12px 0 4px;">DELIVERY ESTIMATE</div>
                  <div>${order.shippingMethod.estimate} (${order.shippingMethod.name})</div>
                </td>
              </tr>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;color:#ffffff;">
              ${
                order.pricing.pairDiscount > 0
                  ? `<tr><td style="padding:3px 0;opacity:0.86;">Articles Total</td><td style="padding:3px 0;text-align:right;opacity:0.86;">${order.pricing.formattedRawSubtotal}</td></tr>
                     <tr><td style="padding:3px 0;color:#bbf7d0;font-weight:600;">Pair Discount (15% Off · ${order.pricing.pairCount} ${order.pricing.pairCount === 1 ? 'pair' : 'pairs'})</td><td style="padding:3px 0;text-align:right;color:#bbf7d0;font-weight:600;">-${order.pricing.formattedPairDiscount}</td></tr>`
                  : ''
              }
              <tr><td style="padding:3px 0;opacity:0.9;">Subtotal</td><td style="padding:3px 0;text-align:right;opacity:0.9;">${order.pricing.formattedSubtotal}</td></tr>
              <tr><td style="padding:3px 0;opacity:0.9;">Delivery Charge</td><td style="padding:3px 0;text-align:right;opacity:0.9;">${order.pricing.shippingCharge === 0 ? 'FREE (PKR 0)' : order.pricing.formattedShippingCharge}</td></tr>
              <tr>
                <td style="padding:10px 0 0;border-top:1px solid rgba(255,255,255,0.22);font-size:15px;font-weight:800;">${isBankTransfer ? 'Total Amount (Bank Transfer)' : 'Total Due on Arrival'}</td>
                <td style="padding:10px 0 0;border-top:1px solid rgba(255,255,255,0.22);text-align:right;font-size:17px;font-weight:800;">${order.pricing.formattedTotal}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    return { subject, textBody, htmlBody, itemsLines, isBankTransfer };
  };

  const dispatchEmailToRecipient = async ({
    order,
    toEmail,
    replyTo,
    subject,
    textBody,
    htmlBody,
    itemsLines,
    isBankTransfer,
    allowRelayFallback,
  }: {
    order: any;
    toEmail: string;
    replyTo: string;
    subject: string;
    textBody: string;
    htmlBody: string;
    itemsLines: string;
    isBankTransfer: boolean;
    allowRelayFallback: boolean;
  }): Promise<{ sent: boolean; provider: string; recipient: string; reason?: string; activationRequired?: boolean }> => {
    let lastError = '';

    // 1. Direct Resend API (when RESEND_API_KEY is configured)
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: (process.env.EMAIL_FROM || '').trim() || 'BAD HABIT Orders <onboarding@resend.dev>',
            to: [toEmail],
            reply_to: replyTo,
            subject,
            text: textBody,
            html: htmlBody,
          }),
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

    // 2. Direct Enterprise SMTP (supports wear@storebadhabit.com via Aliyun Mail SSL/465) or Gmail SMTP
    const rawSmtpPass = (process.env.SMTP_PASS || '').trim();
    const smtpUser =
      (process.env.SMTP_USER || '').trim() || (rawSmtpPass ? ORDER_NOTIFICATION_EMAIL : '');
    const smtpPass = rawSmtpPass;
    const smtpHost =
      (process.env.SMTP_HOST || '').trim() ||
      (smtpUser.endsWith('@storebadhabit.com') ? 'smtp.sg.aliyun.com' : '');
    const smtpPort = Number(
      (process.env.SMTP_PORT || '').trim() || (smtpHost.includes('aliyun.com') ? 465 : 587)
    );

    const gmailUser = (process.env.GMAIL_USER || '').trim();
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();

    const useCustomSmtp = Boolean(smtpHost && smtpUser && smtpPass);
    const useGmailSmtp = Boolean(gmailUser && gmailPass);

    if (useCustomSmtp || useGmailSmtp) {
      try {
        const transporter = useCustomSmtp
          ? nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              auth: { user: smtpUser, pass: smtpPass },
            })
          : nodemailer.createTransport({
              service: 'gmail',
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              auth: { user: gmailUser, pass: gmailPass },
            });

        const fromAddr =
          (process.env.EMAIL_FROM || '').trim() || (useCustomSmtp ? smtpUser : gmailUser);
        await transporter.sendMail({
          from: `"BAD HABIT" <${fromAddr}>`,
          to: toEmail,
          replyTo,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(`[BAD HABIT] Order email sent via SMTP to ${toEmail} for ${order.orderNumber}`);
        return {
          sent: true,
          provider: useCustomSmtp ? 'custom_smtp' : 'gmail_smtp',
          recipient: toEmail,
        };
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.error(`[BAD HABIT] Failed sending order email via SMTP to ${toEmail}:`, lastError);
      }
    }

    if (!allowRelayFallback) {
      return {
        sent: false,
        provider: useCustomSmtp ? 'custom_smtp' : useGmailSmtp ? 'gmail_smtp' : resendKey ? 'resend' : 'none',
        recipient: toEmail,
        reason:
          lastError ||
          'Configure SMTP_PASS, GMAIL_APP_PASSWORD, or RESEND_API_KEY to send directly to customer emails.',
      };
    }

    // 3. Zero-config HTTPS FormSubmit relay directly targeting store/automation inbox
    try {
      const originHeader = process.env.APP_URL || 'https://storebadhabit.com';
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

  const sendOrderNotifications = async (order: any, sendCustomerSummary: boolean) => {
    const storePayload = buildOrderSummaryContent(order, { forCustomer: false });
    const storeNotification = await dispatchEmailToRecipient({
      order,
      toEmail: ORDER_NOTIFICATION_EMAIL,
      replyTo: order.customer.email,
      ...storePayload,
      allowRelayFallback: true,
    });

    const automationEmail = (process.env.ORDER_AUTOMATION_EMAIL || '').trim();
    let automationNotification: Awaited<ReturnType<typeof dispatchEmailToRecipient>> | null = null;
    if (automationEmail && automationEmail.toLowerCase() !== ORDER_NOTIFICATION_EMAIL.toLowerCase()) {
      automationNotification = await dispatchEmailToRecipient({
        order,
        toEmail: automationEmail,
        replyTo: order.customer.email,
        ...storePayload,
        allowRelayFallback: true,
      });
    }

    const customerEmailEnv = (process.env.CUSTOMER_ORDER_EMAIL_ENABLED || 'true').trim().toLowerCase();
    const customerEmailEnabled =
      sendCustomerSummary && !['false', '0', 'no', 'off'].includes(customerEmailEnv);
    let customerNotification: Awaited<ReturnType<typeof dispatchEmailToRecipient>> | null = null;
    if (customerEmailEnabled && order.customer?.email) {
      const customerPayload = buildOrderSummaryContent(order, { forCustomer: true });
      customerNotification = await dispatchEmailToRecipient({
        order,
        toEmail: order.customer.email,
        replyTo: ORDER_NOTIFICATION_EMAIL,
        ...customerPayload,
        allowRelayFallback: false,
      });
    }

    const webhookUrl = (process.env.ORDER_WEBHOOK_URL || '').trim();
    let webhookSent = false;
    if (webhookUrl) {
      try {
        const hookRes = await fetch(webhookUrl, {
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
        });
        webhookSent = hookRes.ok;
      } catch (err: any) {
        console.error(`[BAD HABIT] Automation webhook failed for ${order.orderNumber}:`, err?.message || err);
      }
    }

    return {
      storeNotification,
      automationNotification,
      customerNotification,
      webhookSent,
    };
  };

  // 1. GET /api/config: Store configuration, shipping rules, payment methods
  app.get('/api/config', (_req, res) => {
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
  app.post('/api/cart/validate', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ valid: false, error: 'Shopping bag is empty.' });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = CATALOG_ITEMS.find((p) => p.id === item.productId) as (typeof CATALOG_ITEMS)[number] & { soldOut?: boolean } | undefined;
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
      subtotal += lineTotal;

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
  app.post(['/api/orders', '/api/orders/create'], async (req, res) => {
    const {
      idempotencyKey,
      contact = req.body.customer,
      delivery,
      items,
      shippingMethodId = req.body.shipping?.methodId || 'standard',
      paymentMethod = 'cod',
      marketingConsent = false,
      sendOrderSummaryToEmail = true,
    } = req.body;

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
    if (!emailRegex.test(contact.email.trim())) {
      return res.status(400).json({
        success: false,
        field: 'email',
        error: 'Please enter a valid email address.',
      });
    }

    // Pakistani phone normalization & validation
    const cleanPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
    const pakPhoneRegex = /^(?:\+92|0092|0)?3[0-9]{9}$/;
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

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = CATALOG_ITEMS.find((p) => p.id === item.productId) as (typeof CATALOG_ITEMS)[number] & { soldOut?: boolean } | undefined;
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
      subtotal += lineTotal;

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
        email: contact.email.trim(),
        phone: cleanPhone,
        marketingConsent: Boolean(marketingConsent),
      },
      delivery: {
        country: 'Pakistan',
        firstName: delivery.firstName.trim(),
        lastName: delivery.lastName.trim(),
        address: delivery.address.trim(),
        apartment: delivery.apartment ? delivery.apartment.trim() : '',
        city: delivery.city.trim(),
        province: delivery.province.trim(),
        postalCode: delivery.postalCode ? delivery.postalCode.trim() : '',
        landmark: delivery.landmark ? delivery.landmark.trim() : '',
        instructions: delivery.instructions ? delivery.instructions.trim() : '',
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

    // Send transactional order emails & optional automation webhook
    const {
      storeNotification,
      automationNotification,
      customerNotification,
      webhookSent,
    } = await sendOrderNotifications(newOrder, sendOrderSummaryToEmail !== false);

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

    // Store enriched order (including separate store & customer email results) in server database
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
  app.get('/api/orders/:orderNumber', (req, res) => {
    const { orderNumber } = req.params;
    const orders = readOrders();
    const order = orders.find((o: any) => o.orderNumber === orderNumber || o.id === orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    res.json({ success: true, order });
  });

  // Frontend Integration (Vite in development, static build in production)
  if (!isProd) {
    // Fast cache headers for public assets in dev
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '30d',
        immutable: true,
      })
    );

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const rootIndex = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(rootIndex)) {
          let template = fs.readFileSync(rootIndex, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        }
        next();
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Hashed Vite bundles & public assets with long-term immutable caching
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'public', 'assets'), {
        maxAge: '30d',
        immutable: true,
      })
    );

    // Other dist files (index.html must never be staled across publishes)
    app.use(
      express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexPath);
      } else {
        res.status(200).send('BAD HABIT luxury streetwear store is starting up...');
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`BAD HABIT Server listening on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`BAD HABIT Server listen error on ${HOST}:${PORT}:`, err);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
