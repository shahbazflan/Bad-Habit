import React, { useEffect, useRef, useState } from 'react';

interface PairModelCanvasProps {
  shirtSrc: string;
  shirtAlt: string;
  trouserSrc: string;
  trouserAlt: string;
  trouserSoldOut?: boolean;
  viewAngle: 'front' | 'back';
  onClickShirt: () => void;
  onClickTrouser: () => void;
}

const MODEL_W = 503;
const MODEL_H = 1231;

interface CrotchMetrics {
  crotchT: number;
  splitFrac: number;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const crotchCache = new Map<string, CrotchMetrics>();

function loadCachedImage(src: string): Promise<HTMLImageElement> {
  const existing = imageCache.get(src);
  if (existing) return existing;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

  imageCache.set(src, p);
  return p;
}

function measureCrotchMetrics(img: HTMLImageElement, src: string): CrotchMetrics {
  const cached = crotchCache.get(src);
  if (cached) return cached;

  const offW = 160;
  const offH = Math.max(120, Math.round((img.height / img.width) * offW));
  const offCanvas = document.createElement('canvas');
  offCanvas.width = offW;
  offCanvas.height = offH;
  const octx = offCanvas.getContext('2d');

  if (!octx) {
    return { crotchT: 0.37, splitFrac: 0.51 };
  }

  octx.drawImage(img, 0, 0, offW, offH);
  const { data } = octx.getImageData(0, 0, offW, offH);

  let crotchRow = Math.floor(offH * 0.37);
  let splitX = offW * 0.51;

  for (let y = Math.floor(offH * 0.24); y < Math.floor(offH * 0.56); y++) {
    const segs: Array<[number, number]> = [];
    let segStart = -1;

    for (let x = 0; x < offW; x++) {
      const alpha = data[(y * offW + x) * 4 + 3];
      if (alpha > 32 && segStart < 0) {
        segStart = x;
      } else if (alpha <= 32 && segStart >= 0) {
        segs.push([segStart, x - 1]);
        segStart = -1;
      }
    }
    if (segStart >= 0) segs.push([segStart, offW - 1]);

    if (segs.length >= 2) {
      let bestGap = 0;
      let bestMid = offW * 0.5;
      for (let i = 0; i < segs.length - 1; i++) {
        const gap = segs[i + 1][0] - segs[i][1];
        if (gap > bestGap) {
          bestGap = gap;
          bestMid = (segs[i + 1][0] + segs[i][1]) / 2;
        }
      }
      if (bestGap >= 3) {
        crotchRow = y;
        splitX = bestMid;
        break;
      }
    }
  }

  const metrics = {
    crotchT: Math.min(0.52, Math.max(0.28, crotchRow / offH)),
    splitFrac: Math.min(0.58, Math.max(0.42, splitX / offW)),
  };
  crotchCache.set(src, metrics);
  return metrics;
}

export const PairModelCanvas: React.FC<PairModelCanvasProps> = ({
  shirtSrc,
  shirtAlt,
  trouserSrc,
  trouserAlt,
  trouserSoldOut = false,
  viewAngle,
  onClickShirt,
  onClickTrouser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (viewAngle === 'back') return;

    let cancelled = false;

    Promise.all([
      loadCachedImage('/assets/model_head.png'),
      loadCachedImage('/assets/model_forearms.png'),
      loadCachedImage('/assets/model_shoes.png'),
      loadCachedImage(shirtSrc),
      loadCachedImage(trouserSrc),
    ])
      .then(([headImg, armsImg, shoesImg, shirtImg, trouserImg]) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, MODEL_W, MODEL_H);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Dark brown leather shoes at bottom
        ctx.drawImage(shoesImg, 0, 0, MODEL_W, MODEL_H);

        // 2. Selected trousers fitted dynamically across pelvis & A-frame leg stance
        const { crotchT, splitFrac } = measureCrotchMetrics(trouserImg, trouserSrc);
        const tStartY = 580;
        const tEndY = 1160;
        const tSpanH = tEndY - tStartY;
        const stepPx = 2;

        ctx.save();
        if (trouserSoldOut) ctx.globalAlpha = 0.78;

        for (let dy = tStartY; dy < tEndY; dy += stepPx) {
          const t = (dy - tStartY) / tSpanH;
          const sy = t * trouserImg.height;
          const srcStepH = Math.min(
            trouserImg.height - sy,
            (stepPx / tSpanH) * trouserImg.height + 0.8
          );
          const dstStepH = Math.min(tEndY - dy, stepPx + 0.7);

          if (t <= crotchT) {
            // Unbroken pelvis / waistband zone mapped directly across hip width
            const dstL = 74;
            const dstW = 310;
            ctx.drawImage(
              trouserImg,
              0,
              sy,
              trouserImg.width,
              srcStepH,
              dstL,
              dy,
              dstW,
              dstStepH
            );
          } else {
            // Split left leg & right leg smoothly outward into dark leather shoes
            const lt = (t - crotchT) / (1 - crotchT);
            const dstCrotchX = 74 + splitFrac * 310;

            const leftL = 74 * (1 - lt) + 34 * lt;
            const leftR = dstCrotchX * (1 - lt) + 128 * lt;
            const rightL = dstCrotchX * (1 - lt) + 356 * lt;
            const rightR = 384 * (1 - lt) + 462 * lt;

            const srcSplitX = trouserImg.width * splitFrac;

            ctx.drawImage(
              trouserImg,
              0,
              sy,
              srcSplitX,
              srcStepH,
              leftL,
              dy,
              leftR - leftL,
              dstStepH
            );

            ctx.drawImage(
              trouserImg,
              srcSplitX,
              sy,
              trouserImg.width - srcSplitX,
              srcStepH,
              rightL,
              dy,
              rightR - rightL,
              dstStepH
            );
          }
        }
        ctx.restore();

        // 3. Exposed model forearms + wrist bracelet tucking cleanly into pockets
        ctx.drawImage(armsImg, 0, 0, MODEL_W, MODEL_H);

        // 4. Selected shirt fitted across shoulders, chest & hem
        ctx.drawImage(shirtImg, 8, 188, 446, 416);

        // 5. Constant model head, sunglasses, beard & upper neck inside open camp collar
        ctx.drawImage(headImg, 0, 0, MODEL_W, MODEL_H);

        setReady(true);
      })
      .catch(() => {
        // Silently degrade if an asset is still loading
      });

