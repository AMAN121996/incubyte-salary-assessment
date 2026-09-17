import { useDebouncedCallback } from '@mantine/hooks'
import { useState } from 'react'

export const SEARCH_DEBOUNCE_MS = 300

/**
 * Search box state that stays in sync with the query in the URL.
 *
 * The box updates on every keystroke; the search runs once typing pauses.
 * When the URL's query changes, the box follows it, unless the change is the
 * box's own search arriving. Following that one would overwrite anything typed
 * since the search was sent (e.g. "priy" reset to "pri").
 */
export function useSearchInput(query: string | undefined, onSearch: (q: string) => void) {
  const [value, setValue] = useState(query ?? '')
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [syncedQuery, setSyncedQuery] = useState(query)

  const debouncedSearch = useDebouncedCallback((q: string) => {
    setLastSent(q)
    onSearch(q)
  }, SEARCH_DEBOUNCE_MS)

  // Adjust state during render when the URL changes (no extra effect pass).
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if ((query ?? '') !== lastSent) setValue(query ?? '')
    setLastSent(null)
  }

  return {
    value,
    onChange: (next: string) => {
      setValue(next)
      debouncedSearch(next)
    },
    clear: () => {
      debouncedSearch.cancel()
      setValue('')
    },
  }
}
