import { useCallback, useState } from 'react'

export function useEditingRow() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const startEditing = useCallback((id: number) => setEditingId(id), [])
  const stopEditing = useCallback(() => setEditingId(null), [])
  return { editingId, startEditing, stopEditing }
}
