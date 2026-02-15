import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/api'

export const useServerStore = create(
  persist(
    (set, get) => ({
      currentServer: null,
      servers: [],
      serverMetrics: {}, // Cache for server dashboard data
      setServers: (servers) => set({ servers }),
      setCurrentServer: (server) => set({ currentServer: server }),
      setServerMetrics: (serverId, data) => set((state) => ({
        serverMetrics: { ...state.serverMetrics, [serverId]: data }
      })),
      fetchServers: async () => {
        try {
          const res = await api.get('/api/servers')
          set({ servers: res.data })
          // If current server is not in the new list, clear it
          const { currentServer } = get()
          if (currentServer && !res.data.find(s => s.id === currentServer.id)) {
            set({ currentServer: null })
          }
        } catch (error) {
          console.error("Failed to fetch servers", error)
        }
      }
    }),
    {
      name: 'server-storage', // name of the item in the storage (must be unique)
    }
  )
)
