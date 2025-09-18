"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";

type Props = {
  onDetected?: (code: { rawValue: string; format?: string }) => void;
  // On mobile, we'll default to autostart for better UX
  autoStart?: boolean;
};

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

const SUPPORTED_FORMATS = [
  "qr_code",
  "ean_13",
  "ean_8",
  "code_128",
  "code_39",
  "upc_a",
  "upc_e",
  "itf",
];

const isMobileUA = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLocalhost = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)/.test(location.hostname);
const isSecure = typeof location !== "undefined" && (location.protocol === "https:" || isLocalhost);

export default function BarcodeScanner({ onDetected, autoStart = isMobileUA }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [lastCode, setLastCode] = useState<string>("");
  const [usingZxing, setUsingZxing] = useState(false);
  const zxingReaderRef = useRef<any | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const cams = mediaDevices.filter((d) => d.kind === "videoinput");
      setDevices(cams);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    // Stop ZXing reader if active
    try {
      if (zxingReaderRef.current) {
        zxingReaderRef.current.reset?.();
        zxingReaderRef.current = null;
      }
    } catch {}
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setUsingZxing(false);
  }, [stream]);

  const start = useCallback(async () => {
    setError(null);
    setRunning(true);
    try {
      if (!isSecure) {
        setError("Para usar la cámara en móviles, abre el sitio con HTTPS o en localhost.");
        setRunning(false);
        return;
      }
      // Enumerate cameras
      await refreshDevices();
      const cams = devices.length ? devices : [];
      // Try to prefer back camera
      const backCam = cams.find((d) => /back|rear|trás|atras/i.test(d.label));
      const useId = deviceId || backCam?.deviceId || cams[cams.length - 1]?.deviceId;
      // If BarcodeDetector is not available, fallback to ZXing directly
      if (!window.BarcodeDetector) {
        await startZxing(useId);
        // After ZXing starts, we have permission; refresh to get labels
        await refreshDevices();
      } else {
        // Try with preferred constraints first
        let ms: MediaStream | null = null;
        try {
          ms = await navigator.mediaDevices.getUserMedia({
            video: useId ? { deviceId: { exact: useId } } : { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          // Fallback to any available camera
          ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        setStream(ms);
        if (videoRef.current && ms) {
          videoRef.current.srcObject = ms;
          // Ensure playsinline for iOS Safari and disable picture-in-picture on mobile
          videoRef.current.setAttribute("playsinline", "true");
          (videoRef.current as any).disablePictureInPicture = true;
          try {
            await videoRef.current.play();
          } catch (e) {
            // Autoplay might be blocked on iOS; require user gesture
            setError("Pulsa 'Iniciar' para comenzar el escaneo (se requiere interacción del usuario).");
            setRunning(false);
            return;
          }
        }
        loopDetect();
        // Now that permission granted, refresh to get labels
        await refreshDevices();
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo acceder a la cámara");
      setRunning(false);
    }
  }, [deviceId, devices.length, refreshDevices]);

  // Core detection loop using BarcodeDetector
  const loopDetect = useCallback(async () => {
    if (!window.BarcodeDetector) return; // handled by ZXing fallback
    const detector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });

    const tick = async () => {
      if (!running) return;
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 480;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const bitmap = await createImageBitmap(canvas);
            const codes = await detector.detect(bitmap);
            if (codes && codes.length) {
              const c = codes[0];
              const value: string = c.rawValue ?? c.raw ?? "";
              if (value && value !== lastCode) {
                setLastCode(value);
                onDetected?.({ rawValue: value, format: c.format });
              }
            }
          }
        }
      } catch (e) {
        // swallow and continue
      } finally {
        if (running) requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [onDetected, running, lastCode]);

  // ZXing fallback
  const startZxing = useCallback(async (useId?: string) => {
    try {
      setUsingZxing(true);
      setError(null);
      const mod: any = await import("@zxing/browser");
      const BrowserMultiFormatReader = mod.BrowserMultiFormatReader as any;
      const reader: any = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;

      await reader.decodeFromVideoDevice(
        useId || undefined,
        videoRef.current!,
        (result: any, err: any, controls: any) => {
          if (!running) {
            // stop if asked to stop
            controls?.stop();
            return;
          }
          if (result) {
            const text = result.getText?.() ?? String(result);
            if (text && text !== lastCode) {
              setLastCode(text);
              onDetected?.({ rawValue: text });
            }
          }
        }
      );
    } catch (e: any) {
      setError(
        "No se pudo iniciar el lector ZXing. Asegúrate de tener @zxing/browser instalado (npm i @zxing/browser)."
      );
      setUsingZxing(false);
    }
  }, [onDetected, running, lastCode]);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  // If user changes camera while running, restart with new deviceId (works for both ZXing and BarcodeDetector)
  useEffect(() => {
    if (!running) return;
    (async () => {
      stop();
      await new Promise((r) => setTimeout(r, 50));
      start();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cámara</label>
          <select
            className="border rounded h-9 px-2 min-w-48"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            // Permit changing while running; we'll restart automatically
          >
            <option value="">Automática</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Cámara ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <Button type="button" variant="outline" onClick={refreshDevices}>
            Refrescar cámaras
          </Button>
        </div>
        {running ? (
          <Button type="button" variant="destructive" onClick={stop}>
            Detener
          </Button>
        ) : (
          <Button type="button" onClick={start}>
            Iniciar
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="relative w-full max-w-md">
        <video ref={videoRef} className="w-full rounded border bg-black/60" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {/* Simple overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-emerald-400/80 rounded w-2/3 h-2/3" />
        </div>
      </div>

      {lastCode && (
        <div className="text-sm">
          Último código: <span className="font-mono break-all">{lastCode}</span>
        </div>
      )}
    </div>
  );
}