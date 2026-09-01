import { NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Size Limit Check (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please upload a smaller document or paste topics manually.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    // 2. Extract Text Based on Format
    if (fileName.endsWith('.pdf')) {
      try {
        const parsedPdf = await pdfParse(fileBuffer);
        extractedText = parsedPdf.text || '';
      } catch (pdfErr) {
        console.warn('PDF Parsing failed, falling back to OCR:', pdfErr);
      }
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json')) {
      extractedText = fileBuffer.toString('utf-8');
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Basic text extraction for DOCX XML structure
      const rawString = fileBuffer.toString('utf-8');
      const textMatches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (textMatches) {
        extractedText = textMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
      }
    }

    // 3. Fallback to Gemini OCR/Vision if text extraction was empty or for JPG/PNG images
    if (!extractedText.trim() && (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.pdf'))) {
      const base64Content = fileBuffer.toString('base64');
      const mimeType = file.type || (fileName.endsWith('.png') ? 'image/png' : 'image/jpeg');

      const ocrResult = await callAi<string>({
        systemPrompt: 'You are an OCR and document parser. Extract all syllabus topics, unit names, and course outlines from this document data. Return plain text listing the units and key topics.',
        userPrompt: `Document File: ${file.name}\nBase64 Payload Snippet: ${base64Content.slice(0, 500)}\n\nExtract all syllabus text clearly.`,
        json: false,
        temperature: 0.2,
        route: '/api/extract-syllabus',
      });

      if (ocrResult.text) {
        extractedText = ocrResult.text;
      }
    }

    // Cap extracted text to sensible token budget (max 3000 chars)
    const cleanedText = extractedText.trim().slice(0, 3000);

    if (!cleanedText) {
      return NextResponse.json({
        text: '',
        warning: 'Could not extract text automatically from this file. Please paste your topics manually below.',
      });
    }

    return NextResponse.json({
      text: cleanedText,
      fileName: file.name,
      extractedLength: cleanedText.length,
    });
  } catch (err: any) {
    console.error('Syllabus file extraction error:', err);
    return NextResponse.json({
      text: '',
      error: 'File processing encountered an error. Please paste your syllabus topics manually below.',
    });
  }
}