    return () => {
      cancelled = true;
    };
  }, [shirtSrc, trouserSrc, trouserSoldOut, viewAngle]);

  if (viewAngle === 'back') {
    return (
      <div className="relative w-full h-[365px] sm:h-[415px] flex flex-col items-center justify-center pt-1">
        <button
          type="button"
          onClick={onClickShirt}
          className="relative z-10 h-[145px] sm:h-[164px] flex items-center justify-center cursor-pointer outline-none group"
          title={`Change shirt (${shirtAlt})`}
          aria-label={`Selected shirt: ${shirtAlt}. Click to change shirt.`}
        >
          <img
            src={shirtSrc}
            alt={shirtAlt}
            className="h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.03]"
            loading="eager"
          />
        </button>

        <button
          type="button"
          onClick={onClickTrouser}
          className="relative z-0 -mt-1.5 h-[212px] sm:h-[238px] -translate-x-[2px] flex items-center justify-center cursor-pointer outline-none group"
          title={`Change trousers (${trouserAlt})`}
          aria-label={`Selected trousers: ${trouserAlt}. Click to change trousers.`}
        >
          {trouserSoldOut && (
            <span className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-[0.25rem] bg-red-600/95 border border-white/60 text-white font-grotesk font-black text-[10px] tracking-[0.16em] uppercase shadow-md">
              SOLD OUT
            </span>
          )}
          <img
            src={trouserSrc}
            alt={trouserAlt}
            className={`h-full w-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.02] ${
              trouserSoldOut ? 'opacity-75' : ''
            }`}
            loading="eager"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[385px] sm:h-[435px] w-full flex items-center justify-center select-none">
      <div className="relative h-full aspect-[503/1231] flex items-center justify-center">
        {trouserSoldOut && (
          <span className="absolute top-[52%] left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-[0.25rem] bg-red-600/95 border border-white/60 text-white font-grotesk font-black text-[10px] tracking-[0.16em] uppercase shadow-md pointer-events-none">
            SOLD OUT
          </span>
        )}

        <canvas
          ref={canvasRef}
          width={MODEL_W}
          height={MODEL_H}
          className={`h-full w-full object-contain transition-opacity duration-200 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={`Model wearing ${shirtAlt} and ${trouserAlt}`}
        />

        {/* Interactive Hit Zone: Upper Half -> Choose Shirt */}
        <button
          type="button"
          onClick={onClickShirt}
          className="absolute top-[14%] inset-x-0 h-[35%] z-10 cursor-pointer outline-none bg-transparent"
          title={`Change shirt (${shirtAlt})`}
          aria-label={`Selected shirt: ${shirtAlt}. Click to change shirt.`}
        />

        {/* Interactive Hit Zone: Lower Half -> Choose Trousers */}
        <button
          type="button"
          onClick={onClickTrouser}
          className="absolute top-[49%] bottom-[6%] inset-x-0 z-10 cursor-pointer outline-none bg-transparent"
          title={`Change trousers (${trouserAlt})`}
          aria-label={`Selected trousers: ${trouserAlt}. Click to change trousers.`}
        />
      </div>
    </div>
  );
};
