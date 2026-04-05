
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Check } from 'lucide-react';

export interface Barber {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

export function BarberSelector({ onSelect, selectedId }: { onSelect: (b: Barber) => void, selectedId?: string }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarbers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('role', 'barber');
        
        if (!error && data && data.length > 0) {
          setBarbers(data as any);
        } else {
          // Mock data for demo
          setBarbers([
            { id: '11111111-1111-1111-1111-111111111111', full_name: 'Carlos ' + 'M.', avatar_url: 'https://picsum.photos/seed/barber1/200/200', bio: 'Experto en degradados' },
            { id: '22222222-2222-2222-2222-222222222222', full_name: 'Alex ' + 'R.', avatar_url: 'https://picsum.photos/seed/barber2/200/200', bio: 'Especialista en barbas' },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBarbers();
  }, []);

  if (loading) return <div className="flex gap-4 overflow-x-auto pb-4">
    {[1,2,3].map(i => <div key={i} className="min-w-[120px] h-32 bg-brand-100 rounded-3xl animate-pulse" />)}
  </div>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {barbers.map((barber) => (
        <button
          key={barber.id}
          onClick={() => onSelect(barber)}
          className={`flex flex-col items-center min-w-[120px] p-4 rounded-3xl border-2 transition-all ${
            selectedId === barber.id 
              ? 'border-brand-900 bg-brand-900 text-white shadow-md scale-105' 
              : 'border-brand-100 bg-white hover:border-brand-300'
          }`}
        >
          <div className="relative mb-3">
            {barber.avatar_url ? (
              <img src={barber.avatar_url} alt={barber.full_name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedId === barber.id ? 'bg-brand-800' : 'bg-brand-100'}`}>
                <User className="w-8 h-8" />
              </div>
            )}
            {selectedId === barber.id && (
              <div className="absolute -top-2 -right-2 bg-white text-brand-900 rounded-full p-1 shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-center leading-tight">{barber.full_name}</span>
        </button>
      ))}
    </div>
  );
}
