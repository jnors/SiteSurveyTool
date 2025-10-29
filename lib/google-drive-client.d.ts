export type EnsureFoldersResponse = {
  rootId: string
  projectFolderId: string
  created?: { root?: boolean; project?: boolean }
  movedOrMissing?: boolean
  anomaly?: 'moved' | 'missing'
}
export type ValidateFolderResponse = { folderId: string }
