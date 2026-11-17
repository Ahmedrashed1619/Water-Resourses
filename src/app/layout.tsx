import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider } from "@/i18n/context";
import { THEME_COOKIE } from "@/lib/constants";
import { getLocale } from "@/lib/locale";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "800"], variable: "--font-cairo", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ar" ? "أوبريو | تعاقدات قطاع الري" : "Operio | Irrigation Sector contracts",
    description: locale === "ar"
      ? "متابعة العمليات التعاقدية لقطاع الري والإدارات التابعة له"
      : "Contract follow-up for the Irrigation Sector and its departments",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${cairo.variable}${theme === "dark" ? " dark" : ""}`} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("operio-theme");if(t==="dark")document.documentElement.classList.add("dark");if(t==="light")document.documentElement.classList.remove("dark");}catch(e){}`,
          }}
        />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
