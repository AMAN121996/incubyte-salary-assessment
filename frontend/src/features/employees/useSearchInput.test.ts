import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEARCH_DEBOUNCE_MS, useSearchInput } from './useSearchInput'

function setup(initialQuery?: string) {
  const onSearch = vi.fn()
  const hook = renderHook(({ query }) => useSearchInput(query, onSearch), {
    initialProps: { query: initialQuery },
  })
  return { onSearch, ...hook }
}

describe('useSearchInput', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts from the query in the URL', () => {
    expect(setup('priya').result.current.value).toBe('priya')
  })

  it('searches once the user pauses typing', () => {
    const { result, onSearch } = setup()

    act(() => result.current.onChange('p'))
    act(() => result.current.onChange('pr'))
    expect(onSearch).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('pr')
  })

  it('does not overwrite keystrokes typed while its own search is reaching the URL', () => {
    const { result, rerender } = setup()

    act(() => result.current.onChange('pri'))
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)) // search for "pri" sent
    act(() => result.current.onChange('priy')) // user keeps typing
    rerender({ query: 'pri' }) // ...then the URL catches up with the earlier search

    expect(result.current.value).toBe('priy')
  })

  it('follows the URL when the query is changed elsewhere (nav link, Back button)', () => {
    const { result, rerender } = setup('priya')

    rerender({ query: undefined })

    expect(result.current.value).toBe('')
  })

  it('cancels a pending search when cleared', () => {
    const { result, onSearch } = setup()

    act(() => result.current.onChange('pri'))
    act(() => result.current.clear())
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS))

    expect(result.current.value).toBe('')
    expect(onSearch).not.toHaveBeenCalled()
  })
})
