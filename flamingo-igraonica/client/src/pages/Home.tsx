import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Armchair,
  ArrowDownRight,
  ArrowUpRight,
  CakeSlice,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Disc3,
  Facebook,
  Heart,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Music,
  PartyPopper,
  Phone,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { BirthdayPackage, defaultPackages, navItems, reviews } from "@/lib/content";
import { defaultFeatures, loadLocalFeatures, loadLocalGallery, loadLocalPackages } from "@/lib/local-store";
import { trpc } from "@/lib/trpc";

const featureItems = [
  { icon: Coffee, title: "Dva u jedan koncept", text: "Spoj moderne dečije igraonice i vrhunske poslastičare gde roditelji mogu da uživaju dok se deca bezbedno igraju." },
  { icon: Music, title: "Dečija diskoteka", text: "Posebno opremljen disko prostor sa svetlosnim efektima, disko kuglom, ozvučenjem i karaoke sistemom." },
  { icon: Utensils, title: "Domaće poslastice i kolači", text: "Sveži kolači, torte, kupovi i topli napici napravljeni po tradicionalnoj recepturi, sa modernim twistom." },
  { icon: ShieldCheck, title: "Bezbedan i topao prostor", text: "Prilagođene igračke, tobogani i podloge gde su sigurnost i čistoća uvek na prvom mestu." },
  { icon: PartyPopper, title: "Organizacija rođendana", text: "Kompletna usluga proslave sa iskusnim animatorima, posluženjem i ukrašavanjem prostora." },
  { icon: Heart, title: "Klimatizovan ambijent", text: "Moderan, svetao i čist enterijer osmišljen za maksimalan komfor dece i roditelja tokom cele godine." },
  { icon: Armchair, title: "Kutak za roditelje", text: "Udobna sedišta u poslastičari sa odličnim pogledom na igralište – da i vaš predah bude pravi predah." },
  { icon: MapPin, title: "Odlična lokacija u Nišu", text: "Smešteni smo u Cara Dušana 162, na pristupačnoj lokaciji sa lakim prilazom i parkingom u blizini." },
];

const faqs = [
  { q: "Da li je potrebno unapred rezervisati termin?", a: "Da. Termini za rođendane brzo se popunjavaju, pa preporučujemo da nam se javite najmanje dve do tri nedelje unapred." },
  { q: "Za koji uzrast je igraonica namenjena?", a: "Flamingo je osmišljen za decu od 2 do 10 godina, sa zonama i sadržajima koji se prilagođavaju uzrastu." },
  { q: "Da li možemo doneti svoju tortu?", a: "Naravno. Možete doneti sopstvenu tortu, a na raspolaganju su vam i naše domaće torte koje spremamo po dogovoru." },
  { q: "Koliko dece može da bude na proslavi?", a: "Paketi su fleksibilni, a idealna proslava je za 10 do 25 dece. Za veće grupe rado ćemo napraviti personalizovanu ponudu." },
  { q: "Da li roditelji ostaju tokom rođendana?", a: "Roditelji su dobrodošli da ostanu u našem café delu, odakle imaju lep pogled na igraonicu. Za najmlađe je prisustvo roditelja preporučeno." },
  { q: "Kako da dođemo do vas?", a: "Nalazimo se na adresi Cara Dušana 162 u Nišu. Pozovite 060 692 1134 i poslaćemo vam detaljne instrukcije za dolazak." },
];

const gallery = [
  { src: "/images/flamingo-hero.jpg", label: "Mesto za najlepše uspomene", className: "md:col-span-7 md:row-span-2" },
  { src: "/images/flamingo-playroom.jpg", label: "Igra bez granica", className: "md:col-span-5" },
  { src: "/images/flamingo-cake.jpg", label: "Torte sa potpisom", className: "md:col-span-5" },
  { src: "/images/flamingo-disco.jpg", label: "Plešemo do poslednje pesme", className: "md:col-span-4" },
];

const featureIconMap = { Coffee, Music, Utensils, ShieldCheck, PartyPopper, Heart, Armchair, MapPin } as const;
const featureFromLocal = (row: (typeof defaultFeatures)[number]) => ({ icon: featureIconMap[row.icon as keyof typeof featureIconMap] ?? Sparkles, title: row.title, text: row.text });

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Stars({ size = 14 }: { size?: number }) {
  return <span className="inline-flex gap-0.5 text-[#f6a85f]" aria-label="5 zvezdica">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill="currentColor" strokeWidth={1.5} />)}</span>;
}

