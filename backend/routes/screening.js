const express = require('express');
const db = require('../models/store');
const { authenticate, authorize } = require('../middleware/auth');
const { screenResume, batchScreenResumes, generateComparisonReport, isDemoMode } = require('../services/aiScreening');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate);

// GET /api/screening/mode - Returns whether demo or real AI mode is active
router.get('/mode', (req, res) => {
  res.json({ isDemoMode, mode: isDemoMode ? 'demo' : 'ai' });
});

// POST /api/screening/resume/:resumeId - Screen a single resume
router.post('/resume/:resumeId', authorize('admin', 'recruiter'), async (req, res, next) => {
  try {
    const resume = db.findResumeById(req.params.resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found.' });

    if (!resume.extractedText) {
      return res.status(400).json({ error: 'Resume has no extracted text. Please re-upload.' });
    }

    const job = db.findJobById(resume.jobId);
    if (!job) return res.status(404).json({ error: 'Associated job not found.' });

    // Mark as in progress
    db.updateResume(resume.id, { screeningStatus: 'processing' });

    logger.info(`Starting AI screening for resume ${resume.id}`);
    const screeningResult = await screenResume({ resumeText: resume.extractedText, job });

    // Save screening result
    const savedResult = db.createScreeningResult({
      resumeId: resume.id,
      jobId: resume.jobId,
      ...screeningResult,
    });

    // Update resume status based on AI recommendation
    db.updateResume(resume.id, {
      screeningStatus: 'completed',
      status: screeningResult.status,
      candidateName: screeningResult.candidateProfile?.name || resume.candidateName,
    });

    res.json({
      message: 'Resume screened successfully.',
      screeningResult: savedResult,
      candidateProfile: screeningResult.candidateProfile,
    });
  } catch (err) {
    // Mark as failed
    db.updateResume(req.params.resumeId, { screeningStatus: 'failed' });
    logger.error('Screening failed:', err.message);
    next(err);
  }
});

// POST /api/screening/batch/:jobId - Batch screen all pending resumes for a job
router.post('/batch/:jobId', authorize('admin', 'recruiter'), async (req, res, next) => {
  try {
    const job = db.findJobById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const pendingResumes = db.getAllResumes({ jobId: req.params.jobId })
      .filter(r => r.screeningStatus === 'pending' && r.extractedText);

    if (!pendingResumes.length) {
      return res.status(400).json({ error: 'No pending resumes to screen for this job.' });
    }

    // Mark all as processing
    pendingResumes.forEach(r => db.updateResume(r.id, { screeningStatus: 'processing' }));

    // Start async batch processing (non-blocking response)
    res.json({
      message: `Batch screening started for ${pendingResumes.length} resume(s).`,
      count: pendingResumes.length,
      jobId: req.params.jobId,
    });

    // Process in background
    batchScreenResumes(pendingResumes, job, (progress) => {
      logger.info(`Batch screening progress: ${progress.completed}/${progress.total}`);
    }).then(results => {
      results.forEach(result => {
        if (result.success) {
          db.createScreeningResult({ resumeId: result.resumeId, jobId: req.params.jobId, ...result.data });
          db.updateResume(result.resumeId, {
            screeningStatus: 'completed',
            status: result.data.status,
            candidateName: result.data.candidateProfile?.name || undefined,
          });
        } else {
          db.updateResume(result.resumeId, { screeningStatus: 'failed' });
          logger.error(`Failed to screen resume ${result.resumeId}: ${result.error}`);
        }
      });
      logger.info(`Batch screening completed: ${results.filter(r => r.success).length} succeeded`);
    }).catch(err => {
      logger.error('Batch screening error:', err.message);
      pendingResumes.forEach(r => db.updateResume(r.id, { screeningStatus: 'failed' }));
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/screening/result/:resumeId - Get screening result for a resume
router.get('/result/:resumeId', (req, res) => {
  const resume = db.findResumeById(req.params.resumeId);
  if (!resume) return res.status(404).json({ error: 'Resume not found.' });

  const result = db.findScreeningByResumeId(req.params.resumeId);
  if (!result) {
    return res.status(404).json({ error: 'No screening result found for this resume.' });
  }

  res.json({ screeningResult: result });
});

// POST /api/screening/compare/:jobId - Compare shortlisted candidates
router.post('/compare/:jobId', authorize('admin', 'recruiter'), async (req, res, next) => {
  try {
    const job = db.findJobById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const shortlisted = db.getAllResumes({ jobId: req.params.jobId, status: 'shortlisted' });
    if (shortlisted.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 shortlisted candidates to compare.' });
    }

    const candidatesWithResults = shortlisted.map(r => ({
      ...r,
      screeningResult: db.findScreeningByResumeId(r.id),
    }));

    const comparison = await generateComparisonReport(candidatesWithResults, job.title);
    res.json({ comparison, candidates: shortlisted.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/screening/status/:jobId - Get screening status for all resumes in a job
router.get('/status/:jobId', (req, res) => {
  const job = db.findJobById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  const resumes = db.getAllResumes({ jobId: req.params.jobId });
  const statusCounts = resumes.reduce((acc, r) => {
    acc[r.screeningStatus] = (acc[r.screeningStatus] || 0) + 1;
    return acc;
  }, {});

  res.json({
    jobId: req.params.jobId,
    total: resumes.length,
    statusBreakdown: statusCounts,
    pendingScreening: resumes.filter(r => r.screeningStatus === 'pending').length,
    completedScreening: resumes.filter(r => r.screeningStatus === 'completed').length,
  });
});

module.exports = router;
