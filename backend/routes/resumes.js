const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../models/store');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { extractTextFromFile, validateResumeText } = require('../services/resumeParser');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate);

// GET /api/resumes
router.get('/', (req, res) => {
  const filters = {};
  if (req.query.jobId) filters.jobId = req.query.jobId;
  if (req.query.status) filters.status = req.query.status;

  const resumes = db.getAllResumes(filters).map(r => {
    const screening = db.findScreeningByResumeId(r.id);
    return {
      ...r,
      extractedText: undefined, // Don't send full text in lists
      screeningResult: screening ? {
        overallScore: screening.overallScore,
        status: screening.status,
        summary: screening.summary,
        scores: screening.scores,
        screenedAt: screening.createdAt,
      } : null,
    };
  });

  res.json({ resumes, total: resumes.length });
});

// GET /api/resumes/:id
router.get('/:id', (req, res) => {
  const resume = db.findResumeById(req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found.' });

  const screening = db.findScreeningByResumeId(resume.id);
  const job = db.findJobById(resume.jobId);

  res.json({
    resume: {
      ...resume,
      extractedText: undefined, // Don't expose raw text in normal view
      job: job ? { id: job.id, title: job.title, department: job.department } : null,
      screeningResult: screening || null,
    },
  });
});

// POST /api/resumes/upload - Single or multiple file upload
router.post('/upload', authorize('admin', 'recruiter'), upload.array('resumes', 10), async (req, res, next) => {
  const uploadedFiles = req.files || [];
  const { jobId, candidateNames } = req.body;

  if (!uploadedFiles.length) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  if (!jobId) {
    // Clean up uploaded files
    uploadedFiles.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(400).json({ error: 'Job ID is required.' });
  }

  const job = db.findJobById(jobId);
  if (!job) {
    uploadedFiles.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(404).json({ error: 'Job not found.' });
  }

  const results = [];
  const namesArray = candidateNames
    ? (Array.isArray(candidateNames) ? candidateNames : [candidateNames])
    : [];

  for (let i = 0; i < uploadedFiles.length; i++) {
    const file = uploadedFiles[i];
    try {
      // Extract text from resume
      const extractedText = await extractTextFromFile(file.path);
      const validation = validateResumeText(extractedText);

      if (!validation.valid) {
        fs.unlink(file.path, () => {});
        results.push({
          filename: file.originalname,
          success: false,
          error: validation.reason,
        });
        continue;
      }

      // Create resume record
      const resume = db.createResume({
        jobId,
        filename: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        candidateName: namesArray[i] || extractCandidateNameFromText(extractedText, file.originalname),
        extractedText,
        status: 'pending',
        screeningStatus: 'pending',
        uploadedBy: req.user.id,
      });

      results.push({
        filename: file.originalname,
        success: true,
        resume: {
          id: resume.id,
          candidateName: resume.candidateName,
          status: resume.status,
          uploadedAt: resume.uploadedAt,
        },
      });
    } catch (err) {
      logger.error(`Failed to process ${file.originalname}:`, err.message);
      fs.unlink(file.path, () => {});
      results.push({
        filename: file.originalname,
        success: false,
        error: err.message,
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.status(201).json({
    message: `${successful} resume(s) uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
    results,
    summary: { successful, failed, total: results.length },
  });
});

// PATCH /api/resumes/:id/status
router.patch('/:id/status', authorize('admin', 'recruiter'), (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'shortlisted', 'review', 'rejected', 'hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const resume = db.updateResume(req.params.id, { status, notes, reviewedBy: req.user.id });
  if (!resume) return res.status(404).json({ error: 'Resume not found.' });

  res.json({ resume: { id: resume.id, status: resume.status }, message: 'Status updated.' });
});

// DELETE /api/resumes/:id
router.delete('/:id', authorize('admin', 'recruiter'), (req, res) => {
  const resume = db.findResumeById(req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found.' });

  // Delete file from disk
  if (resume.filePath && fs.existsSync(resume.filePath)) {
    fs.unlink(resume.filePath, err => {
      if (err) logger.warn(`Could not delete file: ${resume.filePath}`);
    });
  }

  db.deleteResume(req.params.id);
  res.json({ message: 'Resume deleted successfully.' });
});

// Helper to extract candidate name from resume text
const extractCandidateNameFromText = (text, filename) => {
  // Try to get name from first non-empty line
  const lines = text.split('\n').filter(l => l.trim().length > 2);
  const firstLine = lines[0]?.trim();

  // If first line looks like a name (2-4 words, no special chars, not too long)
  if (firstLine && firstLine.length < 60 && /^[A-Za-z\s'-]+$/.test(firstLine)) {
    const words = firstLine.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      return firstLine;
    }
  }

  // Fallback to filename without extension
  return path.basename(filename, path.extname(filename)).replace(/[-_]/g, ' ');
};

module.exports = router;
