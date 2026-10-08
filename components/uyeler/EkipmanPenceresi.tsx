"use client";
import { Modal } from "@/components/ui/Modal";
import type { EkipmanOzeti } from "@/lib/oyun/ozet";
import { EkipmanIcerik } from "./EkipmanIcerik";

export function EkipmanPenceresi({ ad, ozet, meta, kapat }: { ad: string; ozet: EkipmanOzeti; meta: string; kapat: () => void }) {
  return (
    <Modal acik kapat={kapat} baslik={`${ad} · Ekipman`} genislik={760}>
      <EkipmanIcerik ozet={ozet} meta={meta} />
    </Modal>
  );
}
