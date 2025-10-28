export type EnsureFoldersResponse = { rootId: string; projectFolderId: string; created?: { root?: boolean; project?: boolean }; movedOrMissing?: boolean }
export type ValidateFolderResponse = { folderId: string }
