import { BirthdayPackage, defaultPackages } from "./content";

export type LocalFeature = { id: string; icon: string; title: string; text: string; is_active: boolean; sort_order: number };
export type LocalGallery = { id: string; src: string; label: string; className: string; is_active: boolean; sort_order: number };
export type LocalReservation = { id: string; name: string; phone: string; occasion: string; message: string; status: "novi" | "potvrdjen" | "odbijen"; created_at: string };

export const defaultFeatures: LocalFeature[] = [
  ["Coffee", "Dva u jedan koncept", "Spoj moderne dečije igraonice i vrhunske poslastičare gde roditelji mogu da uživaju dok se deca bezbedno igraju."],
  ["Music", "Dečija diskoteka", "Posebno opremljen disko prostor sa svetlosnim efektima, disko kuglom, ozvučenjem i karaoke sistemom."],
  ["Utensils", "Domaće poslastice i kolači", "Sveži kolači, torte, kupovi i topli napici napravljeni po tradicionalnoj recepturi, sa modernim twistom."],
  ["ShieldCheck", "Bezbedan i topao prostor", "Prilagođene igračke, tobogani i podloge gde su sigurnost i čistoća uvek na prvom mestu."],
  ["PartyPopper", "Organizacija rođendana", "Kompletna usluga proslave sa iskusnim animatorima, posluženjem i ukrašavanjem prostora."],
  ["Heart", "Klimatizovan ambijent", "Moderan, svetao i čist enterijer osmišljen za maksimalan komfor dece i roditelja tokom cele godine."],
  ["Armchair", "Kutak za roditelje", "Udobna sedišta u poslastičari sa odličnim pogledom na igraonicu – da i vaš predah bude pravi predah."],
  ["MapPin", "Odlična lokacija u Nišu", "Smešteni smo u Cara Dušana 162, na pristupačnoj lokaciji sa lakim prilazom i parkingom u blizini."],
].map(([icon, title, text], index) => ({ id: `feature-${index + 1}`, icon, title, text, is_active: true, sort_order: index + 1 }));

export const defaultGallery: LocalGallery[] = [
  ["Mesto za najlepše uspomene", "/images/flamingo-hero.jpg", "md:col-span-7 md:row-span-2"],
  ["Igra bez granica", "/images/flamingo-playroom.jpg", "md:col-span-5"],
  ["Torte sa potpisom", "/images/flamingo-cake.jpg", "md:col-span-5"],
  ["Plešemo do poslednje pesme", "/images/flamingo-disco.jpg", "md:col-span-4"],
].map(([label, src, className], index) => ({ id: `gallery-${index + 1}`, label, src, className, is_active: true, sort_order: index + 1 }));

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new StorageEvent("storage", { key })); }

export const loadLocalPackages = () => read<BirthdayPackage[]>("flamingo-packages-local", defaultPackages);
export const saveLocalPackages = (value: BirthdayPackage[]) => write("flamingo-packages-local", value);
export const loadLocalFeatures = () => read<LocalFeature[]>("flamingo-features-local", defaultFeatures);
export const saveLocalFeatures = (value: LocalFeature[]) => write("flamingo-features-local", value);
export const loadLocalGallery = () => read<LocalGallery[]>("flamingo-gallery-local", defaultGallery);
export const saveLocalGallery = (value: LocalGallery[]) => write("flamingo-gallery-local", value);
export const loadLocalReservations = () => read<LocalReservation[]>("flamingo-reservations-local", []);
export const saveLocalReservations = (value: LocalReservation[]) => write("flamingo-reservations-local", value);
