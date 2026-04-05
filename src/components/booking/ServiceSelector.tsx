
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../ui/Base';
import { Scissors, Clock, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

export function ServiceSelector({ onSelect, selectedId }: { onSelect: (s: Service) => void, selectedId?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error } = await supabase.from('services').select('*').eq('is_active', true);
        if (!error && data && data.length > 0) {
          setServices(data);
        } else {
          // Mock data for demo purposes if DB is empty
          setServices([
            { id: '00000000-0000-0000-0000-000000000001', name: 'Corte Clásico', description: 'Corte tradicional a tijera o máquina con acabado premium.', duration_minutes: 30, price: 15000 },
            { id: '00000000-0000-0000-0000-000000000002', name: 'Perfilado de Barba', description: 'Diseño y recorte de barba con toalla caliente.', duration_minutes: 20, price: 10000 },
            { id: '00000000-0000-0000-0000-000000000003', name: 'Corte + Barba', description: 'Servicio completo para un look impecable.', duration_minutes: 50, price: 22000 },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-24 bg-brand-100 rounded-3xl" />)}
  </div>;

  return (
    <div className="grid gap-4">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service)}
          className={`text-left transition-all p-5 rounded-3xl border-2 ${
            selectedId === service.id 
              ? 'border-brand-900 bg-brand-900 text-white shadow-lg scale-[1.02]' 
              : 'border-brand-100 bg-white hover:border-brand-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
              <p className={`text-sm mb-3 ${selectedId === service.id ? 'text-brand-200' : 'text-brand-500'}`}>
                {service.description}
              </p>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {service.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Scissors className="w-4 h-4" /> {formatCurrency(service.price)}
                </span>
              </div>
            </div>
            {selectedId === service.id && <Check className="w-6 h-6" />}
          </div>
        </button>
      ))}
    </div>
  );
}
