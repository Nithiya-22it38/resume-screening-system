const express = require('express');
const db = require('../models/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});

// GET /api/analytics/job/:jobId
router.get('/job/:jobId', (req, res) => {
  const job = db.findJobById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  const resumes = db.getAllResumes({ jobId: req.params.jobId });
  const screened = resumes.filter(r => r.screeningStatus === 'completed');

  const statusBreakdown = resumes.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const avgScore = screened.length > 0
    ? Math.round(screened.reduce((sum, r) => {
        const result = db.findScreeningByResumeId(r.id);
        return sum + (result?.overallScore || 0);
      }, 0) / screened.length)
    : 0;

  const scoreRanges = screened.reduce((acc, r) => {
    const result = db.findScreeningByResumeId(r.id);
    if (!result) return acc;
    if (result.overallScore >= 80) acc.excellent = (acc.excellent || 0) + 1;
    else if (result.overallScore >= 65) acc.good = (acc.good || 0) + 1;
    else if (result.overallScore >= 50) acc.fair = (acc.fair || 0) + 1;
    else acc.poor = (acc.poor || 0) + 1;
    return acc;
  }, {});

  res.json({
    job: { id: job.id, title: job.title, status: job.status },
    totalApplications: resumes.length,
    screenedCount: screened.length,
    averageScore: avgScore,
    statusBreakdown,
    scoreRanges,
    conversionRate: resumes.length > 0
      ? Math.round((resumes.filter(r => r.status === 'shortlisted').length / resumes.length) * 100)
      : 0,
  });
});

module.exports = router;
