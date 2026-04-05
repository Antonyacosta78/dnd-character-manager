import type { Metadata } from "next";
import { Cinzel, Inter, Source_Serif_4 } from "next/font/google";
import { getLocale } from "next-intl/server";

import { LocalePreferenceConverger } from "@/app/locale-preference-converger";
import { ObservabilityBootstrap } from "@/app/observability-bootstrap";
import { DraftStoreProvider } from "@/client/state/draft-store.provider";
import { GlobalSettingsProvider } from "@/client/state/global-settings.provider";

import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "D&D Character Manager · Arcane Codex",
  description: "Arcane Codex design-system foundation for dense D&D character workflows.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-theme="arcane-codex"
      data-motion="system"
      data-theme-palette="2D"
      data-theme-font="bookish"
      data-theme-radius="moderate"
    >
      <body
        className={`${cinzel.variable} ${sourceSerif.variable} ${inter.variable} antialiased`}
      >
        <ObservabilityBootstrap />
        <LocalePreferenceConverger />
        <GlobalSettingsProvider>
          <DraftStoreProvider>{children}</DraftStoreProvider>
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
