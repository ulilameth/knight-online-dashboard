// Prototipin ikon seti: IkonSeti kök düzende bir kez çizilir, Ikon <use> ile kullanır.
// i-*: arayüz ikonları (16px), s-*: ekipman yuvası ikonları (24px, çizgi).

export type IkonAdi = "i-lock" | "i-check" | "i-x" | "i-pin" | "i-search" | "i-plus" | "i-edit" | "i-left" | "i-right" | "s-silah" | "s-ikinci" | "s-kask" | "s-zirh" | "s-pantolon" | "s-eldiven" | "s-bot" | "s-pelerin" | "s-kolye" | "s-kupe" | "s-yuzuk" | "s-kemer" | "s-kanat" | "s-dovme" | "s-amblem" | "i-out";

export function IkonSeti() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-lock" viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/><path d="M5.3 7V5.1a2.7 2.7 0 0 1 5.4 0V7" fill="none" stroke="currentColor" strokeWidth="1.6"/></symbol>
      <symbol id="i-check" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></symbol>
      <symbol id="i-x" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></symbol>
      <symbol id="i-pin" viewBox="0 0 16 16"><path d="M9.8 1.8l4.4 4.4-2.1.7-2.4 2.4.3 3.1-1.4 1.4-2.6-2.6L3 14.2l-1.2-.1L1.7 13l3-3-2.6-2.6 1.4-1.4 3.1.3L9 3.9z" fill="currentColor"/></symbol>
      <symbol id="i-search" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></symbol>
      <symbol id="i-plus" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></symbol>
      <symbol id="i-edit" viewBox="0 0 16 16"><path d="M11 2.5l2.5 2.5L6 12.5l-3.2.7.7-3.2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></symbol>
      <symbol id="i-left" viewBox="0 0 16 16"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></symbol>
      <symbol id="i-right" viewBox="0 0 16 16"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></symbol>
      <symbol id="s-silah" viewBox="0 0 24 24"><path d="M20 4l-1 4.5-9.5 9.5-3-3L16 5.5zM6 13.5l4.5 4.5M3.5 20.5l4-4"/></symbol>
      <symbol id="s-ikinci" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.2 8.6-7 10-3.8-1.4-7-5-7-10V6z"/><path d="M12 7v10M8 11h8"/></symbol>
      <symbol id="s-kask" viewBox="0 0 24 24"><path d="M4 15a8 8 0 0 1 16 0v4h-5v-4H9v4H4z"/><path d="M12 7v5"/></symbol>
      <symbol id="s-zirh" viewBox="0 0 24 24"><path d="M8 3L4 6v5h3v10h10V11h3V6l-4-3c-.6 1.6-2.2 2.5-4 2.5S8.6 4.6 8 3z"/></symbol>
      <symbol id="s-pantolon" viewBox="0 0 24 24"><path d="M6 3h12l1.5 18h-5L12 10l-2.5 11h-5z"/></symbol>
      <symbol id="s-eldiven" viewBox="0 0 24 24"><path d="M7 21v-6l-2.5-3.5L6 10l2 2V5.5a1.2 1.2 0 0 1 2.4 0V10V4a1.2 1.2 0 0 1 2.4 0v6V5a1.2 1.2 0 0 1 2.4 0v6V7a1.2 1.2 0 0 1 2.4 0v8c0 3.5-2 6-5 6z"/></symbol>
      <symbol id="s-bot" viewBox="0 0 24 24"><path d="M7 3h6v9l6 3c.7.4 1 1 1 1.8V21H7z"/></symbol>
      <symbol id="s-pelerin" viewBox="0 0 24 24"><path d="M8 3h8l4 18-8-3-8 3z"/><path d="M8 3c1 2 2.5 3 4 3s3-1 4-3"/></symbol>
      <symbol id="s-kolye" viewBox="0 0 24 24"><path d="M5 4c0 6 3 9.5 7 9.5S19 10 19 4M12 13.5v2"/><circle cx="12" cy="18" r="2.5"/></symbol>
      <symbol id="s-kupe" viewBox="0 0 24 24"><path d="M12 3v5"/><circle cx="12" cy="10" r="2"/><path d="M12 12l-3 5a3 3 0 0 0 6 0z"/></symbol>
      <symbol id="s-yuzuk" viewBox="0 0 24 24"><circle cx="12" cy="14.5" r="6"/><path d="M9.5 5.5L12 3l2.5 2.5L12 8z"/></symbol>
      <symbol id="s-kemer" viewBox="0 0 24 24"><path d="M3 9h18v6H3zM9 8h6v8H9zM12 11v2"/></symbol>
      <symbol id="s-kanat" viewBox="0 0 24 24"><path d="M12 9C10 5.5 6 4.5 3 5.5c1 3 3 4.8 6 5.6-2 1-3 2.8-3 4.9 3 0 5-1.8 6-4 1 2.2 3 4 6 4 0-2.1-1-3.9-3-4.9 3-.8 5-2.6 6-5.6-3-1-7 0-9 3.5z"/></symbol>
      <symbol id="s-dovme" viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 3-6 6-10z"/><path d="M12 10v7M9.5 13.5h5"/></symbol>
      <symbol id="s-amblem" viewBox="0 0 24 24"><circle cx="12" cy="9.5" r="6"/><path d="M8.5 14.5L7 21l5-2.5 5 2.5-1.5-6.5"/></symbol>
      <symbol id="i-out" viewBox="0 0 16 16"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></symbol>
    </svg>
  );
}

export function Ikon({ ad, className }: { ad: IkonAdi; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#${ad}`} />
    </svg>
  );
}
