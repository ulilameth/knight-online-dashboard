"use client";
import { useToast } from "@/components/ui/Toast";

export function KopyalaDugmesi({ metin, bildirim, etiket = "Kopyala" }: { metin: string; bildirim: string; etiket?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(metin);
          toast(bildirim);
        } catch {
          toast("Kopyalanamadı; metni seçip kopyala");
        }
      }}
    >
      {etiket}
    </button>
  );
}
