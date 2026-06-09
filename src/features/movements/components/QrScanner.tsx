import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Keyboard, ScanLine } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

const REGION_ID = 'qr-scanner-region';

// Formats: QR + common 1D barcodes used by USB/Bluetooth handheld scanners
const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
];

export const QrScanner = ({ onResult, onClose }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const firedRef = useRef(false);
  const [manual, setManual] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fire = (value: string) => {
    const v = value.trim();
    if (!v || firedRef.current) return;
    firedRef.current = true;
    try { scannerRef.current?.stop().catch(() => {}); } catch {}
    onResult(v);
  };

  // Camera (QR + 1D)
  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID, { formatsToSupport: FORMATS, verbose: false });
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 180 } },
        (decodedText) => fire(decodedText),
        () => {}
      )
      .catch((err) => {
        console.error('QR start error', err);
        setCameraError('Câmera indisponível. Use o leitor USB ou digite o código abaixo.');
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Keyboard-wedge USB/Bluetooth scanner: rapid keystrokes + Enter
  useEffect(() => {
    hiddenInputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow typing in the manual input without interfering
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== hiddenInputRef.current) {
        return;
      }
      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 2) {
          e.preventDefault();
          const value = bufferRef.current;
          bufferRef.current = '';
          fire(value);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Reset buffer if too slow (human typing)
      if (delta > 80) bufferRef.current = '';

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-3 text-white">
          <h3 className="font-bold flex items-center gap-2">
            <ScanLine size={18} /> Escaneie o código
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X />
          </Button>
        </div>

        <div id={REGION_ID} className="rounded-2xl overflow-hidden bg-black min-h-[200px]" />

        {cameraError && (
          <p className="mt-3 text-xs text-amber-300 text-center">{cameraError}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-white/70 text-xs">
          <Keyboard size={14} />
          <span>Leitor USB/Bluetooth: bipe agora — será detectado automaticamente.</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fire(manual);
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            placeholder="Ou digite o código e Enter"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            autoComplete="off"
          />
          <Button type="submit" variant="secondary">OK</Button>
        </form>

        {/* Hidden focus catcher to keep wedge keystrokes flowing into window listener */}
        <input
          ref={hiddenInputRef}
          aria-hidden
          tabIndex={-1}
          className="sr-only"
          onBlur={(e) => {
            // Não roube o foco se o usuário foi para o input manual ou outro elemento focável.
            const next = e.relatedTarget as HTMLElement | null;
            if (next) return;
            setTimeout(() => hiddenInputRef.current?.focus(), 50);
          }}
        />
      </div>
    </div>
  );
};
