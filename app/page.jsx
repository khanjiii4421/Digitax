import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import HowItWorks from "@/components/sections/HowItWorks";
import TaxCalculator from "@/components/sections/TaxCalculator";
import PromoPopup from "@/components/PromoPopup";
import Partners from "@/components/sections/Partners";
import PopularProducts from "@/components/sections/PopularProducts";
import WaveAnimation from "@/components/sections/WaveAnimation";
import Testimonials from "@/components/sections/Testimonials";
import Team from "@/components/sections/Team";
import FeaturedVideos from "@/components/sections/FeaturedVideos";
import BlogPosts from "@/components/sections/BlogPosts";
import QueryForm from "@/components/sections/QueryForm";
import Footer from "@/components/Footer";
import PromotionalBanners from "@/components/sections/PromotionalBanners";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "DIGITAX — Pakistan's Premier Tax & Business Consultants",
  description:
    "Expert tax filing, NTN & company registration, FBR compliance, and legal advisory services across Pakistan. Get started today.",
};

export default async function Home() {
  const settings = await db.all("SELECT * FROM settings");
  const taxSlabs = await db.all("SELECT * FROM tax_slabs");
  const partners = await db.all("SELECT * FROM partners ORDER BY display_order ASC");
  const products = await db.all("SELECT * FROM products ORDER BY display_order ASC");
  const testimonials = await db.all("SELECT * FROM testimonials");
  const team = await db.all("SELECT * FROM team");
  const videos = await db.all("SELECT * FROM videos ORDER BY display_order ASC");
  const blogs = await db.all("SELECT * FROM blogs ORDER BY display_order ASC");

  const siteLogo = settings.find((s) => s.key === "site_logo")?.value;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = verifyToken(token);

  return (
    <main className="min-h-screen bg-white text-text-primary overflow-x-hidden">
      <AnnouncementBar settings={settings} />
      <Header logoUrl={siteLogo} initialUser={user} settings={settings} />
      <Hero settings={settings} user={user} />
      <TrustBadges />
      <HowItWorks />
      <TaxCalculator slabs={taxSlabs} />
      <Partners partners={partners} />
      <PopularProducts products={products} user={user} />
      <PromotionalBanners />
      <Testimonials testimonials={testimonials} />
      <WaveAnimation />
      <Team team={team} settings={settings} />
      <FeaturedVideos videos={videos} />
      <BlogPosts blogs={blogs} />
      <QueryForm />
      <Footer settings={settings} />
      <PromoPopup settings={settings} />
    </main>
  );
}
