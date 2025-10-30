import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SyncBanner } from '@/components/sync-banner'

;(globalThis as { React?: typeof React }).React ??= React

describe('<SyncBanner />', () => {
  it('shows spinner and syncing label when status is syncing', () => {
    const { container } = render(<SyncBanner status="syncing" onSync={vi.fn()} />)

    expect(screen.getByText('Syncing')).toBeInTheDocument()
    const spinner = container.querySelector('svg.animate-spin')
    expect(spinner).not.toBeNull()
    expect(screen.getByRole('button', { name: /sync now/i })).toBeEnabled()
  })

  it('shows a disabled reason when action is blocked', () => {
    render(
      <SyncBanner
        status="pending"
        onSync={vi.fn()}
        actionDisabled
        disabledReason="Offline - sync resumes when reconnected"
      />,
    )

    const button = screen.getByRole('button', { name: /sync now/i })
    expect(button).toBeDisabled()
    expect(screen.getByText(/offline - sync resumes when reconnected/i)).toBeInTheDocument()
  })
})
