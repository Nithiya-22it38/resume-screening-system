const logger = require('../utils/logger');

// Check if real API key is set
const hasApiKey = process.env.ANTHROPIC_API_KEY &&
  process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' &&
  process.env.ANTHROPIC_API_KEY.startsWith('sk-ant');

let client = null;
if (hasApiKey) {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    logger.info('✅ Real AI mode active');
  } catch (e) {
    logger.warn('Anthropic SDK load failed, using demo mode');
  }
} else {
  logger.info('🎭 Demo mode active (no API key needed)');
}

// ─── DEMO MOCK DATA ────────────────────────────────────────────────────────

const DEMO_PROFILES = [
  { name: 'Aisha Patel', email: 'aisha.patel@email.com', phone: '+91 98765 43210', location: 'Bangalore, India', currentTitle: 'Senior Software Engineer', yearsOfExperience: 6, educationLevel: 'Master', topSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'] },
  { name: 'Rahul Sharma', email: 'rahul.s@gmail.com', phone: '+91 87654 32109', location: 'Mumbai, India', currentTitle: 'Full Stack Developer', yearsOfExperience: 4, educationLevel: 'Bachelor', topSkills: ['Vue.js', 'Python', 'Django', 'MongoDB', 'Docker'] },
  { name: 'Priya Krishnan', email: 'priya.k@techmail.com', phone: '+91 76543 21098', location: 'Chennai, India', currentTitle: 'Product Manager', yearsOfExperience: 5, educationLevel: 'Master', topSkills: ['Agile', 'JIRA', 'Roadmapping', 'SQL', 'Figma'] },
  { name: 'Arjun Mehta', email: 'arjun.m@dev.io', phone: '+91 65432 10987', location: 'Hyderabad, India', currentTitle: 'Backend Engineer', yearsOfExperience: 3, educationLevel: 'Bachelor', topSkills: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'MySQL'] },
  { name: 'Sneha Reddy', email: 'sneha.r@ux.com', phone: '+91 54321 09876', location: 'Pune, India', currentTitle: 'UX Designer', yearsOfExperience: 4, educationLevel: 'Bachelor', topSkills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'CSS'] },
];

const STRENGTHS = [
  'Strong technical background with hands-on experience in modern frameworks',
  'Demonstrated ability to deliver projects end-to-end with measurable impact',
  'Excellent communication skills from leadership roles and cross-team collaboration',
  'Progressive career growth showing increasing responsibility over time',
  'Well-rounded skill set covering both frontend and backend development',
  'Academic background aligns well with the technical requirements of this role',
  'Portfolio demonstrates practical application of required core skills',
  'Experience at recognized companies adds credibility to the application',
];

const CONCERNS = [
  'Limited experience with some specific technologies mentioned in requirements',
  'Career gaps present — worth clarifying during the interview process',
  'Relatively short tenure at previous roles — explore motivations in interview',
  'No explicit evidence of experience with large-scale distributed systems',
  'Leadership or management experience is not clearly demonstrated',
];

const INTERVIEW_QS = [
  'Walk me through a complex project you led from design to production deployment.',
  'How do you handle technical disagreements with stakeholders or team members?',
  'Describe a time you optimized performance in a live production system.',
  'How do you stay current with the rapidly changing technology landscape?',
  'Tell me about a project that failed — what did you learn and do differently?',
  'How do you approach mentoring junior developers on your team?',
  'Describe your Agile experience — how do you handle scope changes mid-sprint?',
  'What is your approach to writing maintainable, well-documented code?',
];

const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const extractNameFromText = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 60);
  const first = lines[0];
  if (first && /^[A-Za-z\s'.,\-]+$/.test(first)) {
    const words = first.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) return first;
  }
  return null;
};

