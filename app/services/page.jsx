import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServicesList from "./ServicesList";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Business & Tax Services | DIGITAX Pakistan",
  description: "Comprehensive tax, NTN, IRIS profile, GST, and corporate legal services for individuals and businesses across Pakistan.",
};

export default async function ServicesPage() {
  const [categories, services, settings] = await Promise.all([
    db.all('SELECT * FROM service_categories'),
    db.all('SELECT * FROM services ORDER BY display_order ASC, id ASC'),
    db.all('SELECT * FROM settings'),
  ]);
  
  // Extract WhatsApp number from settings
  const whatsappSetting = settings.find(s => s.key === 'contact_phone')?.value || '923001234567';
  const cleanNumber = whatsappSetting.replace(/[^0-9]/g, '');

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = verifyToken(token);

  return (
    <main className="min-h-screen bg-white text-text-primary overflow-x-hidden pt-4">
      <Header logoUrl={siteLogo} initialUser={user} settings={settings} />
      <ServicesList categories={categories} services={services} whatsappNumber={cleanNumber} user={user} />
      <Footer settings={settings} />
    </main>
  );
}
