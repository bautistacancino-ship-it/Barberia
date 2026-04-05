
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button } from '../ui/Base';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  Search,
  ChevronRight
} from 'lucide-react';
import { format, startOfToday, endOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '../../lib/utils';

type Tab = 'bookings' | 'services' | 'users';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', duration_minutes: 30, price: 0 });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'bookings') {
        const todayStart = startOfToday().toISOString();
        const todayEnd = endOfToday().toISOString();

        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            client:profiles!client_id(full_name),
            barber:profiles!barber_id(full_name),
            services:service_id(name, price)
          `)
          .order('start_time', { ascending: true });

        if (fetchError) throw fetchError;
        if (data) {
          setBookings(data);
          const todayBookings = data.filter(b => b.start_time >= todayStart && b.start_time <= todayEnd);
          const revenue = todayBookings.reduce((acc, b) => acc + (b.status === 'completed' ? b.services.price : 0), 0);
          const pending = todayBookings.filter(b => b.status === 'pending').length;
          setStats({ total: todayBookings.length, revenue, pending });
        }
      } else if (activeTab === 'services') {
        const { data, error: fetchError } = await supabase.from('services').select('*').order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        if (data) setServices(data);
      } else if (activeTab === 'users') {
        const { data, error: fetchError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        if (data) setProfiles(data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error al cargar los datos. Verifica tu conexión y permisos.');
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(id: string, status: string) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    }
  }

  async function handleServiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingService) {
      const { error } = await supabase.from('services').update(serviceForm).eq('id', editingService.id);
      if (!error) {
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...serviceForm } : s));
        setEditingService(null);
        setShowServiceForm(false);
      }
    } else {
      const { data, error } = await supabase.from('services').insert(serviceForm).select().single();
      if (!error && data) {
        setServices([data, ...services]);
        setShowServiceForm(false);
      }
    }
    setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0 });
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) {
      setServices(services.filter(s => s.id !== id));
      setDeletingId(null);
    }
  }

  async function updateUserRole(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, role } : p));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl mb-2 font-display font-bold">Panel de Control</h1>
          <p className="text-brand-500">Gestiona citas, servicios y usuarios de tu barbería.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <Clock className="w-4 h-4" /> Refrescar
          </Button>
          <div className="flex bg-white p-1 rounded-2xl border border-brand-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all", activeTab === 'bookings' ? "bg-brand-900 text-white shadow-md" : "text-brand-500 hover:bg-brand-50")}
            >
              Citas
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all", activeTab === 'services' ? "bg-brand-900 text-white shadow-md" : "text-brand-500 hover:bg-brand-50")}
            >
              Servicios
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all", activeTab === 'users' ? "bg-brand-900 text-white shadow-md" : "text-brand-500 hover:bg-brand-50")}
            >
              Usuarios
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-red-700 border-red-200 hover:bg-red-100">
            Reintentar
          </Button>
        </div>
      )}

      {activeTab === 'bookings' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-brand-500 font-medium">Citas Hoy</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-brand-500 font-medium">Ingresos Hoy</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-brand-500 font-medium">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="p-6 border-b border-brand-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Próximas Citas</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar cita..." 
                    className="pl-9 pr-4 py-2 bg-brand-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-900 w-48 md:w-64"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-50 text-brand-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Servicio</th>
                    <th className="px-6 py-4 font-semibold">Barbero</th>
                    <th className="px-6 py-4 font-semibold">Hora</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-brand-400">Cargando citas...</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-brand-400">No hay citas registradas</td></tr>
                  ) : bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-brand-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{booking.client?.full_name || 'Cliente'}</td>
                      <td className="px-6 py-4 text-brand-600">{booking.services?.name || 'Servicio'}</td>
                      <td className="px-6 py-4">{booking.barber?.full_name || 'Barbero'}</td>
                      <td className="px-6 py-4 font-mono text-sm">{format(new Date(booking.start_time), 'HH:mm')}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                          booking.status === 'completed' ? "bg-green-100 text-green-700" :
                          booking.status === 'cancelled' ? "bg-red-100 text-red-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          {booking.status === 'completed' ? 'Completado' :
                           booking.status === 'cancelled' ? 'Cancelado' :
                           'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                                title="Completar"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Cancelar"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
            <Button onClick={() => {
              setEditingService(null);
              setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0 });
              setShowServiceForm(true);
            }} className="gap-2">
              <Plus className="w-4 h-4" /> Nuevo Servicio
            </Button>
          </div>

          {showServiceForm && (
            <Card className="p-6 border-2 border-brand-900 shadow-xl">
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre del Servicio</label>
                    <input 
                      required
                      type="text" 
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                      className="w-full p-3 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-900"
                      placeholder="Ej: Corte Degradado"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio ($)</label>
                    <input 
                      required
                      type="number" 
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({...serviceForm, price: Number(e.target.value)})}
                      className="w-full p-3 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-900"
                      placeholder="Ej: 15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duración (minutos)</label>
                    <input 
                      required
                      type="number" 
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({...serviceForm, duration_minutes: Number(e.target.value)})}
                      className="w-full p-3 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-900"
                      placeholder="Ej: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <input 
                      type="text" 
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="w-full p-3 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-900"
                      placeholder="Breve descripción del servicio"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowServiceForm(false)}>Cancelar</Button>
                  <Button type="submit">{editingService ? 'Guardar Cambios' : 'Crear Servicio'}</Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12 text-brand-400">Cargando servicios...</div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-center py-12 text-brand-400">No hay servicios configurados</div>
            ) : services.map((service) => (
              <Card key={service.id} className="p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <p className="text-brand-500 text-sm line-clamp-2">{service.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingService(service);
                        setServiceForm({
                          name: service.name,
                          description: service.description || '',
                          duration_minutes: service.duration_minutes,
                          price: service.price
                        });
                        setShowServiceForm(true);
                      }}
                      className="p-2 text-brand-400 hover:text-brand-900 hover:bg-brand-50 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {deletingId === service.id ? (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => deleteService(service.id)}
                          className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
                          title="Confirmar eliminar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="p-2 text-brand-400 hover:text-brand-900 hover:bg-brand-50 rounded-xl transition-all"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(service.id)}
                        className="p-2 text-brand-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-brand-50">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-brand-400" /> {service.duration_minutes} min
                  </div>
                  <div className="text-lg font-bold text-brand-900">
                    {formatCurrency(service.price)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                className="pl-9 pr-4 py-2 bg-white border border-brand-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-900 w-64"
              />
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-50 text-brand-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Teléfono</th>
                    <th className="px-6 py-4 font-semibold">Rol Actual</th>
                    <th className="px-6 py-4 font-semibold text-right">Cambiar Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-brand-400">Cargando usuarios...</td></tr>
                  ) : profiles.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-brand-400">No hay usuarios registrados</td></tr>
                  ) : profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-brand-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-900 font-bold">
                            {profile.full_name?.charAt(0) || <Users className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{profile.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-brand-400">{profile.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-brand-500">{profile.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                          profile.role === 'admin' ? "bg-purple-100 text-purple-700" :
                          profile.role === 'barber' ? "bg-blue-100 text-blue-700" :
                          "bg-brand-100 text-brand-700"
                        )}>
                          {profile.role === 'admin' ? 'Administrador' :
                           profile.role === 'barber' ? 'Barbero' :
                           'Cliente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <select 
                            value={profile.role}
                            onChange={(e) => updateUserRole(profile.id, e.target.value)}
                            className="text-xs p-2 bg-brand-50 border-none rounded-xl focus:ring-2 focus:ring-brand-900"
                          >
                            <option value="client">Cliente</option>
                            <option value="barber">Barbero</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
