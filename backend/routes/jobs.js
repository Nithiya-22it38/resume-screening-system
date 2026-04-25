const express = require('express');
const { z } = require('zod');
const db = require('../models/store');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const jobSchema = z.object({
  title: z.string().min(2).max(200),
  department: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']),
  description: z.string().min(50).max(5000),
  requirements: z.array(z.string().min(5)).min(1).max(20),
  niceToHave: z.array(z.string()).optional().default([]),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  status: z.enum(['active', 'paused', 'closed']).default('active'),
});

// GET /api/jobs
router.get('/', (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.department) filters.department = req.query.department;

  const jobs = db.getAllJobs(filters);
  const jobsWithCounts = jobs.map(job => ({
    ...job,
    applicationCount: db.getAllResumes({ jobId: job.id }).length,
    shortlistedCount: db.getAllResumes({ jobId: job.id, status: 'shortlisted' }).length,
  }));

  res.json({ jobs: jobsWithCounts, total: jobsWithCounts.length });
});

// GET /api/jobs/:id
router.get('/:id', (req, res) => {
  const job = db.findJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  const resumes = db.getAllResumes({ jobId: job.id });
  res.json({
    job: {
      ...job,
      applicationCount: resumes.length,
      shortlistedCount: resumes.filter(r => r.status === 'shortlisted').length,
      pendingCount: resumes.filter(r => r.status === 'pending').length,
    },
  });
});

// POST /api/jobs
router.post('/', authorize('admin', 'recruiter'), (req, res, next) => {
  try {
    const data = jobSchema.parse(req.body);

    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      return res.status(400).json({ error: 'Minimum salary cannot exceed maximum salary.' });
    }

    const job = db.createJob({ ...data, createdBy: req.user.id });
    res.status(201).json({ job, message: 'Job created successfully.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message, details: err.errors });
    }
    next(err);
  }
});

// PUT /api/jobs/:id
router.put('/:id', authorize('admin', 'recruiter'), (req, res, next) => {
  try {
    const job = db.findJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const data = jobSchema.partial().parse(req.body);
    const updated = db.updateJob(req.params.id, data);
    res.json({ job: updated, message: 'Job updated successfully.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// PATCH /api/jobs/:id/status
router.patch('/:id/status', authorize('admin', 'recruiter'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'paused', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const job = db.updateJob(req.params.id, { status });
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job, message: `Job status updated to ${status}.` });
});

// DELETE /api/jobs/:id
router.delete('/:id', authorize('admin'), (req, res) => {
  const deleted = db.deleteJob(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Job not found.' });
  res.json({ message: 'Job deleted successfully.' });
});

module.exports = router;