function SectionHeading({ kicker, title, text, align = "left", light = false }: { kicker: string; title: React.ReactNode; text?: string; align?: "left" | "center"; light?: boolean }) {
  return <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl`}>
    <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d95767]"><span className="h-px w-8 bg-[#e58383]" />{kicker}</p>
    <h2 className={`font-display text-4xl leading-[0.98] tracking-[-0.045em] sm:text-5xl ${light ? "text-white" : "text-[#122744]"}`}>{title}</h2>
    {text && <p className={`mt-5 max-w-xl text-base leading-7 ${light ? "text-[#b7c3d1]" : "text-[#61718b]"}`}>{text}</p>}
  </div>;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("pocetna");
  const [packages, setPackages] = useState<BirthdayPackage[]>(defaultPackages);
  const [features, setFeatures] = useState(featureItems);
  const [galleryItems, setGalleryItems] = useState(gallery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const contentQuery = trpc.flamingoAdmin.publicContent.useQuery(undefined, { retry: false });
  const reservationMutation = trpc.flamingoAdmin.submitReservation.useMutation();

  useEffect(() => {
    let mounted = true;
    const loadLocalContent = () => {
      if (!mounted) return;
      const localPackages = loadLocalPackages();
      const localFeatures = loadLocalFeatures().filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
      const localGallery = loadLocalGallery().filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
      if (localPackages.length) setPackages(localPackages);
      if (localFeatures.length) setFeatures(localFeatures.map(featureFromLocal));
      if (localGallery.length) setGalleryItems(localGallery);
    };
    loadLocalContent();
    window.addEventListener("storage", loadLocalContent);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-22% 0px -62% 0px", threshold: [0.1, 0.3, 0.6] });
    navItems.forEach(([, id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => { mounted = false; observer.disconnect(); window.removeEventListener("storage", loadLocalContent); };
  }, []);

  useEffect(() => {
    const data = contentQuery.data;
    if (!data) return;
    if (data.packages.length) setPackages(data.packages.map((row) => ({ id: row.id, eyebrow: row.eyebrow, name: row.title, description: row.description, price: row.price, color: row.color, features: Array.isArray(row.features) ? row.features as string[] : [] })));
    if (data.features.length) setFeatures(data.features.map((row) => { const Icon = featureIconMap[row.icon as keyof typeof featureIconMap] ?? Sparkles; return { icon: Icon, title: row.title, text: row.description }; }));
    if (data.gallery.length) setGalleryItems(data.gallery.map((row, index) => ({ src: row.image_url, label: row.title, className: gallery[index % gallery.length].className })));
  }, [contentQuery.data]);

  const visiblePackages = useMemo(() => packages.length ? packages : defaultPackages, [packages]);
  const submitReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      await reservationMutation.mutateAsync({ name: String(values.get("name") ?? ""), phone: String(values.get("phone") ?? ""), occasion: String(values.get("occasion") ?? "Rođendan"), message: String(values.get("message") ?? "") });
      setFormSubmitting(false); form.reset(); setFormSent(true);
    } catch {
      setFormSubmitting(false); setFormError("Trenutno nije moguće poslati upit. Pozovite nas na 060 692 1134.");
    }
  };

  return <div className="min-h-screen overflow-hidden bg-[#fcfaf7] text-[#122744] selection:bg-[#f7bdad] selection:text-[#122744]">
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="flex min-h-[76px] items-center gap-3 border-b border-white/70 bg-[#fcfaf7]/90 px-4 shadow-[0_14px_45px_rgba(18,39,68,0.08)] backdrop-blur-xl sm:px-6 lg:px-10">
        <button onClick={() => scrollToSection("pocetna")} className="group flex shrink-0 items-center gap-2 px-1 sm:px-2" aria-label="Flamingo početna">
          <img src="/images/flamingo-logo.png" alt="Flamingo logo" className="h-14 w-14 object-contain transition-transform duration-300 group-hover:rotate-6" />
          <span className="hidden text-left sm:block"><span className="block font-display text-lg font-semibold leading-4 tracking-[-0.03em]">Flamingo</span><span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#d95767]">igraonica · poslastičara</span></span>
        </button>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 xl:flex" aria-label="Glavna navigacija">
          {navItems.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className="relative rounded-full px-3.5 py-2 text-[12px] font-semibold text-[#53627a] transition hover:text-[#122744]">
            {activeSection === id && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-[#f5e9d9]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}{label}
          </button>)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <a href="tel:0606921134" className="flex items-center gap-2 rounded-full bg-[#f5e9d9] px-3 py-2 text-[11px] font-bold text-[#122744] transition hover:bg-[#f0d7c5]"><Phone size={13} />060 692 1134</a>
          <button onClick={() => scrollToSection("kontakt")} className="rounded-full bg-[#d95767] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#be4657]">Pošalji upit</button>
        </div>
        <button className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-[#122744] text-white lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Otvori meni">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      <AnimatePresence>{menuOpen && <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-[1440px] rounded-3xl border border-white/80 bg-[#fffdf9] p-4 shadow-2xl xl:hidden">
        <div className="grid gap-1">{navItems.map(([label, id]) => <button key={id} onClick={() => { scrollToSection(id); setMenuOpen(false); }} className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#53627a] hover:bg-[#f8eee5] hover:text-[#122744]">{label}<ArrowUpRight size={15} /></button>)}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eee7df] pt-3"><a href="tel:0606921134" className="flex items-center justify-center gap-2 rounded-full bg-[#f5e9d9] py-3 text-xs font-bold"><Phone size={14} /> Pozovi</a><button onClick={() => { scrollToSection("kontakt"); setMenuOpen(false); }} className="rounded-full bg-[#d95767] py-3 text-xs font-bold text-white">Pošalji upit</button></div>
      </motion.nav>}</AnimatePresence>
    </header>

    <main>
      <section id="pocetna" className="relative flex min-h-[780px] items-end overflow-hidden bg-[#2a1b1a] pt-28 sm:min-h-[820px] lg:min-h-[860px]">
        <img src="/images/flamingo-hero.jpg" alt="Svetao prostor Flamingo igraonice i poslastičare" className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-75" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,27,26,0.98)_0%,rgba(50,29,25,0.88)_33%,rgba(50,29,25,0.2)_75%,rgba(50,29,25,0.1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(42,27,26,0.74),transparent_38%)]" />
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-16 px-5 pb-14 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:px-16 lg:pb-20">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f7d7c7] backdrop-blur-sm"><Sparkles size={14} className="text-[#ffb8a5]" /> dobrodošli u flamingo</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .7 }} className="max-w-[720px] font-display text-[clamp(3.6rem,8vw,7.7rem)] font-normal leading-[0.92] tracking-[-0.045em] text-[#fffaf3]">Mesto gde<br /><em className="font-normal text-[#ffb6a6]">rastemo</em><br />uz osmeh.</motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18, duration: .6 }} className="mt-8 max-w-lg text-base leading-7 text-[#d9e1ea] sm:text-lg">Premium poslastičara za roditelje. Bezbedna igraonica sa diskom za decu. Jedan prostor, dva razloga da ostanete duže.</motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .6 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => scrollToSection("kontakt")} className="group flex items-center justify-center gap-3 rounded-full bg-[#ffb6a6] px-5 py-3.5 text-sm font-bold text-[#122744] transition hover:bg-[#ffd0c2]">Pogledaj kontakt <ArrowDownRight size={17} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></button>
              <a href="tel:0606921134" className="flex items-center justify-center gap-3 rounded-full border border-white/30 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"><Phone size={16} /> Pozovi odmah</a>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .7 }} className="flex justify-start lg:justify-end">
            <div className="max-w-xs rounded-[28px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between"><span className="font-display text-xl italic">Google recenzije</span><Quote size={22} className="text-[#ffb6a6]" /></div>
              <div className="mt-7 flex items-end gap-3"><span className="font-display text-6xl leading-none">4.2</span><div className="pb-1"><Stars size={16} /><p className="mt-1 text-[11px] text-[#d9e1ea]">više od 60 recenzija korisnika</p></div></div>
              <div className="mt-5 h-px bg-white/15" /><p className="mt-4 text-sm leading-6 text-[#d9e1ea]">„Ovde se deca igraju, a roditelji stvarno odmore.“</p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-5 right-6 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 lg:flex"><span className="h-px w-12 bg-white/40" /> Cara Dušana 162 · Niš</div>
      </section>

      <section id="o-nama" className="relative bg-[#fcfaf7] px-5 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1280px]"><div className="grid gap-14 lg:grid-cols-[.86fr_1.14fr] lg:gap-24"><motion.div initial={{ opacity: 0, x: -22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: .65 }}><SectionHeading kicker="Zašto Flamingo" title={<>Više od igraonice.<br /><em className="font-normal text-[#d95767]">Mali svet</em> za velike dane.</>} text="Flamingo je nastao iz jedne jednostavne želje: da deca imaju prostor za igru, a roditelji mesto za razgovor, kafu i kolač. Sve pod istim krovom, bez žurbe." /><div className="mt-10 flex items-center gap-4 border-t border-[#dedfdc] pt-5"><div className="flex -space-x-2"><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#fcfaf7] bg-[#f6c8bb] font-display text-sm">m</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#fcfaf7] bg-[#cfc8ed] font-display text-sm">a</span><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#fcfaf7] bg-[#f7db92] font-display text-sm">n</span></div><p className="text-xs leading-5 text-[#6e7b8d]">Porodično mesto<br /><strong className="text-[#122744]">od 2019. godine</strong></p></div></motion.div><div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">{features.map(({ icon: Icon, title, text }, i) => <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: i * .045, duration: .45 }} className="group border-t border-[#dedfdc] pt-5"><div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5e9d9] text-[#d95767] transition group-hover:bg-[#d95767] group-hover:text-white"><Icon size={18} strokeWidth={1.8} /></span><div><h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#122744]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6e7b8d]">{text}</p></div></div></motion.div>)}</div></div></div>
      </section>

      <section id="ponude" className="bg-[#f3ece3] px-5 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="mx-auto max-w-[1280px]"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><SectionHeading kicker="Ponude za rođendane" title={<>Izaberi svoj<br /><em className="font-normal text-[#d95767]">najlepši paket.</em></>} text="Za svaki uzrast, svaku temu i svaku malu želju. Mi brinemo o detaljima, vi uživate u danu." /><span className="hidden rounded-full border border-[#d7cfc6] px-4 py-2 text-xs font-semibold text-[#7a7e83] md:block">Pomerite se za još malo radosti →</span></div><div className="mt-14 grid gap-5 lg:grid-cols-3">{visiblePackages.map((pkg, i) => <motion.article key={pkg.id} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 360, damping: 24 }} className={`relative flex min-h-[430px] flex-col overflow-hidden rounded-[28px] p-7 ${pkg.color === "navy" ? "bg-[#122744] text-white" : pkg.color === "coral" ? "bg-[#f2b5a7] text-[#122744]" : "bg-[#d8d1ed] text-[#122744]"}`}><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[18px] border-white/15" /><div className="relative flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-65">0{i + 1} · {pkg.eyebrow}</p>{i === 1 && <span className="rounded-full bg-[#fffaf3]/75 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#d95767]">najtraženiji</span>}</div><h3 className="relative mt-12 max-w-[220px] font-display text-4xl font-semibold leading-[0.94] tracking-[-0.05em]">{pkg.name}</h3><p className="relative mt-4 max-w-[280px] text-sm leading-6 opacity-70">{pkg.description}</p><div className="relative mt-auto"><ul className="space-y-2 border-t border-current/15 pt-5 text-sm">{pkg.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check size={14} className="shrink-0 opacity-70" />{feature}</li>)}</ul><div className="mt-6 flex items-center justify-between"><span className="font-display text-2xl font-semibold">{pkg.price}</span><button onClick={() => scrollToSection("kontakt")} className={`grid h-11 w-11 place-items-center rounded-full transition ${pkg.color === "navy" ? "bg-[#ffb6a6] text-[#122744] hover:bg-white" : "bg-[#122744] text-white hover:bg-[#d95767]"}`} aria-label={`Pošalji upit za ${pkg.name}`}><ArrowUpRight size={18} /></button></div></div></motion.article>)}</div></div></section>

      <section id="faq" className="bg-[#fcfaf7] px-5 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="mx-auto grid max-w-[1060px] gap-14 lg:grid-cols-[.75fr_1.25fr] lg:gap-24"><SectionHeading kicker="Česta pitanja" title={<>Sve što vas<br /><em className="font-normal text-[#d95767]">zanima.</em></>} text="Ako ne pronađete odgovor, javite nam se. Tu smo da zajedno osmislimo savršen dan." /> <div className="divide-y divide-[#dedfdc] border-y border-[#dedfdc]">{faqs.map((faq, i) => <div key={faq.q}><button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between gap-5 py-5 text-left"><span className="font-display text-xl font-semibold tracking-[-0.025em] text-[#122744]">{faq.q}</span><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${faqOpen === i ? "bg-[#d95767] text-white" : "bg-[#f3ece3] text-[#122744]"}`}><ChevronDown size={16} className={`transition-transform ${faqOpen === i ? "rotate-180" : ""}`} /></span></button><AnimatePresence initial={false}>{faqOpen === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="max-w-xl pb-5 pr-10 text-sm leading-6 text-[#6e7b8d]">{faq.a}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

      <section id="galerija" className="bg-[#fffdf9] px-5 pb-24 sm:px-10 lg:px-16 lg:pb-32"><div className="mx-auto max-w-[1280px]"><div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading kicker="Galerija" title={<>Uđite u naš<br /><em className="font-normal text-[#d95767]">mali univerzum.</em></>} /><p className="max-w-xs text-sm leading-6 text-[#6e7b8d]">Topli tonovi, mekani ćoškovi, mnogo svetla i još više razloga da se vratite.</p></div><div className="grid gap-4 md:auto-rows-[230px] md:grid-cols-12">{galleryItems.map((item, i) => <motion.div key={`${item.src}-${i}`} whileHover={{ scale: .985 }} className={`group relative min-h-[250px] overflow-hidden rounded-[28px] ${item.className}`}><img src={item.src} alt={item.label} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#122744]/75 via-transparent to-transparent opacity-85" /><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white"><span className="font-display text-xl font-semibold">{item.label}</span><span className="grid h-9 w-9 place-items-center rounded-full border border-white/35 bg-white/10 backdrop-blur-sm"><ArrowUpRight size={16} /></span></div></motion.div>)}</div></div></section>

      <section id="recenzije" className="bg-[#122744] px-5 py-24 text-white sm:px-10 lg:px-16 lg:py-32"><div className="mx-auto max-w-[1280px]"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><SectionHeading light kicker="Utisci naših gostiju" title={<>Reči koje<br /><em className="font-normal text-[#ffb6a6]">nam znače.</em></>} text="Hvala vam što svaki dolazak pretvarate u uspomenu koju čuvamo." /><div className="flex items-center gap-3 pb-1"><span className="font-display text-5xl">4.2</span><div><Stars size={15} /><p className="mt-1 text-xs text-[#b7c3d1]">60+ recenzija</p></div></div></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reviews.map((review, i) => <motion.article key={review.name} whileHover={{ y: -5 }} className={`rounded-[26px] border border-white/10 p-6 ${i === 1 ? "bg-[#ffb6a6] text-[#122744]" : i === 4 ? "bg-[#d8d1ed] text-[#122744]" : "bg-white/[.07]"}`}><div className="flex items-start justify-between"><Stars size={14} /><Quote size={22} className="opacity-25" /></div><p className="mt-8 min-h-[115px] text-[15px] leading-7 opacity-85">“{review.text}”</p><div className="mt-6 flex items-center gap-3 border-t border-current/10 pt-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-current/10 font-display text-sm font-semibold">{review.name.slice(0, 1)}</span><div><p className="text-sm font-bold">{review.name}</p><p className="text-[10px] uppercase tracking-[0.12em] opacity-55">{review.note}</p></div></div></motion.article>)}</div></div></section>

      <section id="kontakt" className="bg-[#f3ece3] px-5 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="mx-auto max-w-[1280px]"><div className="grid overflow-hidden rounded-[36px] bg-[#fffdf9] shadow-[0_20px_70px_rgba(18,39,68,0.08)] lg:grid-cols-[.95fr_1.05fr]"><div className="relative min-h-[520px] overflow-hidden bg-[#d8d1ed] p-8 sm:p-12"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[35px] border-white/30" /><div className="relative z-10"><SectionHeading kicker="Dođite da se družimo" title={<>Vaš sledeći<br /><em className="font-normal text-[#d95767]">lep dan.</em></>} text="Pišite nam, pozovite nas ili samo svratite na kolač. Flamingo vas čeka u Nišu." /><div className="mt-12 space-y-6"><a href="tel:0606921134" className="flex items-center gap-4 text-[#122744]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65"><Phone size={18} /></span><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-55">Telefon</span><strong className="font-display text-2xl">060 692 1134</strong></span></a><div className="flex items-center gap-4 text-[#122744]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65"><MapPin size={18} /></span><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-55">Adresa</span><strong className="font-display text-xl">Cara Dušana 162, Niš</strong></span></div><div className="flex items-center gap-4 text-[#122744]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65"><Clock3 size={18} /></span><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-55">Radno vreme</span><strong className="font-display text-xl">Svaki dan · 09:00–22:00</strong></span></div></div><div className="mt-12 flex gap-2"><a href="https://www.instagram.com/flamingo_nis/?hl=en" className="grid h-10 w-10 place-items-center rounded-full bg-[#122744] text-white transition hover:bg-[#d95767]" aria-label="Instagram"><Instagram size={17} /></a><a href="https://www.facebook.com/p/Flamingo-Ni%C5%A1-61578372068719/" className="grid h-10 w-10 place-items-center rounded-full bg-[#122744] text-white transition hover:bg-[#d95767]" aria-label="Facebook"><Facebook size={17} /></a></div></div></div><div className="p-8 sm:p-12"><div className="mb-8 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d95767]">Pošalji upit</p><h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">Hajde da isplaniramo<br />nešto <em className="font-normal">posebno.</em></h3></div><span className="hidden rounded-full bg-[#f5e9d9] px-3 py-2 text-[10px] font-bold text-[#d95767] sm:block">Odgovaramo brzo</span></div>{formSent ? <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="grid min-h-[340px] place-items-center rounded-[24px] bg-[#f3ece3] p-8 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#d95767] text-white"><Check size={26} /></span><div><h4 className="mt-5 font-display text-3xl">Upit je poslat!</h4><p className="mt-2 max-w-xs text-sm leading-6 text-[#6e7b8d]">Hvala vam. Javljamo se uskoro na ostavljeni kontakt.</p></div><button onClick={() => setFormSent(false)} className="text-xs font-bold text-[#d95767] underline underline-offset-4">Pošalji novi upit</button></motion.div> : <form onSubmit={submitReservation} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Ime i prezime</span><input name="name" required placeholder="Vaše ime" className="w-full border-b border-[#d9dce0] bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-[#aab2bd] focus:border-[#d95767]" /></label><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Telefon</span><input name="phone" required type="tel" placeholder="060 000 0000" className="w-full border-b border-[#d9dce0] bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-[#aab2bd] focus:border-[#d95767]" /></label></div><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Povod dolaska</span><select name="occasion" className="w-full border-b border-[#d9dce0] bg-transparent px-0 py-3 text-sm text-[#53627a] outline-none focus:border-[#d95767]"><option>Rođendan</option><option>Rezervacija stola</option><option>Pitanje o ponudi</option><option>Nešto drugo</option></select></label><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6e7b8d]">Poruka</span><textarea name="message" required rows={3} placeholder="Napišite nam par reči..." className="w-full resize-none border-b border-[#d9dce0] bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-[#aab2bd] focus:border-[#d95767]" /></label>{formError && <p className="text-xs font-semibold text-[#d95767]">{formError}</p>}<button type="submit" disabled={formSubmitting} className="group flex w-full items-center justify-between rounded-full bg-[#122744] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#d95767] disabled:cursor-wait disabled:opacity-60"><span>{formSubmitting ? "Šaljem upit…" : "Pošalji poruku"}</span><Send size={17} className="transition-transform group-hover:translate-x-1" /></button></form>}</div></div><div className="mt-5 overflow-hidden rounded-[28px] border border-[#e5ddd4] bg-[#fffdf9]"><iframe title="Mapa lokacije Flamingo" src="https://www.google.com/maps?q=Cara%20Du%C5%A1ana%20162%2C%20Ni%C5%A1&output=embed" className="h-56 w-full grayscale-[.65] opacity-80" loading="lazy" /></div></div></section>
    </main>

    <footer className="bg-[#122744] px-5 py-8 text-white sm:px-10 lg:px-16"><div className="mx-auto flex max-w-[1280px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => scrollToSection("pocetna")} className="flex items-center gap-2 text-left"><img src="/images/flamingo-logo.png" alt="Flamingo logo" className="h-11 w-11 object-contain" /><span><span className="block font-display text-lg leading-4">flamingo</span><span className="text-[8px] uppercase tracking-[0.16em] text-[#aab6c7]">igraonica · poslastičara</span></span></button><p className="text-xs text-[#aab6c7]">Mesto za male radosti i velike uspomene.</p><div className="flex items-center gap-5"><Link href="/admin" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aab6c7] transition hover:text-white">Admin</Link><span className="text-xs text-[#71839a]">© 2024 Flamingo</span></div></div></footer>
  </div>;
}
