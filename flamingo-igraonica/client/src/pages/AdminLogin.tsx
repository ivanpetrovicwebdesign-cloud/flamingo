import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const ADMIN_PASSWORD = "flamingo2026";
const ADMIN_SESSION_KEY = "flamingo-admin-auth";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const loginMutation = trpc.flamingoAdmin.login.useMutation();

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") navigate("/admin/dashboard");
    else setLoading(false);
  }, [navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    window.setTimeout(() => {
      if (password !== ADMIN_PASSWORD) {
        setSubmitting(false);
        setError("Lozinka nije ispravna.");
        return;
      }
      loginMutation.mutate({ password }, {
        onSuccess: () => { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); navigate("/admin/dashboard"); },
        onError: () => { setSubmitting(false); setError("Server admin sesija nije dostupna. Proverite konfiguraciju."); },
      });
    }, 120);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f3ece3] text-sm text-[#6e7b8d]">Proveravamo prijavu…</div>;
  return <main className="grid min-h-screen bg-[#f3ece3] lg:grid-cols-[.9fr_1.1fr]">
    <section className="relative hidden overflow-hidden bg-[#2a1b1a] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-36 -top-36 h-[520px] w-[520px] rounded-full border-[70px] border-[#e98c80]/20" /><Link href="/" className="relative z-10 flex items-center gap-3"><img src="/images/flamingo-logo.png" alt="Flamingo logo" className="h-14 w-14 object-contain" /><span><span className="block font-display text-2xl">Flamingo</span><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#ffb6a6]">admin studio</span></span></Link><div className="relative z-10 max-w-lg"><p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffb6a6]"><Sparkles size={14} /> samo za tim</p><h1 className="font-display text-6xl leading-[.9] tracking-[-.05em]">Sve važne<br /><em className="font-normal text-[#ffb6a6]">stvari</em> na jednom mestu.</h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#d6c6c0]">Upravljajte ponudama, galerijom, sadržajem i upitima gostiju iz jednog toplog prostora.</p></div><p className="relative z-10 text-xs text-[#b59b91]">Flamingo · Cara Dušana 162 · Niš</p></section>
    <section className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md rounded-[32px] bg-[#fffdf9] p-7 shadow-[0_24px_80px_rgba(42,27,26,0.1)] sm:p-10"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-xs font-bold text-[#6e7b8d] transition hover:text-[#d95767]"><ArrowLeft size={15} /> Nazad na sajt</Link><div className="mb-8"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5e9d9] text-[#d95767]"><LockKeyhole size={19} /></span><h2 className="mt-7 font-display text-4xl tracking-[-.04em]">Prijava za<br /><em className="font-normal text-[#d95767]">administraciju.</em></h2><p className="mt-4 text-sm leading-6 text-[#6e7b8d]">Unesite administratorsku lozinku za pristup.</p></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-[#6e7b8d]">Lozinka</span><span className="flex items-center gap-3 border-b border-[#d9dce0] py-3 focus-within:border-[#d95767]"><LockKeyhole size={16} className="text-[#9ca7b5]" /><input required autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Unesite lozinku" className="w-full bg-transparent text-sm outline-none placeholder:text-[#b9c0c9]" /></span></label>{error && <p className="rounded-xl bg-[#fbe8e5] px-4 py-3 text-xs font-semibold leading-5 text-[#b74754]">{error}</p>}<button disabled={submitting} className="flex w-full items-center justify-center rounded-full bg-[#2a1b1a] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#d95767] disabled:cursor-wait disabled:opacity-60">{submitting ? "Prijavljujem…" : "Prijavi se"}</button></form><p className="mt-7 text-center text-[11px] leading-5 text-[#9aa4b1]">Lokalni demo režim: podaci se čuvaju samo u ovom browseru.</p></div></section>
  </main>;
}
