
import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isSameDay, addMinutes, setHours, setMinutes, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export function TimePicker({ 
  barberId, 
  duration, 
  onSelect, 
  selectedTime 
}: { 
  barberId: string, 
  duration: number, 
  onSelect: (d: Date) => void, 
  selectedTime?: Date 
}) {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{start: Date, end: Date}[]>([]);

  // Generate days for the next week
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfDay(new Date()), i));

  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .gte('start_time', selectedDate.toISOString())
        .lt('start_time', addDays(selectedDate, 1).toISOString())
        .neq('status', 'cancelled');

      if (!error && data) {
        setBookedSlots(data.map(b => ({
          start: new Date(b.start_time),
          end: new Date(b.end_time)
        })));
      }
    }
    fetchBookings();
  }, [selectedDate, barberId]);

  useEffect(() => {
    const slots: Date[] = [];
    let current = setHours(setMinutes(selectedDate, 0), 9); // Start at 9:00 AM
    const end = setHours(setMinutes(selectedDate, 0), 20); // End at 8:00 PM

    while (current < end) {
      const slotEnd = addMinutes(current, duration);
      
      // Check if slot is in the past
      const isPast = !isAfter(current, new Date());
      
      // Check if slot overlaps with any booking
      const isBooked = bookedSlots.some(b => 
        (current >= b.start && current < b.end) || 
        (slotEnd > b.start && slotEnd <= b.end)
      );

      if (!isPast && !isBooked) {
        slots.push(new Date(current));
      }
      current = addMinutes(current, 30); // 30 min intervals
    }
    setAvailableSlots(slots);
  }, [selectedDate, bookedSlots, duration]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={cn(
              "flex flex-col items-center min-w-[70px] py-3 rounded-2xl border-2 transition-all",
              isSameDay(selectedDate, day)
                ? "border-brand-900 bg-brand-900 text-white shadow-md"
                : "border-brand-100 bg-white hover:border-brand-200"
            )}
          >
            <span className="text-[10px] uppercase font-bold opacity-60 mb-1">
              {format(day, 'EEE', { locale: es })}
            </span>
            <span className="text-lg font-bold">
              {format(day, 'd')}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {availableSlots.length > 0 ? (
          availableSlots.map((slot) => (
            <button
              key={slot.toISOString()}
              onClick={() => onSelect(slot)}
              className={cn(
                "py-3 rounded-2xl border-2 text-sm font-medium transition-all",
                selectedTime?.toISOString() === slot.toISOString()
                  ? "border-brand-900 bg-brand-900 text-white shadow-md"
                  : "border-brand-100 bg-white hover:border-brand-200"
              )}
            >
              {format(slot, 'HH:mm')}
            </button>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-brand-400 bg-brand-100/50 rounded-3xl border-2 border-dashed border-brand-200">
            No hay horarios disponibles para este día
          </div>
        )}
      </div>
    </div>
  );
}
