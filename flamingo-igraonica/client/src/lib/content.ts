export type BirthdayPackage = {
  id: string;
  eyebrow: string;
  name: string;
  description: string;
  price: string;
  color: "lilac" | "coral" | "navy";
  features: string[];
};

export const defaultPackages: BirthdayPackage[] = [
  {
    id: "klasik",
    eyebrow: "Za male slavljenike",
    name: "Klasik paket",
    description: "Sve što je potrebno za veselu, bezbrižnu proslavu u omiljenom kutku igraonice.",
    price: "1.200 RSD po osobi",
    color: "lilac",
    features: ["2 sata u igraonici", "Animator za decu", "Sokovi i grickalice", "Tematska dekoracija"],
  },
  {
    id: "premium",
    eyebrow: "Najčešći izbor",
    name: "Premium paket",
    description: "Naš najtraženiji paket za rođendan koji se dugo prepričava – od prvog do poslednjeg plesa.",
    price: "1.650 RSD po osobi",
    color: "coral",
    features: ["2,5 sata u igraonici", "Premium torta po izboru", "Disco & karaoke žurka", "Fotografisanje trenutaka"],
  },
  {
    id: "flamingo",
    eyebrow: "Za velike trenutke",
    name: "Flamingo specijal",
    description: "Potpuno personalizovana proslava za porodice koje žele baš sve – i još malo više.",
    price: "2.200 RSD po osobi",
    color: "navy",
    features: ["3 sata ekskluzivnog prostora", "Torta sa ličnim dizajnom", "Kompletna dekoracija", "Poklon za slavljenika"],
  },
];

export function loadPackages(): BirthdayPackage[] {
  if (typeof window === "undefined") return defaultPackages;
  try {
    const stored = window.localStorage.getItem("flamingo-packages-v2");
    return stored ? (JSON.parse(stored) as BirthdayPackage[]) : defaultPackages;
  } catch {
    return defaultPackages;
  }
}

export function savePackages(packages: BirthdayPackage[]) {
  window.localStorage.setItem("flamingo-packages-v2", JSON.stringify(packages));
}

export const navItems = [
  ["Početna", "pocetna"],
  ["O nama", "o-nama"],
  ["Ponude", "ponude"],
  ["FAQ", "faq"],
  ["Galerija", "galerija"],
  ["Recenzije", "recenzije"],
  ["Kontakt", "kontakt"],
] as const;

export const reviews = [
  { name: "Maka Maka", text: "Sjajna igraonica i još bolje osoblje. Nećete zažaliti ako ovde organizujete rođendan. Torte su im vrhunske.", note: "Roditelj slavljenika" },
  { name: "Vanjolka", text: "Moja ćerka je bila oduševljena svojim rođendanom, a i mi! Sve pohvale za igraonicu, od ljubaznih i istinski posvećenih animatora, pa sve do torte! 🥳🩷", note: "Roditelj slavljenice" },
  { name: "Ilija Jovanovic", text: "Devojke koje rade su super, deca su oduševljena, sve pohvale za njih! Prostor je lepo osmišljen za proslave.", note: "Gost" },
  { name: "Mila Miljkovic", text: "Veoma lepa, čista i uredna igraonica. Animatori su za svaku pohvalu. Cela organizacija rođendana je bila odlična. Sve je bilo kako je dogovoreno.", note: "Roditelj slavljenika" },
  { name: "Stefan Stojanovic", text: "Veoma ljubazno osoblje, prelep ambijent, sigurno i prilagođeno deci. Poslastice su neverovatne, toplo preporučujem porodicama koje traže ovaj tip kafića i igraonice.", note: "Veryfan91 · Local Guide" },
  { name: "Miloš Živković", text: "Sjajna igraonica, sve preporuke!", note: "Gost" },
];
