export default {
  site: {
    description:
      "This portfolio is a parody-style homage to X. It features personal projects such as web services, apps, libraries, and self-designed keyboards.",
  },
  profile: {
    bio: `This portfolio is a parody-style homage to X.
It features personal projects such as web services, apps, libraries, and self-designed keyboards.`,
    parodyLabel: "Parody Site",
    updated: "Updated",
  },
  categories: {
    all: "All",
    web: "Web",
    software: "Software",
    keyboard: "Keyboard",
  },
  works: {
    "8pxapp": {
      title: "8px app",
      description: `A utility toolkit designed for web and app developers, offering Tailwind-friendly color palette generation, favicon creation, SVG optimization, and more.
Born from the idea of “putting all the tools I personally want in one place,” it emphasizes intuitive usability and a smooth workflow.`,
    },
    "tkinter-unblur": {
      title: "tkinter-unblur",
      description: `A minimalistic library that fixes the blurry Tkinter rendering issue on Windows high-DPI displays.
Just replace the import—and it works. No complex settings required, and easily integrates into existing codebases.`,
    },
    "mira-zero": {
      title: "mira zero",
      description: `A 40% split low-profile keyboard (Choc V1), fully self-designed including PCB and case.
Created as a first prototype to experiment with various techniques. Discontinued.`,
    },
    "botsu": {
      title: "Discarded Prototypes",
      description: `A collection of prototype keyboards I built on the way to discovering my endgame design.`,
    },
    "fosty-natural": {
      title: "fosty natural",
      description: `A low-profile 40% keyboard (Choc V2) inspired by the elegance of the HHKB layout.
Featuring a CNC-milled aluminum case, ultra-thin layout with no wasted space, gasket mount structure, USB Type-C, and a stable one-piece design optimized for portability.
The white × silver color scheme is matched down to the custom “chimera” switches.
Balancing feel, portability, layout, and aesthetics, it represents my personal “endgame” keyboard. (Not for sale)`,
    },
    "fosty-dark": {
      title: "fosty dark",
      description: `A sibling model to fosty natural: a 40% low-profile keyboard (Choc V2) crafted in a black × orange theme for darker desk setups.
Custom switches are tailored to match the color scheme.
Built simply because I wanted a black version — another personal endgame build. (Not for sale)`,
    },
    iromide: {
      title: "Iromide — Oshi Color Generator",
      description: `A web service that extracts a character’s signature color from an image and generates a Polaroid-style layout using the exact aspect ratio of real Instax film.
The color extraction algorithm is optimized to highlight key accent colors that often define the “oshi.”
Available within 8px.app.`,
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      description: `A dependency-free, type-safe, minimal i18n library for Next.js.
Simply prepare translation files and call the define function—usable in both Server and Client Components immediately.
All key paths such as messages.site.title and t("site.title") are fully typed and auto-suggested, eliminating typos.
Static generation features like generateStaticParams can be written cleanly without per-page duplication.
Routing, prefixes, and automatic language detection are all handled via a single middleware create() API.`,
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      description: `A zero-dependency, type-safe, minimal internationalization library for Astro.
Works with both SSG and SSR. Configuration is completed by a single define function, with full auto-completion for key paths like messages.common.title.
Locale handling in getStaticPaths requires only minimal setup, avoiding repetitive per-page definitions.
Routing configuration is handled with middleware.create(), supporting prefix/no-prefix modes and automatic language detection.`,
    },
  },
  footer: {
    endOfTimeline: "That's all",
    privacyPolicy: "Privacy Policy (Japanese)",
  },
  pinned: "Pinned",
};
