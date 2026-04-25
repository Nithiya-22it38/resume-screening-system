const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Extract text from uploaded resume files
 * Supports PDF, TXT, and provides guidance for DOCX
 */
const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    switch (ext) {
      case '.pdf':
        return await extractFromPDF(filePath);
      case '.txt':
        return extractFromTXT(filePath);
      case '.doc':
      case '.docx':
        return await extractFromDOC(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    logger.error(`Text extraction failed for ${filePath}:`, err.message);
    throw new Error(`Failed to extract text from resume: ${err.message}`);
  }
};

const extractFromPDF = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text.trim();
    if (!text || text.length < 50) {
      throw new Error('PDF appears to be empty or image-only. Please upload a text-based PDF.');
    }
    return cleanExtractedText(text);
  } catch (err) {
    if (err.message.includes('empty')) throw err;
    throw new Error(`Could not read PDF file. Ensure it is not password-protected.`);
  }
};

const extractFromTXT = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content || content.trim().length < 50) {
    throw new Error('Text file appears to be empty.');
  }
  return cleanExtractedText(content);
};

const extractFromDOC = async (filePath) => {
  // For production, integrate mammoth.js or libreoffice conversion
  // Fallback: read as binary and extract readable text
  try {
    const buffer = fs.readFileSync(filePath);
    // Extract readable ASCII text from binary
    let text = '';
    for (let i = 0; i < buffer.length; i++) {
      const charCode = buffer[i];
      if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
        text += String.fromCharCode(charCode);
      }
    }
    // Clean up and extract meaningful content
    const cleaned = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{5,}/g, '\n')
      .split('\n')
      .filter(line => line.trim().length > 3)
      .join('\n')
      .trim();

    if (cleaned.length < 100) {
      throw new Error('Could not extract sufficient text from DOC file. Please convert to PDF.');
    }

    return cleanExtractedText(cleaned);
  } catch (err) {
    throw new Error('DOCX parsing requires mammoth.js. Please upload PDF format for best results.');
  }
};

const cleanExtractedText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{3,}/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
};

/**
 * Validate that extracted text looks like a resume
 */
const validateResumeText = (text) => {
  if (!text || text.length < 100) {
    return { valid: false, reason: 'Document is too short to be a resume.' };
  }
  if (text.length > 50000) {
    return { valid: false, reason: 'Document is too large. Please submit a concise resume.' };
  }

  // Check for some typical resume indicators
  const resumeKeywords = [
    'experience', 'education', 'skills', 'work', 'university', 'college',
    'degree', 'employment', 'position', 'role', 'manager', 'engineer',
    'developer', 'analyst', 'coordinator', 'email', 'phone', 'linkedin',
    'project', 'responsibility', 'achievement', 'certification',
  ];

  const lowerText = text.toLowerCase();
  const matchCount = resumeKeywords.filter(kw => lowerText.includes(kw)).length;

  if (matchCount < 3) {
    return { valid: false, reason: 'Document does not appear to be a resume.' };
  }

  return { valid: true };
};

module.exports = { extractTextFromFile, validateResumeText };
