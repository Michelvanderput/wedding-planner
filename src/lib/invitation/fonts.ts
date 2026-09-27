import {
  Allura,
  Cinzel,
  Dancing_Script,
  EB_Garamond,
  Italiana,
  Josefin_Sans,
  Lora,
  Marcellus,
  Montserrat,
  Parisienne,
  Pinyon_Script,
  Playfair_Display,
  Poiret_One,
  Quicksand,
} from "next/font/google";

// Extra lettertypen voor de uitnodiging. preload: false → een bestand wordt pas
// gedownload als een gast een thema met dat lettertype bekijkt.
const pinyon = Pinyon_Script({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-pinyon" });
const parisienne = Parisienne({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-parisienne" });
const dancing = Dancing_Script({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-dancing" });
const allura = Allura({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-allura" });
const italiana = Italiana({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-italiana" });
const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-cinzel" });
const poiret = Poiret_One({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-poiret" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--ff-playfair" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--ff-lora" });
const garamond = EB_Garamond({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--ff-garamond" });
const marcellus = Marcellus({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-marcellus" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-montserrat" });
const josefin = Josefin_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-josefin" });
const quicksand = Quicksand({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-quicksand" });

/** Klassen die de CSS-variabelen van alle uitnodigingsfonts beschikbaar maken. */
export const invitationFontVars = [
  pinyon, parisienne, dancing, allura, italiana, cinzel, poiret, playfair, lora, garamond, marcellus, montserrat, josefin, quicksand,
]
  .map((f) => f.variable)
  .join(" ");