const generateMockResult = async (resumeText, job) => {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1400)); // realistic delay

  const seed = resumeText.length % DEMO_PROFILES.length;
  const profile = { ...DEMO_PROFILES[seed] };
  const realName = extractNameFromText(resumeText);
  if (realName) profile.name = realName;

  const base = 45 + Math.floor(Math.random() * 45);
  const skillsMatch     = clamp(base + Math.floor(Math.random() * 16) - 8, 30, 97);
  const experienceMatch = clamp(base + Math.floor(Math.random() * 16) - 6, 30, 97);
  const educationMatch  = clamp(base + Math.floor(Math.random() * 20) - 5, 40, 97);
  const cultureFit      = clamp(base + Math.floor(Math.random() * 20) - 8, 35, 95);
  const overall = Math.round(skillsMatch * 0.40 + experienceMatch * 0.35 + educationMatch * 0.15 + cultureFit * 0.10);

  let status;
  if (overall >= 75 && skillsMatch >= 70 && experienceMatch >= 65) status = 'shortlisted';
  else if (overall >= 55) status = 'review';
  else status = 'rejected';

  const reqs = job.requirements || [];
  const splitAt = Math.ceil(reqs.length * (skillsMatch / 100));
  const matchedRequirements = reqs.slice(0, splitAt);
  const missingRequirements = reqs.slice(splitAt);

  const summaries = {
    shortlisted: `${profile.name} is a strong candidate for the ${job.title} role with ${profile.yearsOfExperience} years of relevant experience. Their skill set closely aligns with the job requirements, and their background shows a consistent upward trajectory.`,
    review:      `${profile.name} shows potential for the ${job.title} role but has some gaps in the required skill set. A technical screen and exploratory call are recommended before making a final decision.`,
    rejected:    `${profile.name}'s profile does not closely match the current requirements for ${job.title}. Key technical skills and experience levels fall below the expected threshold for this position.`,
  };

  const recommendations = {
    shortlisted: `Recommend moving ${profile.name} forward to the technical interview stage. Focus on system design and their experience with ${profile.topSkills.slice(0, 2).join(' and ')}. Their profile suggests a strong long-term fit for the team.`,
    review:      `Consider a 30-minute exploratory call with ${profile.name} to assess culture fit and clarify experience gaps. If positive, proceed to the technical screen. Keep as a backup candidate meanwhile.`,
    rejected:    `At this time, ${profile.name}'s profile is not a strong match for ${job.title}. Consider keeping their resume on file for a more junior opening or a different department.`,
  };

  return {
    candidateProfile: profile,
    scores: { skillsMatch, experienceMatch, educationMatch, cultureFit, overall },
    overallScore: overall,
    status,
    strengths: pick(STRENGTHS, 3),
    concerns:  status === 'shortlisted' ? pick(CONCERNS, 1) : pick(CONCERNS, 2),
    missingRequirements,
    matchedRequirements,
    interviewQuestions: pick(INTERVIEW_QS, 3),
    summary: summaries[status],
    recommendation: recommendations[status],
    screenedAt: new Date().toISOString(),
    model: 'demo-mode',
    isDemoMode: true,
  };
};

// ─── REAL AI MODE ─────────────────────────────────────────────────────────

