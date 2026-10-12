import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcryptjs';

async function seedCandidates() {
  console.log('Seeding default candidate accounts into PostgreSQL (jobrecipe)...');

  const defaultPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const candidatesToSeed = [
    {
      id: 'cand-demo-01',
      email: 'candidate@readysetjob.com',
      name: 'Aditya Candidate',
      mobile: '9876543210',
      college: 'National Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering (CSE)',
      specialization: 'Full-Stack Web Development',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      graduationYear: 2026,
      experienceLevel: 'Fresher'
    },
    {
      id: 'cand-demo-02',
      email: 'student@university.edu',
      name: 'Pera Student',
      mobile: '9876543211',
      college: 'Chandigarh University',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering (CSE)',
      specialization: 'Artificial Intelligence & Machine Learning (AI/ML)',
      city: 'Chandigarh',
      state: 'Punjab',
      country: 'India',
      graduationYear: 2026,
      experienceLevel: 'Fresher'
    }
  ];

  for (const c of candidatesToSeed) {
    // Upsert User
    await prisma.user.upsert({
      where: { email: c.email },
      update: {
        passwordHash,
        name: c.name,
        role: 'candidate',
        status: 'active'
      },
      create: {
        id: c.id,
        email: c.email,
        passwordHash,
        role: 'candidate',
        name: c.name,
        status: 'active'
      }
    });

    // Upsert Candidate
    await prisma.candidate.upsert({
      where: { id: c.id },
      update: {
        experienceLevel: c.experienceLevel,
        readinessStatus: 'In Progress',
        jobReadinessScore: 78,
        aptitudeScore: 82,
        reasoningScore: 76,
        technicalScore: 80,
        codingScore: 75,
        verbalScore: 80
      },
      create: {
        id: c.id,
        experienceLevel: c.experienceLevel,
        readinessStatus: 'In Progress',
        jobReadinessScore: 78,
        aptitudeScore: 82,
        reasoningScore: 76,
        technicalScore: 80,
        codingScore: 75,
        verbalScore: 80
      }
    });

    // Upsert CandidateProfile
    await prisma.candidateProfile.upsert({
      where: { id: c.id },
      update: {
        userId: c.id,
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        college: c.college,
        degree: c.degree,
        branch: c.branch,
        specialization: c.specialization,
        city: c.city,
        state: c.state,
        country: c.country,
        graduationYear: c.graduationYear,
        experienceLevel: c.experienceLevel
      },
      create: {
        id: c.id,
        userId: c.id,
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        college: c.college,
        degree: c.degree,
        branch: c.branch,
        specialization: c.specialization,
        city: c.city,
        state: c.state,
        country: c.country,
        graduationYear: c.graduationYear,
        experienceLevel: c.experienceLevel
      }
    });

    console.log(`✅ Candidate seeded: ${c.email} / ${defaultPassword}`);
  }

  // Also update peravishnuvardhanreddy2@gmail.com passwordHash to support Password@123 if needed
  const userPera = await prisma.user.findUnique({
    where: { email: 'peravishnuvardhanreddy2@gmail.com' }
  });
  if (userPera) {
    await prisma.user.update({
      where: { email: 'peravishnuvardhanreddy2@gmail.com' },
      data: { passwordHash }
    });
    console.log('✅ Updated peravishnuvardhanreddy2@gmail.com with Password@123 support');
  }

  console.log('Candidate seeding finished.');
  process.exit(0);
}

seedCandidates().catch(e => {
  console.error('Candidate seed failed:', e);
  process.exit(1);
});
