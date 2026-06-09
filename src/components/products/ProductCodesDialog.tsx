import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCodesDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Builds a stable, scannable string for the barcode. Code128 supports
// alphanumeric, but we strip whitespace to avoid scanner issues.
function buildBarcodeValue(p: any): string {
  const raw =
    (p?.sku && String(p.sku).trim()) ||
    (p?.item_number && String(p.item_number).trim()) ||
    (p?.id ? String(p.id).replace(/-/g, '').slice(0, 20).toUpperCase() : '');
  return raw.replace(/\s+/g, '').toUpperCase() || 'SEMCODIGO';
}

function buildQrValue(p: any): string {
  // Inclui dados úteis para que um simples scanner já mostre o item.
  return JSON.stringify({
    id: p?.id,
    nome: p?.name,
    sku: p?.sku || null,
    marca: p?.brand || null,
    ca: p?.ca_number || null,
  });
}

export const ProductCodesDialog: React.FC<ProductCodesDialogProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const barcodeValue = buildBarcodeValue(product);
  const qrValue = buildQrValue(product);

  const downloadSvg = (svg: SVGSVGElement | null, filename: string, label: string) => {
    if (!svg) {
      toast.error('Não foi possível gerar o arquivo');
      return;
    }
    const clone = svg.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const source = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${label} baixado`);
  };

  const downloadQr = () =>
    downloadSvg(
      qrRef.current?.querySelector('svg') as SVGSVGElement | null,
      `qrcode-${barcodeValue}.svg`,
      'QR Code',
    );

  const downloadBarcode = () =>
    downloadSvg(
      barcodeRef.current?.querySelector('svg') as SVGSVGElement | null,
      `barcode-${barcodeValue}.svg`,
      'Código de barras',
    );



  const handlePrint = () => {
    const node = wrapperRef.current;
    if (!node) return;
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) {
      toast.error('Permita pop-ups para imprimir');
      return;
    }
    const esc = (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const name = esc(product.name);
    const brand = product.brand ? esc(product.brand) + ' · ' : '';
    const sku = product.sku ? 'SKU ' + esc(product.sku) : '';
    w.document.write(`<!doctype html><html><head><title>${name}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color:#0f172a; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { font-size: 12px; color:#475569; margin-bottom: 16px; }
        .row { display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap; }
        .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:center; }
        .label { font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:#64748b; font-weight:700; margin-bottom:8px;}
      </style>
    </head><body>
      <h1>${name}</h1>
      <div class="meta">${brand}${sku}</div>
      <div class="row">${node.innerHTML}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-none shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden grid grid-rows-[auto_1fr] min-w-0"
        style={{
          width: 'min(560px, calc(100vw - 24px))',
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100dvh - 24px)',
        }}
      >
        <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white min-w-0">
          <DialogHeader className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
              Identificação
            </span>
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Códigos do Item
            </DialogTitle>
            <p className="text-xs sm:text-sm text-slate-200 font-medium truncate min-w-0">
              {product.name}
            </p>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overflow-x-hidden min-w-0">
          <div
            ref={wrapperRef}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0"
          >
            {/* QR Code Card */}
            <div className="border border-slate-200 rounded-2xl p-3 sm:p-4 text-center bg-white min-w-0 overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                <QrCode size={12} /> QR Code
              </div>
              <div ref={qrRef} className="w-full flex justify-center min-w-0">
                <div
                  className="aspect-square [&_svg]:block [&_svg]:!w-full [&_svg]:!h-full"
                  style={{ width: 'clamp(120px, 40vw, 180px)' }}
                >
                  <QRCodeSVG
                    id="product-qr-svg"
                    value={qrValue}
                    size={180}
                    level="M"
                    includeMargin
                  />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 font-mono break-all min-w-0">
                ID: {String(product.id).slice(0, 8)}…
              </p>
            </div>

            {/* Barcode Card */}
            <div className="border border-slate-200 rounded-2xl p-3 sm:p-4 text-center bg-white min-w-0 overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                <BarcodeIcon size={12} /> Código de Barras
              </div>
              <div ref={barcodeRef} className="w-full min-w-0 overflow-hidden [&_svg]:block [&_svg]:!w-full [&_svg]:!h-auto [&_svg]:!max-w-full">
                <Barcode
                  value={barcodeValue}
                  format="CODE128"
                  width={1.4}
                  height={60}
                  fontSize={11}
                  margin={0}
                  background="#ffffff"
                  lineColor="#0f172a"
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 font-mono break-all min-w-0">
                {barcodeValue}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 w-full min-w-0">
            <Button
              variant="outline"
              className="min-w-0 h-11 rounded-xl font-bold"
              onClick={downloadQr}
            >
              <Download size={15} className="mr-2 shrink-0" />
              <span className="truncate">Baixar QR</span>
            </Button>
            <Button
              variant="outline"
              className="min-w-0 h-11 rounded-xl font-bold"
              onClick={downloadBarcode}
            >
              <Download size={15} className="mr-2 shrink-0" />
              <span className="truncate">Baixar Barras</span>
            </Button>
            <Button
              className="min-w-0 h-11 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white"
              onClick={handlePrint}
            >
              <Printer size={15} className="mr-2 shrink-0" />
              <span className="truncate">Imprimir</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

