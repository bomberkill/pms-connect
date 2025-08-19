"use client"
// import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// // GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.mjs`
// GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.mjs`

// // pms-connect/node_modules/pdfjs-dist/build/pdf.worker.mjs
// export const pdfToImage = async (file: File): Promise<string | null> => {
//   const arrayBuffer = await file.arrayBuffer()
//   const pdf = await getDocument({ data: arrayBuffer }).promise
//   const page = await pdf.getPage(1)

//   const viewport = page.getViewport({ scale: 1.5 })

//   const canvas = document.createElement('canvas')
//   const context = canvas.getContext('2d')

//   if (!context) return null 

//   canvas.width = viewport.width
//   canvas.height = viewport.height

//   await page.render({ canvasContext: context, viewport }).promise

//   return canvas.toDataURL('image/png')
// }



// export const pdfToImage = async (file: File): Promise<string> => {
//   const { getDocument } = await import('pdfjs-dist')

//   const arrayBuffer = await file.arrayBuffer()
//   const pdf = await getDocument({ data: arrayBuffer }).promise
//   const page = await pdf.getPage(1)

//   const viewport = page.getViewport({ scale: 1.5 })

//   const canvas = document.createElement('canvas')
//   const context = canvas.getContext('2d')!

//   canvas.width = viewport.width
//   canvas.height = viewport.height

//   await page.render({ canvasContext: context, viewport }).promise

//   return canvas.toDataURL('image/png')
// }


export const pdfToImage = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist') // <-- Legacy version OK pour navigateur
  const {default: pdfjsWorker} = await import('pdfjs-dist/build/pdf.worker.entry')

  // 🧠 On indique au PDFJS où trouver le worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvasContext: context, viewport }).promise

  return canvas.toDataURL('image/png')
}

