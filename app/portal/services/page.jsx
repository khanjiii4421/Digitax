import db from "@/lib/db";
import ServicesList from "../../services/ServicesList";

export const dynamic = 'force-dynamic';

export default async function PortalServicesPage() {
  const categories = await db.all('SELECT * FROM service_categories');
  const services = await db.all('SELECT * FROM services');
  const settings = await db.all('SELECT * FROM settings');
  const whatsappSetting = settings.find(s => s.key === 'contact_phone')?.value || '923001234567';
  const cleanNumber = whatsappSetting.replace(/[^0-9]/g, '');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Our Services</h1>
        <p className="text-text-secondary mt-1">Select a package to start filing or registration.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <ServicesList categories={categories} services={services} whatsappNumber={cleanNumber} />
      </div>
    </div>
  );
}