const screenResumeWithAI = async ({ resumeText, job }) => {
  const jobDesc = `Job Title: ${job.title}\nDepartment: ${job.department}\nLocation: ${job.location}\nType: ${job.type}\n\nDescription:\n${job.description}\n\nRequirements:\n${job.requirements.map((r,i)=>`${i+1}. ${r}`).join('\n')}\n\nNice to Have:\n${(job.niceToHave||[]).map((n,i)=>`${i+1}. ${n}`).join('\n')}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: 'You are an expert HR recruiter. Evaluate resumes objectively. Respond with valid JSON only — no markdown, no preamble. Scoring weights: Skills 40%, Experience 35%, Education 15%, Culture 10%. Status: shortlisted if overall>=75 AND skills>=70 AND experience>=65; review if overall>=55; else rejected.',
    messages: [{ role: 'user', content: `Evaluate this resume for the job below. Return ONLY a JSON object.\n\n=== JOB ===\n${jobDesc}\n\n=== RESUME ===\n${resumeText.slice(0,12000)}\n\nJSON structure:\n{"candidateProfile":{"name":"string","email":"string|null","phone":"string|null","location":"string|null","currentTitle":"string","yearsOfExperience":number,"educationLevel":"Bachelor|Master|PhD|Bootcamp|Self-taught|Other","topSkills":["s1","s2","s3","s4","s5"]},"scores":{"skillsMatch":number,"experienceMatch":number,"educationMatch":number,"cultureFit":number,"overall":number},"status":"shortlisted|review|rejected","strengths":["s1","s2","s3"],"concerns":["c1","c2"],"missingRequirements":["m1"],"matchedRequirements":["r1","r2"],"interviewQuestions":["q1","q2","q3"],"summary":"2-3 sentence summary","recommendation":"3-4 sentence recommendation"}` }],
  });

  const text = message.content[0].text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'');
  const result = JSON.parse(text);
  Object.keys(result.scores).forEach(k => { result.scores[k] = clamp(Math.round(result.scores[k]), 0, 100); });
  return { ...result, overallScore: result.scores.overall, screenedAt: new Date().toISOString(), model: 'claude-opus-4-5', isDemoMode: false };
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────

const screenResume = async ({ resumeText, job }) => {
  if (!client) return generateMockResult(resumeText, job);
  return screenResumeWithAI({ resumeText, job });
};

const batchScreenResumes = async (resumes, job, onProgress) => {
  const results = [];
  const LIMIT = client ? 3 : 5;
  for (let i = 0; i < resumes.length; i += LIMIT) {
    const batch = resumes.slice(i, i + LIMIT);
    const batchResults = await Promise.allSettled(batch.map(r => screenResume({ resumeText: r.extractedText, job })));
    batchResults.forEach((result, idx) => {
      const ri = i + idx;
      if (result.status === 'fulfilled') results.push({ resumeId: resumes[ri].id, success: true, data: result.value });
      else results.push({ resumeId: resumes[ri].id, success: false, error: result.reason.message });
      if (onProgress) onProgress({ completed: ri + 1, total: resumes.length });
    });
    if (client && i + LIMIT < resumes.length) await new Promise(r => setTimeout(r, 1000));
  }
  return results;
};

const generateComparisonReport = async (candidates, jobTitle) => {
  if (!client) {
    const sorted = [...candidates].sort((a,b) => (b.screeningResult?.overallScore||0) - (a.screeningResult?.overallScore||0));
    return {
      ranking: sorted.map((c,i) => ({ name: c.candidateName, rank: i+1, reason: i===0 ? 'Highest overall AI score with strongest skills alignment' : `Solid candidate, ranked ${i+1} by overall screening score` })),
      topChoice: sorted[0]?.candidateName || 'N/A',
      recommendation: `Based on screening scores, ${sorted[0]?.candidateName} is the strongest candidate for ${jobTitle}. Their profile shows the best alignment with the job requirements among the shortlisted pool.`,
      keyDifferentiators: ['Overall AI screening score', 'Skills match percentage', 'Years of relevant experience'],
    };
  }
  const summaries = candidates.map((c,i) => `Candidate ${i+1}: ${c.candidateName} — Score: ${c.screeningResult?.overallScore||'N/A'}`).join('\n');
  const message = await client.messages.create({
    model: 'claude-opus-4-5', max_tokens: 800,
    system: 'HR consultant. JSON only.',
    messages: [{ role: 'user', content: `Compare candidates for ${jobTitle}:\n${summaries}\n\nReturn JSON: {"ranking":[{"name":"...","rank":1,"reason":"..."}],"topChoice":"...","recommendation":"...","keyDifferentiators":["..."]}` }],
  });
  const text = message.content[0].text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'');
  return JSON.parse(text);
};

module.exports = { screenResume, batchScreenResumes, generateComparisonReport, isDemoMode: !client };
