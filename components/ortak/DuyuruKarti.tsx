import type { ReactNode } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { gunMetni, saatMetni } from "@/lib/time";
import type { Duyuru } from "@/lib/types";

export function DuyuruKarti({ duyuru, yazar, ek }: { duyuru: Duyuru; yazar: string; ek?: ReactNode }) {
  return (
    <div className="ann">
      <h3>{duyuru.sabit && <Ikon ad="i-pin" />}{duyuru.baslik}</h3>
      <p style={{ whiteSpace: "pre-line" }}>{duyuru.govde}</p>
      <div className="meta">
        <span>{yazar} · {gunMetni(duyuru.createdAt)} {saatMetni(duyuru.createdAt)}</span>
        {duyuru.tsGonderildiAt && <span className="tag">TeamSpeak’e gönderildi</span>}
        {ek}
      </div>
    </div>
  );
}
