import JSZip from "jszip"
import type { CharacterCardV3 } from "./types"

const CARD_JSON_PATH = "card.json"
const ASSETS_DIR = "assets/"

export interface CharXContent {
  card: CharacterCardV3
  assets: Map<string, Buffer>
}

export async function readCharX(buffer: Buffer): Promise<CharXContent> {
  const zip = await JSZip.loadAsync(buffer)

  const cardFile = zip.file(CARD_JSON_PATH)
  if (!cardFile) {
    throw new Error("Invalid CharX: card.json not found")
  }

  const cardJson = await cardFile.async("string")
  const card = JSON.parse(cardJson) as CharacterCardV3

  const assets = new Map<string, Buffer>()

  const assetFiles = zip.file(new RegExp(`^${ASSETS_DIR}`))
  for (const file of assetFiles) {
    if (file.dir) continue
    const data = await file.async("nodebuffer")
    const relativePath = file.name.slice(ASSETS_DIR.length)
    assets.set(relativePath, data)
  }

  return { card, assets }
}

export async function writeCharX(
  card: CharacterCardV3,
  assets: Map<string, Buffer>
): Promise<Buffer> {
  const zip = new JSZip()

  zip.file(CARD_JSON_PATH, JSON.stringify(card, null, 2))

  for (const [path, data] of assets) {
    zip.file(`${ASSETS_DIR}${path}`, data)
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  return buffer
}
