import "./globals.css";
import { Inter } from "next/font/google";
import SessionWrapper from "./components/SessionWrapper";
import { Providers } from "./providers";
import { Navbar } from "./components/partials/Navbar";
import { Footer } from "./components/partials/Footer";
import DemoBanner from "./components/DemoBanner";
import { IS_DEMO_MODE } from "../utils/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: {
    default: "SuperRay",
    template: "%s · SuperRay",
  },
  description:
    "SuperRay is a research prototype for medical image super-resolution (SR-GAN), image classification (DenseNet) and LLM-assisted report drafting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans">
        <SessionWrapper>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              {IS_DEMO_MODE && <DemoBanner />}
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </SessionWrapper>
      </body>
    </html>
  );
}
