import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCircle2, Circle } from 'lucide-react';
import api from '@/lib/api-client';
import BottomSheet from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui';

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsSheet({ isOpen, onClose }: NotificationsSheetProps) {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    enabled: isOpen,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications?.items?.filter((n: any) => !n.is_read).length || 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}>
      <div className="flex flex-col h-full">
        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="text-primary-600 font-semibold"
            >
              <Check className="w-4 h-4 mr-1" /> Mark all as read
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {isLoading ? (
            <div className="text-center py-4 text-surface-400">Loading notifications...</div>
          ) : notifications?.items?.length > 0 ? (
            notifications.items.map((notif: any) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl border transition-colors ${notif.is_read ? 'bg-white border-surface-100 opacity-70' : 'bg-primary-50 border-primary-100'}`}
                onClick={() => !notif.is_read && markAsRead.mutate(notif.id)}
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {notif.is_read ? (
                      <CheckCircle2 className="w-5 h-5 text-surface-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-primary-500 fill-primary-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm ${notif.is_read ? 'text-surface-700' : 'text-surface-900'}`}>{notif.title}</h4>
                    <p className={`text-sm mt-1 leading-relaxed ${notif.is_read ? 'text-surface-500' : 'text-surface-700'}`}>{notif.message}</p>
                    <span className="text-xs text-surface-400 mt-2 block">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-surface-500">
              <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="font-bold text-surface-900 mb-1">All caught up!</h3>
              <p className="text-sm">You have no new notifications.</p>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
