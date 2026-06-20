"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function ServicesList({ categories, services, whatsappNumber }) {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const openRequestForm = (service) => {
    setSelectedService(service);
    setFormData({ ...formData, message: `I am interested in ${service.title}. Please contact me.` });
    setShowModal(true);
    setSuccess(false);
  };

  const submitQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, subject: `Request for ${selectedService.title}` })
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        showToast("Failed to submit request.", "error");
      }
    } catch (error) {
      showToast("Error submitting request.", "error");
    }
    setLoading(false);
  };

  const handleWhatsApp = (service) => {
    const text = encodeURIComponent(`Hi, I need assistance with ${service.title}.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-[1400px] w-[90%] md:w-[75%] py-20 min-h-screen">
      
      <div className="mb-20">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight text-text-primary">Our Business Services</h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-4xl border-l-4 border-primary pl-6">
          Registering a business can be quite stressful. Worry not! Get expert assistance on how and which business structure to select and start your entrepreneurial journey with a bang!
        </p>
      </div>

      {categories.map(category => {
        const categoryServices = services.filter(s => s.category_id === category.id && s.status === 'active');
        if (categoryServices.length === 0) return null;

        return (
          <div key={category.id} className="mb-20">
            <h2 className="text-3xl font-bold font-heading mb-8 pb-4 border-b border-premium text-primary flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">{categoryServices.length}</span>
              {category.name}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {categoryServices.map(service => (
                <div key={service.id} className="bg-white rounded-[20px] p-8 border border-premium shadow-premium group hover:border-primary/50 transition-colors duration-300 flex flex-col h-full relative overflow-hidden">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      {service.icon_url ? (
                        <img src={service.icon_url} alt="" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-text-primary">{service.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{service.working_days}</span>
                          <span className="font-bold text-text-secondary">{service.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-text-secondary mb-6 flex-1">{service.description}</p>

                  {service.requirements && (
                    <div className="mb-8 bg-background-light p-6 rounded-2xl">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-text-primary mb-4">Requirements</h4>
                      <ul className="flex flex-col gap-3">
                        {service.requirements.split('\n').filter(Boolean).map((req, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                            <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                    <button 
                      onClick={() => openRequestForm(service)}
                      className="bg-primary text-white font-medium py-3.5 rounded-xl hover-scale shadow-sm hover:shadow-primary/30 transition-all text-center"
                    >
                      Request For Call
                    </button>
                    <button 
                      onClick={() => handleWhatsApp(service)}
                      className="bg-[#25D366] text-white font-medium py-3.5 rounded-xl hover-scale shadow-sm transition-all text-center flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Query Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 anim-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-text-secondary hover:text-primary text-2xl leading-none">&times;</button>
            
            {success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-3xl font-bold mb-2">Request Sent!</h3>
                <p className="text-text-secondary">Our representative will call you shortly regarding {selectedService.title}.</p>
                <button onClick={() => setShowModal(false)} className="mt-8 bg-primary text-white px-8 py-3 rounded-xl font-medium">Close</button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Request A Call</h2>
                <p className="text-text-secondary text-sm mb-6 pb-6 border-b border-premium">
                  For: <span className="font-bold text-primary">{selectedService.title}</span>
                </p>

                <form onSubmit={submitQuery} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Your Name" required className="bg-background-light border border-premium rounded-xl px-4 py-3 w-full focus:outline-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input type="tel" placeholder="Phone Number" required className="bg-background-light border border-premium rounded-xl px-4 py-3 w-full focus:outline-primary" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <input type="email" placeholder="Email Address" required className="bg-background-light border border-premium rounded-xl px-4 py-3 w-full focus:outline-primary" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <textarea placeholder="Message" required rows={4} className="bg-background-light border border-premium rounded-xl px-4 py-3 w-full focus:outline-primary resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                  
                  <button type="submit" disabled={loading} className="bg-primary text-white font-bold text-lg py-4 rounded-xl mt-4 hover-scale disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
