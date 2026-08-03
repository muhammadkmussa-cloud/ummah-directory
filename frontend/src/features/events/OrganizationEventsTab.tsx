import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Calendar, Edit2, X } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input } from '@/components/ui';

interface Props {
  organizationId: string;
  organizationType: string;
}

export default function OrganizationEventsTab({ organizationId, organizationType }: Props) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', organizationType, organizationId],
    queryFn: () => api.get(`/events?organizer_id=${organizationId}&organizer_type=${organizationType}`).then(r => r.data.items || []),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/events`, { ...data, organizer_id: organizationId, organizer_type: organizationType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', organizationType, organizationId] });
      setShowCreate(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', organizationType, organizationId] });
      setEditingEventId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', organizationType, organizationId] });
    },
  });

  const onSubmit = (data: any) => {
    // Convert local datetime back to UTC ISO string if provided
    if (data.event_date) {
      data.event_date = new Date(data.event_date).toISOString();
    }
    
    if (editingEventId) {
      updateMutation.mutate({ id: editingEventId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (event: any) => {
    // Format date for datetime-local input
    const formattedDate = event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '';
    reset({ ...event, event_date: formattedDate });
    setShowCreate(true);
    setEditingEventId(event.id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10 text-surface-500">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-surface-900">Events</h2>
        {!showCreate && (
          <Button onClick={() => { reset({}); setEditingEventId(null); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{editingEventId ? 'Edit Event' : 'Create New Event'}</h3>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Event Title" {...register('title', { required: true })} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field min-h-[100px] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Event Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('event_date', { required: true })}
                  className="input-field"
                />
              </div>
              <Input label="Event Category" {...register('category')} />
            </div>
            <Input label="Venue / Location" {...register('venue')} />
            <Input label="Registration Link (Optional)" type="url" {...register('registration_link')} />
            
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {editingEventId ? 'Save Changes' : 'Publish Event'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-10 text-surface-500 bg-surface-50 rounded-xl border border-dashed border-surface-200">
            No events found. Publish your first event to reach the community!
          </div>
        ) : (
          events.map((event: any) => (
            <Card key={event.id} className="p-4 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-surface-900">{event.title}</h3>
                <div className="text-sm text-surface-500 mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 
                    {new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {event.venue && <span>• {event.venue}</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge variant={event.status === 'published' ? 'success' : 'default'}>{event.status}</Badge>
                  {event.category && <Badge variant="info">{event.category}</Badge>}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
