import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServicesList from "./ServicesList";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const categories = await db.all('SELECT * FROM service_categories');
  const services = await db.all('SELECT * FROM services');
  const settings = await db.all('SELECT * FROM settings');
  
  // Extract WhatsApp number from settings
  const whatsappSetting = settings.find(s => s.key === 'contact_phone')?.value || '923001234567';
  const cleanNumber = whatsappSetting.replace(/[^0-9]/g, '');

  const siteLogo = settings.find(s => s.key === 'site_logo')?.value;

  return (
    <main className="min-h-screen bg-white text-text-primary overflow-x-hidden pt-4">
      <Header logoUrl={siteLogo} />
      <ServicesList categories={categories} services={services} whatsappNumber={cleanNumber} />
      <Footer settings={settings} />
    </main>
  );
}
