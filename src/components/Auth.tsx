
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Button, Card } from './ui/Base';
import { LogIn, UserPlus, Mail, Lock, Loader2, User as UserIcon, Scissors } from 'lucide-react';

export function Auth({ onAuth }: { onAuth: (user: SupabaseUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error parameters in the URL (from Supabase redirects)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        setError(errorDescription.replace(/\+/g, ' '));
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        
        // Create profile
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: 'client'
          });
          onAuth(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full px-4 py-12">
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-900 text-white rounded-[1.5rem] flex items-center justify-center mx-auto shadow-lg rotate-3 mb-6">
            <Scissors className="w-10 h-10" />
          </div>
          <h1 className="text-3xl mb-2">{isLogin ? 'Bienvenido' : 'Crea tu cuenta'}</h1>
          <p className="text-brand-500">
            {isLogin ? 'Ingresa para gestionar tus citas' : 'Únete a la mejor experiencia de barbería'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-brand-700 ml-1">Nombre Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-2xl focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none transition-all"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-700 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-2xl focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-brand-700 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-2xl focus:ring-2 focus:ring-brand-900 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-brand-600 hover:text-brand-900 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </Card>
    </div>
  );
}
