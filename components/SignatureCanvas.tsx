"use client";

import { useEffect, useRef, useState } from "react";

export default function SignatureCanvas({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [kosong, setKosong] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function posisi(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current!.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current!.height,
    };
  }

  function mulai(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = posisi(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function gambar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = posisi(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (kosong) setKosong(false);
  }

  function selesai() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  }

  function hapus() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setKosong(true);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={mulai}
        onPointerMove={gambar}
        onPointerUp={selesai}
        onPointerLeave={selesai}
        className="w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {kosong
            ? "Gambar tanda tangan Anda di kotak di atas (mouse atau sentuh)."
            : "Tanda tangan terekam."}
        </p>
        <button
          type="button"
          onClick={hapus}
          className="text-sm text-red-600 hover:underline"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}
