import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import api from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface PrayerSubscribeButtonProps {
  mosqueId: string
  className?: string
}

export function PrayerSubscribeButton({ mosqueId, className }: PrayerSubscribeButtonProps) {
  const queryClient = useQueryClient()
  const [isHovered, setIsHovered] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    retry: false
  })

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['prayer-subscription', mosqueId],
    queryFn: () => api.get(`/mosques/${mosqueId}/subscribe-prayer`).then(r => r.data),
    enabled: !!user && !!mosqueId
  })

  const subscribeMutation = useMutation({
    mutationFn: () => api.post(`/mosques/${mosqueId}/subscribe-prayer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-subscription', mosqueId] })
    }
  })

  if (!user) return null

  const isSubscribed = subscription?.is_subscribed

  return (
    <Button
      variant={isSubscribed ? "outline" : "primary"}
      size="sm"
      className={cn(
        "gap-2 transition-all min-w-[140px]",
        isSubscribed && isHovered && "border-danger-200 text-danger-600 hover:bg-danger-50",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        subscribeMutation.mutate()
      }}
      disabled={isLoading || subscribeMutation.isPending}
    >
      {subscribeMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        isHovered ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4 text-primary-600" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {isSubscribed ? (isHovered ? "Unsubscribe" : "Subscribed") : "Subscribe to Prayers"}
    </Button>
  )
}
