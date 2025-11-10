import React, { useMemo, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PinDetailModal } from '@/components/pin-detail-modal'
import type { DeletePhotoResult, Pin, PinPhoto } from '@/lib/types'

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, fill: _fill, ...props }: { alt?: string; fill?: boolean } & React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt ?? ''} {...props} />
  ),
}))

;(globalThis as { React?: typeof React }).React ??= React

function makePhoto(index: number, overrides: Partial<PinPhoto> = {}): PinPhoto {
  return {
    photoId: `photo-${index}`,
    localUri: `data:image/jpeg;base64,PHOTO${index}`,
    width: 640,
    height: 480,
    sizeBytes: 12345,
    status: 'pending',
    ...overrides,
  }
}

function makePin(photoCount: number): Pin {
  const photos: PinPhoto[] = Array.from({ length: photoCount }, (_, idx) => makePhoto(idx + 1))
  return {
    pinId: 'pin-1',
    xPct: 10,
    yPct: 20,
    title: 'Main Panel',
    note: 'Check wiring.',
    photos,
    syncStatus: 'pending',
  }
}

type RenderOptions = {
  deleteResult?: DeletePhotoResult
}

function renderPinModal({ deleteResult }: RenderOptions = {}) {
  const onOpenChange = vi.fn()

  function Wrapper() {
    const [pin, setPin] = useState<Pin>(() => makePin(4))
    const handleDeletePhoto = useMemo(
      () =>
        async (photoId: string): Promise<DeletePhotoResult> => {
          const result: DeletePhotoResult =
            deleteResult ??
            ({
              deleted: true,
              driveDeleted: true,
              drivePending: false,
            } satisfies DeletePhotoResult)

          if (result.deleted) {
            setPin((prev) => ({
              ...prev,
              photos: prev.photos.filter((photo) => photo.photoId !== photoId),
            }))
          }

          return result
        },
      [deleteResult],
    )

    return (
      <PinDetailModal
        pin={pin}
        open
        onOpenChange={onOpenChange}
        onDeletePhoto={handleDeletePhoto}
      />
    )
  }

  return {
    user: userEvent.setup(),
    onOpenChange,
    ...render(<Wrapper />),
  }
}

describe('<PinDetailModal />', () => {
  it('reopens the attach control and updates the photo counter after deletion', async () => {
    const { user } = renderPinModal()

    expect(screen.getByText(/Photos \(4\/4\)/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Attach Photos/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Delete photo 1/i }))
    await user.click(screen.getByRole('button', { name: /Delete photo/i }))

    expect(await screen.findByText(/Photos \(3\/4\)/)).toBeInTheDocument()
    const attachButton = screen.getByRole('button', { name: /Attach Photos/i })
    expect(attachButton).toBeEnabled()
  })

  it('surfaces a warning message when Drive removal is deferred', async () => {
    const { user } = renderPinModal({
      deleteResult: {
        deleted: true,
        driveDeleted: false,
        drivePending: true,
        driveError: undefined,
      },
    })

    await user.click(screen.getByRole('button', { name: /Delete photo 1/i }))
    await user.click(screen.getByRole('button', { name: /Delete photo/i }))

    expect(
      await screen.findByText(/Drive removal will retry on the next sync while online/i),
    ).toBeInTheDocument()
  })
})
