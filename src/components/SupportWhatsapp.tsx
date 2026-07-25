import { Whatsapp } from "./Icons";
import { normalizePhone } from "@/lib/validators";

export default function SupportWhatsapp({ number }: { number: string }) {
  const clean = normalizePhone(number).replace(/^\+/, "");
  if (!clean) return null;

  return (
    <a
      href={`https://wa.me/${clean}`}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="animate-glow-pulse fixed bottom-6 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-black shadow-gold transition-transform hover:scale-110 sm:right-6"
    >
      <Whatsapp className="h-6 w-6" />
    </a>
  );
}
