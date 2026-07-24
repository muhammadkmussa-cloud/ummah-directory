import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, MapPin, Clock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Input } from '@/components/ui';

export default function PrayerTimesPreferences() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    calculation_method: 'MWL',
    juristic_method: 'Standard',
    latitude: 0,
    longitude: 0,
    notify_fajr: true,
    notify_dhuhr: true,
    notify_asr: true,
    notify_maghrib: true,
    notify_isha: true,
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['prayer-times', 'me'],
    queryFn: () => api.get('/prayer-times/me').then(r => r.data),
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        calculation_method: preferences.calculation_method || 'MWL',
        juristic_method: preferences.juristic_method || 'Standard',
        latitude: preferences.latitude || 0,
        longitude: preferences.longitude || 0,
        notify_fajr: preferences.notify_fajr ?? true,
        notify_dhuhr: preferences.notify_dhuhr ?? true,
        notify_asr: preferences.notify_asr ?? true,
        notify_maghrib: preferences.notify_maghrib ?? true,
        notify_isha: preferences.notify_isha ?? true,
      });
    }
  }, [preferences]);

  const updatePreferences = useMutation({
    mutationFn: (data: typeof formData) => api.put('/prayer-times/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-times', 'me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences.mutate(formData);
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Error detecting location", error);
        }
      );
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary-600" />
          Prayer Times Settings
        </h1>
        <p className="text-surface-500 mt-1">Configure your location and calculation methods.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Location Section */}
          <section>
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2 mb-4 border-b border-surface-100 pb-2">
              <MapPin className="w-5 h-5 text-surface-400" /> Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4"
              onClick={handleLocationDetect}
            >
              Detect My Location
            </Button>
          </section>

          {/* Calculation Section */}
          <section>
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2 mb-4 border-b border-surface-100 pb-2">
              <Clock className="w-5 h-5 text-surface-400" /> Calculation Methods
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Calculation Method</label>
                <select
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  value={formData.calculation_method}
                  onChange={(e) => setFormData({...formData, calculation_method: e.target.value})}
                >
                  <option value="MWL">Muslim World League (MWL)</option>
                  <option value="ISNA">Islamic Society of North America (ISNA)</option>
                  <option value="Egypt">Egyptian General Authority of Survey</option>
                  <option value="Makkah">Umm Al-Qura University, Makkah</option>
                  <option value="Karachi">University of Islamic Sciences, Karachi</option>
                  <option value="Tehran">Institute of Geophysics, University of Tehran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Juristic Method (Asr)</label>
                <select
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  value={formData.juristic_method}
                  onChange={(e) => setFormData({...formData, juristic_method: e.target.value})}
                >
                  <option value="Standard">Standard (Shafi, Hanbali, Maliki)</option>
                  <option value="Hanafi">Hanafi</option>
                </select>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2 mb-4 border-b border-surface-100 pb-2">
              <Bell className="w-5 h-5 text-surface-400" /> Notifications
            </h2>
            <div className="space-y-3">
              {[
                { key: 'notify_fajr', label: 'Fajr' },
                { key: 'notify_dhuhr', label: 'Dhuhr' },
                { key: 'notify_asr', label: 'Asr' },
                { key: 'notify_maghrib', label: 'Maghrib' },
                { key: 'notify_isha', label: 'Isha' },
              ].map(prayer => (
                <label key={prayer.key} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-surface-300"
                    checked={(formData as any)[prayer.key]}
                    onChange={(e) => setFormData({...formData, [prayer.key]: e.target.checked})}
                  />
                  <span className="font-medium text-surface-900">{prayer.label} Notification</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between pt-4 border-t border-surface-200">
            {updatePreferences.isSuccess ? (
              <span className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Saved successfully
              </span>
            ) : (
              <span />
            )}
            <Button 
              type="submit" 
              disabled={updatePreferences.isPending}
              className="flex items-center gap-2"
            >
              {updatePreferences.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
