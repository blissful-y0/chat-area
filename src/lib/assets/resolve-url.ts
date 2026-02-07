export function resolveAvatarUrl(assetId: string | null): string | null {
  if (!assetId) return null
  return `/api/assets/${assetId}`
}
