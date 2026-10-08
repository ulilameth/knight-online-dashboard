"use client";
import { DERECE, EsyaIkonu } from "@/components/oyun/EsyaIkonu";
import { Modal } from "@/components/ui/Modal";
import { sinifAdi } from "@/lib/etiketler";
import { siniflarMetni, tamSetBonusu, yuvalarOf } from "@/lib/oyun/build";
import { setOf } from "@/lib/oyun/hesap";
import { BONUSLAR, type Esya, type Katalog, YUVA_ADLARI, aralikMetni, derecelerOf, esyaAdi, kullanabilir, setBonusMetni } from "@/lib/oyun/katalog";
import type { Sinif, Taraf } from "@/lib/types";

/** Derece tablosu sütunları: yalnızca bir derecede değeri olanlar gösterilir */
const SUTUNLAR: readonly [number, string][] = [[1, "AP"], [2, "Savunma"], [3, "Level"], [4, "Gerekli STR"], [5, "Gerekli HP"], [6, "Gerekli DEX"], [7, "Gerekli INT"], [8, "Gerekli MP"], ...BONUSLAR.map(([i, l]) => [i, l] as [number, string])];

/** Eşya detayı: derece derece değerler, set, build'e takma */
export function EsyaDetayi({ e, kat, sinif, taraf, sahip, kapat, onAc, onTak, onSetTak }: {
  e: Esya;
  kat: Katalog;
  /** Build'in sınıfı (takılabilirlik) */
  sinif: Sinif;
  taraf: Taraf;
  sahip: string;
  kapat: () => void;
  onAc: (id: number) => void;
  onTak: (yuva: number) => void;
  onSetTak: (anahtar: string) => void;
}) {
  const satirlar = derecelerOf(kat, e);
  const sutunlar = SUTUNLAR.filter(([i]) => satirlar.some((r) => r[i]));
  const takilir = kullanabilir(e, sinif);
  const st = setOf(kat, e);
  const tam = st && tamSetBonusu(kat, sinif, st);
  return (
    <Modal acik kapat={kapat} baslik={esyaAdi(e, sahip)} genislik={820}>
      <div className="id-head">
        <EsyaIkonu yuva={e.yuvalar[0]} esya={e} />
        <div>
          <div className="gr" style={{ font: "600 13px/1.3 var(--font-data)", color: DERECE[e.derece][1] }}>{DERECE[e.derece][0]}</div>
          <div style={{ color: "var(--fg-2)" }}>{e.kategori} · {siniflarMetni(e.siniflar, taraf)}{e.ad.includes("{ad}") ? " · adı sahibinin nick’i" : ""}</div>
          <div className="muted" style={{ fontSize: 13 }}>{aralikMetni(kat, e)}</div>
          {e.etki && <div style={{ fontSize: 13.5, color: "var(--good)", marginTop: 2 }}>Özel etki · {e.etki}</div>}
        </div>
      </div>
      {st && (
        <div className="id-set">
          <div className="set-top">
            <div><b>Set: {st.ad}</b><span className="meta">{st.parcalar.length} parça</span></div>
            {st.aileAdi && <span className="tag official">{st.aileAdi} bonusu</span>}
          </div>
          <div className="set-parts">
            {st.parcalar.map((id) => {
              const p = kat.esyalar.get(id)!;
              return (
                <button type="button" className="set-part" key={id} title={p.ad} aria-label={p.ad} aria-current={id === e.id} onClick={() => onAc(id)}>
                  <EsyaIkonu yuva={p.yuvalar[0]} esya={p} />
                </button>
              );
            })}
          </div>
          {tam && <p className="set-bon">Tam set: {setBonusMetni(tam)}</p>}
          <button type="button" className={`btn ${takilir ? "primary" : ""}`} disabled={!takilir} onClick={() => onSetTak(st.anahtar)}>Seti tak ({st.parcalar.length} parça)</button>
        </div>
      )}
      <div className="id-actions">
        {yuvalarOf(e).map((y) => (
          <button type="button" key={y} className={`btn ${takilir ? "primary" : ""}`} disabled={!takilir} onClick={() => onTak(y)}>Tak: {YUVA_ADLARI[y]}</button>
        ))}
      </div>
      {!takilir && (
        <p className="crit-note" style={{ margin: "0 0 12px" }}>
          Build’inin sınıfı {sinifAdi(sinif, taraf)}; bu eşya {siniflarMetni(e.siniflar, taraf)} için. Takmak için Karakter tasarımında sınıfı değiştir.
        </p>
      )}
      {satirlar.length ? (
        <div className="table-wrap" style={{ marginInline: 0, paddingInline: 0 }}>
          <table className="gt">
            <thead><tr><th>Derece</th>{sutunlar.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead>
            <tbody>{satirlar.map((r) => <tr key={r[0]}><td>+{r[0]}</td>{sutunlar.map(([i]) => <td key={i}>{r[i] || "—"}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : <p className="muted">Bu eşyanın bonus verisi henüz katalogda yok; takarsan hesaba girmez.</p>}
    </Modal>
  );
}
