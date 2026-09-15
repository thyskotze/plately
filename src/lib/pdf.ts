// A deliberately tiny PDF writer: each page is one full-bleed JPEG. That's all
// the coach report needs (the pages are drawn on a canvas), and it keeps the app
// free of a PDF library. Text in the output isn't selectable — fine for a report
// that's read, printed or forwarded.

export interface PdfPage {
  /** Baseline JPEG bytes (e.g. from canvas.toBlob(..., 'image/jpeg')). */
  jpeg: Uint8Array
  /** Pixel size of the JPEG. */
  width: number
  height: number
}

const enc = new TextEncoder()

/** PDF string literals are byte strings; keep the title plain ASCII. */
const pdfString = (s: string) =>
  '(' +
  s
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/([\\()])/g, '\\$1') +
  ')'

/**
 * Build a PDF with one image per page, scaled to fill an A4 page (or the given
 * size in points). Object layout: 1 catalog, 2 page tree, then per page
 * [page, content stream, image], then the info dictionary.
 */
export function buildPdf(
  pages: PdfPage[],
  opts: { title?: string; pageW?: number; pageH?: number } = {},
): Blob {
  const pageW = opts.pageW ?? 595.28
  const pageH = opts.pageH ?? 841.89
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let pos = 0

  const push = (part: Uint8Array | string) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    pos += bytes.length
  }
  const obj = (num: number, parts: (Uint8Array | string)[]) => {
    offsets[num] = pos
    push(`${num} 0 obj\n`)
    parts.forEach(push)
    push('\nendobj\n')
  }

  // Header; the high-byte comment marks the file as binary for transfer tools.
  push('%PDF-1.4\n')
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  const n = pages.length
  const pageObj = (i: number) => 3 + 3 * i

  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  obj(2, [`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${n} >>`])

  pages.forEach((p, i) => {
    const pageNum = pageObj(i)
    const contentNum = pageNum + 1
    const imageNum = pageNum + 2
    obj(pageNum, [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
        `/Resources << /XObject << /Im0 ${imageNum} 0 R >> >> /Contents ${contentNum} 0 R >>`,
    ])
    const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`
    obj(contentNum, [`<< /Length ${enc.encode(content).length} >>\nstream\n`, content, 'endstream'])
    obj(imageNum, [
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      p.jpeg,
      '\nendstream',
    ])
  })

  const infoNum = 3 + 3 * n
  obj(infoNum, [`<< /Title ${pdfString(opts.title ?? 'Plately report')} /Producer (Plately) >>`])

  const xrefPos = pos
  let xref = `xref\n0 ${infoNum + 1}\n0000000000 65535 f \n`
  for (let k = 1; k <= infoNum; k++) xref += `${String(offsets[k]).padStart(10, '0')} 00000 n \n`
  push(xref)
  push(`trailer\n<< /Size ${infoNum + 1} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`)

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}
