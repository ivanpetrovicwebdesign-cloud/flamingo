import { useState } from "react";
import { ArrowLeft, Check, RotateCcw, Save, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { BirthdayPackage, defaultPackages, loadPackages, savePackages } from "@/lib/content";

export default function Admin() {
  const [packages, setPackages] = useState<BirthdayPackage[]>(loadPackages());
  const [saved, setSaved] = useState(false);

  const updatePackage = (id: string, field: keyof BirthdayPackage, value: string) => {
    setPackages((current) => current.map((pkg) => pkg.id === id ? { ...pkg, [field]: value } : pkg));
    setSaved(false);
  };

  const handleSave = () => {
    savePackages(packages);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return <div className="min-h-screen bg-[#f3ece3] text-[#122744]">
    <header className="border-b border-[#ded6ce] bg-[#fffdf9]/90 px-5 py-4 backdrop-blur-xl sm:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#122744] text-[#fff7ed]"><span className="font-display text-xl italic">f</span></span><div><span className="block font-display text-lg font-semibold leading-4">flamingo</span><span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#d95767]">admin studio</span></div></Link><Link href="/" className="flex items-center gap-2 rounded-full border border-[#d9d2c9] px-4 py-2 text-xs font-bold text-[#53627a] transition hover:border-[#122744] hover:text-[#122744]"><ArrowLeft size={15} /> Nazad na sajt</Link></div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-10 lg:py-16"><div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#d8d1ed] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5e5686]"><Sparkles size={13} /> lokalni admin pregled</div><h1 className="font-display text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">Ponude za<br /><em className="font-normal text-[#d95767]">rođendane.</em></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#6e7b8d]">Uredite tekst paketa koji se prikazuje na javnoj stranici. U ovoj frontend-only verziji promene se čuvaju lokalno u browseru.</p></div>
      <div className="mt-12 space-y-5">{packages.map((pkg, index) => <section key={pkg.id} className="rounded-[28px] border border-[#e2d9d1] bg-[#fffdf9] p-6 shadow-[0_12px_45px_rgba(18,39,68,0.05)] sm:p-8"><div className="mb-6 flex items-center justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d95767]">0{index + 1} · paket</span><h2 className="mt-1 font-display text-2xl font-semibold">{pkg.name}</h2></div><span className="rounded-full bg-[#f5e9d9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6a5a]">{pkg.color}</span></div><div className="grid gap-5 md:grid-cols-2"><label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Naziv paketa</span><input value={pkg.name} onChange={(e) => updatePackage(pkg.id, "name", e.target.value)} className="w-full rounded-xl border border-[#e0d9d1] bg-[#fcfaf7] px-4 py-3 text-sm outline-none focus:border-[#d95767]" /></label><label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Cena</span><input value={pkg.price} onChange={(e) => updatePackage(pkg.id, "price", e.target.value)} className="w-full rounded-xl border border-[#e0d9d1] bg-[#fcfaf7] px-4 py-3 text-sm outline-none focus:border-[#d95767]" /></label><label className="block md:col-span-2"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Opis</span><textarea rows={2} value={pkg.description} onChange={(e) => updatePackage(pkg.id, "description", e.target.value)} className="w-full resize-none rounded-xl border border-[#e0d9d1] bg-[#fcfaf7] px-4 py-3 text-sm leading-6 outline-none focus:border-[#d95767]" /></label></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{pkg.features.map((feature, featureIndex) => <label key={`${pkg.id}-${featureIndex}`} className="flex items-center gap-3 rounded-xl bg-[#f3ece3] px-3 py-2.5"><Check size={15} className="shrink-0 text-[#d95767]" /><input value={feature} onChange={(e) => setPackages((current) => current.map((item) => item.id === pkg.id ? { ...item, features: item.features.map((entry, entryIndex) => entryIndex === featureIndex ? e.target.value : entry) } : item))} className="w-full bg-transparent text-sm outline-none" /></label>)}</div></section>)}</div>
      <div className="sticky bottom-5 mt-8 flex flex-col gap-3 rounded-2xl border border-[#e2d9d1] bg-[#fffdf9]/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:justify-end"><button onClick={() => { setPackages(defaultPackages); setSaved(false); }} className="flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold text-[#6e7b8d] transition hover:bg-[#f3ece3]"><RotateCcw size={15} /> Vrati početne vrednosti</button><button onClick={handleSave} className="flex items-center justify-center gap-2 rounded-full bg-[#122744] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#d95767]">{saved ? <Check size={15} /> : <Save size={15} />}{saved ? "Sačuvano" : "Sačuvaj izmene"}</button></div>
    </main>
  </div>;
}
