import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ProjectCreateDialog } from '@/components/project-create-dialog'

;(globalThis as { React?: typeof React }).React ??= React

function renderDialog(overrides: Partial<React.ComponentProps<typeof ProjectCreateDialog>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onOpenChange = vi.fn()

  function Wrapper() {
    const [projectName, setProjectName] = useState(overrides.projectName ?? '')
    const [floorplanFile, setFloorplanFile] = useState<File | null>(
      (overrides.floorplanFile as File | null) ?? null,
    )

    return (
      <ProjectCreateDialog
        open
        onOpenChange={onOpenChange}
        projectName={projectName}
        onProjectNameChange={(value) => {
          setProjectName(value)
          overrides.onProjectNameChange?.(value)
        }}
        floorplanFile={floorplanFile}
        onFloorplanChange={(file) => {
          setFloorplanFile(file)
          overrides.onFloorplanChange?.(file)
        }}
        onSubmit={async () => {
          await onSubmit()
          if (typeof overrides.onSubmit === 'function') {
            await overrides.onSubmit()
          }
        }}
        isSaving={overrides.isSaving ?? false}
        errorMessage={overrides.errorMessage}
      />
    )
  }

  return {
    user: userEvent.setup(),
    onSubmit,
    onOpenChange,
    ...render(<Wrapper />),
  }
}

describe('<ProjectCreateDialog />', () => {
  it('keeps Save disabled until name and floorplan are provided', async () => {
    const { user, onSubmit } = renderDialog()

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()

    // Attempting to save while disabled should not fire submit
    await user.click(saveButton)
    expect(onSubmit).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/project name/i), 'New Facility')
    expect(saveButton).toBeDisabled()

    const fileInput = screen.getByLabelText(/floorplan image/i) as HTMLInputElement
    const imageFile = new File(['dummy'], 'facility.png', { type: 'image/png' })
    await user.upload(fileInput, imageFile)

    expect(saveButton).toBeEnabled()

    await user.click(saveButton)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('respects isSaving to block additional submissions', async () => {
    const onSubmit = vi.fn()
    const imageFile = new File(['dummy'], 'facility.png', { type: 'image/png' })

    render(
      <ProjectCreateDialog
        open
        onOpenChange={vi.fn()}
        projectName="Warehouse B"
        onProjectNameChange={vi.fn()}
        floorplanFile={imageFile}
        onFloorplanChange={vi.fn()}
        onSubmit={onSubmit}
        isSaving
      />,
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()

    const user = userEvent.setup()
    await user.click(saveButton)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
