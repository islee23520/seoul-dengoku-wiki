import { useCallback, useEffect, useRef } from 'react'
import { createMapBridge, type MapCatalog, type MapSelection, type MapTransport } from './mapBridge'

// Mount only with a real wiki map player transport. The existing SVG map remains the renderer.
export function useMapBridge(catalog: MapCatalog, transport: MapTransport | null, onSelected: (selection: MapSelection | null) => void) {
  const bridgeRef = useRef<ReturnType<typeof createMapBridge> | null>(null)
  useEffect(() => {
    if (!transport) return
    const bridge = createMapBridge(catalog, transport, onSelected)
    bridgeRef.current = bridge
    return () => {
      bridgeRef.current = null
      bridge.dispose()
    }
  }, [catalog, transport, onSelected])
  return useCallback((selection: MapSelection | null) => bridgeRef.current?.select(selection), [])
}
