import { PNG } from "pngjs"

const TEXT_CHUNK_TYPE = "tEXt"

interface PngTextChunk {
  keyword: string
  text: string
}

function findTextChunks(buffer: Buffer): PngTextChunk[] {
  const chunks: PngTextChunk[] = []
  let offset = 8 // Skip PNG signature

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii")

    if (type === TEXT_CHUNK_TYPE) {
      const data = buffer.subarray(offset + 8, offset + 8 + length)
      const nullIndex = data.indexOf(0)
      if (nullIndex !== -1) {
        const keyword = data.subarray(0, nullIndex).toString("ascii")
        const text = data.subarray(nullIndex + 1).toString("ascii")
        chunks.push({ keyword, text })
      }
    }

    offset += 12 + length // 4 (length) + 4 (type) + length + 4 (CRC)
  }

  return chunks
}

export function readPngTextChunk(
  buffer: Buffer,
  keyword: string
): string | null {
  const chunks = findTextChunks(buffer)
  const chunk = chunks.find((c) => c.keyword === keyword)
  return chunk?.text ?? null
}

export function readCharacterFromPng(
  buffer: Buffer
): { format: "v1" | "v2" | "v3"; data: unknown } | null {
  // Try ccv3 first (Character Card V3)
  const ccv3 = readPngTextChunk(buffer, "ccv3")
  if (ccv3) {
    try {
      const decoded = Buffer.from(ccv3, "base64").toString("utf-8")
      const parsed = JSON.parse(decoded)
      return { format: "v3", data: parsed }
    } catch {
      // fall through
    }
  }

  // Try chara (V2 or V1 base64-encoded JSON)
  const chara = readPngTextChunk(buffer, "chara")
  if (chara) {
    try {
      const decoded = Buffer.from(chara, "base64").toString("utf-8")
      const parsed = JSON.parse(decoded)
      if (parsed.spec === "chara_card_v2") {
        return { format: "v2", data: parsed }
      }
      return { format: "v1", data: parsed }
    } catch {
      // fall through
    }
  }

  return null
}

function createTextChunk(keyword: string, text: string): Buffer {
  const keywordBuf = Buffer.from(keyword, "ascii")
  const nullSep = Buffer.from([0])
  const textBuf = Buffer.from(text, "ascii")
  const data = Buffer.concat([keywordBuf, nullSep, textBuf])

  const typeCode = Buffer.from(TEXT_CHUNK_TYPE, "ascii")
  const lengthBuf = Buffer.alloc(4)
  lengthBuf.writeUInt32BE(data.length, 0)

  const crcInput = Buffer.concat([typeCode, data])
  const crc = crc32(crcInput)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc, 0)

  return Buffer.concat([lengthBuf, typeCode, data, crcBuf])
}

export function writePngTextChunk(
  pngBuffer: Buffer,
  keyword: string,
  text: string
): Buffer {
  // Find IEND chunk position
  let iendOffset = -1
  let offset = 8

  while (offset < pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(offset)
    const type = pngBuffer
      .subarray(offset + 4, offset + 8)
      .toString("ascii")

    if (type === "IEND") {
      iendOffset = offset
      break
    }

    offset += 12 + length
  }

  if (iendOffset === -1) {
    throw new Error("Invalid PNG: IEND chunk not found")
  }

  // Remove existing text chunk with same keyword
  const cleanedParts: Buffer[] = []
  let scanOffset = 0

  // PNG signature
  cleanedParts.push(pngBuffer.subarray(0, 8))
  scanOffset = 8

  while (scanOffset < pngBuffer.length) {
    const chunkLen = pngBuffer.readUInt32BE(scanOffset)
    const chunkType = pngBuffer
      .subarray(scanOffset + 4, scanOffset + 8)
      .toString("ascii")
    const chunkEnd = scanOffset + 12 + chunkLen

    if (chunkType === TEXT_CHUNK_TYPE) {
      const chunkData = pngBuffer.subarray(
        scanOffset + 8,
        scanOffset + 8 + chunkLen
      )
      const nullIdx = chunkData.indexOf(0)
      const existingKeyword = chunkData
        .subarray(0, nullIdx)
        .toString("ascii")

      if (existingKeyword === keyword) {
        scanOffset = chunkEnd
        continue
      }
    }

    if (chunkType === "IEND") {
      // Insert new text chunk before IEND
      cleanedParts.push(createTextChunk(keyword, text))
    }

    cleanedParts.push(pngBuffer.subarray(scanOffset, chunkEnd))
    scanOffset = chunkEnd
  }

  return Buffer.concat(cleanedParts)
}

export function writeCharacterToPng(
  pngBuffer: Buffer,
  characterJson: unknown,
  format: "v2" | "v3" = "v2"
): Buffer {
  const jsonStr = JSON.stringify(characterJson)
  const base64 = Buffer.from(jsonStr, "utf-8").toString("base64")

  if (format === "v3") {
    let result = writePngTextChunk(pngBuffer, "ccv3", base64)
    // Also write V2 for backwards compatibility
    result = writePngTextChunk(result, "chara", base64)
    return result
  }

  return writePngTextChunk(pngBuffer, "chara", base64)
}

export function createBlankPng(width = 400, height = 600): Buffer {
  const png = new PNG({ width, height })

  // Fill with dark gray
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2
      png.data[idx] = 39     // R
      png.data[idx + 1] = 39 // G
      png.data[idx + 2] = 42 // B
      png.data[idx + 3] = 255 // A
    }
  }

  return PNG.sync.write(png)
}

// CRC32 implementation for PNG chunks
function crc32(buf: Buffer): number {
  let crc = 0xffffffff

  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff]
  }

  return (crc ^ 0xffffffff) >>> 0
}

const crc32Table = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1)
      } else {
        c = c >>> 1
      }
    }
    table[n] = c
  }
  return table
})()
