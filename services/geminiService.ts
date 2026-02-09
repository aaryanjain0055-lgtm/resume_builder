

import { GoogleGenAI, Type } from "@google/genai";
import { 
  ResumeData, 
  JobMatchResult, 
  CareerRoadmap, 
  ResumeAuditResult,
  ResumeRankingResult,
  ResumeComparisonResult,
  InterviewPrep,
  CareerDNA,
  AIConfidence
} from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

// ------------------------------------------------
// 1) CHAT ASSISTANT (The Career Copilot Persona)
// ------------------------------------------------
export const chatWithAssistant = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
    try {
        const chat = ai.chats.create({
            model: MODEL_NAME,
            config: {
                systemInstruction: "You are a helpful, encouraging Career Copilot assistant. You help students and job seekers with resume advice, interview tips, and career guidance. Keep answers concise, actionable, and supportive."
            },
            history: history
        });

        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat error:", error);
        return "I'm having trouble connecting right now. Please check your internet or API key.";
    }
};

// ------------------------------------------------
// 2) RESUME AUDITOR (The Critic)
// ------------------------------------------------
export const auditResume = async (resume: ResumeData): Promise<ResumeAuditResult> => {
  try {
    const prompt = `
      You are a rigorous Resume Auditor.
      Analyze the following resume data and provide honest, professional feedback.

      Identify:
      - Lagging Stages (weak or unprofessional areas)
      - Development Areas (skills or experience to acquire)

      Return ONLY a JSON object:
      {
        "score": number (0–100),
        "strengths": string[],
        "weaknesses": string[],
        "suggestions": string[],
        "missingCriticalSkills": string[]
      }

      RESUME:
      ${JSON.stringify(resume)}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ResumeAuditResult;
  } catch (error) {
    console.error("Error auditing resume:", error);
    throw error;
  }
};

// ------------------------------------------------
// 3) JOB MATCH ANALYZER (The ATS Simulator)
// ------------------------------------------------
export const analyzeJobMatch = async (resume: ResumeData, jobDescription: string): Promise<JobMatchResult> => {
  try {
    const prompt = `
      You are an expert Applicant Tracking System (ATS) Analyzer.

      Compare the candidate resume JSON with the job description.
      Simulate a real ATS screening process.

      Return ONLY a JSON object:
      {
        "role": string,
        "matchScore": number (0–100),
        "missingSkills": string[],
        "keywordGaps": string[],
        "analysis": string,
        "skillGapAnalysis": [
          {
            "category": "Technical | Soft | Tools",
            "current": number (0–10),
            "required": number (0–10)
          }
        ]
      }

      RESUME:
      ${JSON.stringify(resume)}

      JOB DESCRIPTION:
      ${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    return data as JobMatchResult;
  } catch (error) {
    console.error("Error analyzing job match:", error);
    throw error;
  }
};

// ------------------------------------------------
// 4) RESUME TAILOR (The Writer)
// ------------------------------------------------
export const generateTailoredResume = async (resume: ResumeData, targetRole: string): Promise<ResumeData> => {
    try {
        const prompt = `
          You are an expert Resume Writer and Career Coach.

          Optimize the following resume for the target role: "${targetRole}".

          Tasks:
          - Rewrite the professional summary to be role-specific
          - Improve experience bullets using action verbs and metrics
          - Reorder and highlight relevant skills

          Return the FULL updated resume as JSON only.

          CURRENT RESUME:
          ${JSON.stringify(resume)}
        `;
    
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
    
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return JSON.parse(text) as ResumeData;
      } catch (error) {
        console.error("Error tailoring resume:", error);
        throw error;
      }
};

// ------------------------------------------------
// 5) CAREER ROADMAP GENERATOR (The Strategist)
// ------------------------------------------------
export const generateCareerRoadmap = async (resume: ResumeData, targetRole: string): Promise<CareerRoadmap> => {
  try {
    const prompt = `
      Create a 12-week career roadmap for a candidate targeting the role "${targetRole}".

      Candidate Skills:
      ${resume.skills.map(s => s.name).join(', ')}

      Experience Level:
      ${resume.experience.length > 0 ? resume.experience[0].role : 'Entry Level'}

      Return ONLY raw JSON:
      {
        "targetRole": string,
        "duration": "12 Weeks",
        "overview": string,
        "weeks": [
          {
            "week": number,
            "focus": string,
            "tasks": string[],
            "resources": string[]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as CareerRoadmap;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw error;
  }
};

// ------------------------------------------------
// 6) SKILL RESOURCE FINDER (The Teacher)
// ------------------------------------------------
export const getSkillResources = async (skill: string): Promise<string> => {
    try {
        const prompt = `
          Provide a concise (max 2 sentences), actionable learning tip
          for acquiring the following skill.

          Skill:
          "${skill}"

          Return plain text only.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });

        const text = response.text;
        if (!text) return "Check official documentation and online tutorials.";
        return text.trim();
    } catch (error) {
        console.error("Error getting skill resources:", error);
        return "Search online for official documentation.";
    }
};

// ------------------------------------------------
// 7) EXPERIENCE BULLET GENERATOR (The Copywriter)
// ------------------------------------------------
export const generateExperienceContent = async (role: string, company: string): Promise<string> => {
    try {
        const prompt = `
          Generate ATS-optimized resume bullet points.

          Role:
          ${role}

          Company:
          ${company}

          Return a single string containing 3–4 bullet points
          using '•'. Do not include explanations.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return text.trim();
    } catch (error) {
        console.error("Error generating experience content:", error);
        throw error;
    }
};

// ------------------------------------------------
// 8) RESUME RANKING SIMULATOR (The Recruiter)
// ------------------------------------------------
export const rankCandidates = async (jobDescription: string, resumes: ResumeData[]): Promise<ResumeRankingResult> => {
    try {
        const prompt = `
          You are a senior technical recruiter.

          Given a job description and multiple resumes,
          rank candidates as a recruiter would.

          Return ONLY JSON:
          {
            "jobRole": string,
            "rankedCandidates": [
              {
                "candidateId": string,
                "rank": number,
                "shortlistDecision": "Strong Yes" | "Maybe" | "Reject",
                "reason": string,
                "topStrengths": string[],
                "redFlags": string[]
              }
            ],
            "recruiterInsights": string
          }

          JOB DESCRIPTION:
          ${jobDescription}

          CANDIDATE RESUMES:
          ${JSON.stringify(resumes)}
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as ResumeRankingResult;
    } catch (error) {
        console.error("Error ranking candidates:", error);
        throw error;
    }
};

// ------------------------------------------------
// 9) RESUME VERSION COMPARATOR (The Optimizer)
// ------------------------------------------------
export const compareResumeVersions = async (targetRole: string, versionA: ResumeData, versionB: ResumeData): Promise<ResumeComparisonResult> => {
    try {
        const prompt = `
          You are a Resume Performance Analyst.

          Compare two resume versions for the same role.

          Return ONLY JSON:
          {
            "versionA_score": number,
            "versionB_score": number,
            "improvements": string[],
            "regressions": string[],
            "netImpact": "Positive" | "Neutral" | "Negative",
            "finalRecommendation": string
          }

          TARGET ROLE:
          ${targetRole}

          RESUME VERSION A:
          ${JSON.stringify(versionA)}

          RESUME VERSION B:
          ${JSON.stringify(versionB)}
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as ResumeComparisonResult;
    } catch (error) {
        console.error("Error comparing versions:", error);
        throw error;
    }
};

// ------------------------------------------------
// 10) INTERVIEW READINESS COACH (The Interviewer)
// ------------------------------------------------
export const generateInterviewPrep = async (role: string, resume: ResumeData): Promise<InterviewPrep> => {
    try {
        const prompt = `
          You are a technical interview coach.

          Based on the resume and role, generate interview preparation content.

          Return ONLY JSON:
          {
            "role": string,
            "technicalQuestions": string[],
            "behavioralQuestions": string[],
            "resumeSpecificQuestions": string[],
            "focusAreas": string[]
          }

          RESUME:
          ${JSON.stringify(resume)}

          TARGET ROLE:
          ${role}
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as InterviewPrep;
    } catch (error) {
        console.error("Error generating interview prep:", error);
        throw error;
    }
};

// ------------------------------------------------
// 11) CAREER DNA ANALYZER (The Psychometric AI)
// ------------------------------------------------
export const analyzeCareerDNA = async (resume: ResumeData): Promise<CareerDNA> => {
    try {
        const prompt = `
          You are a Career Intelligence Analyst.

          Analyze the candidate and infer their career DNA.

          Return ONLY JSON:
          {
            "careerDNA": {
              "primaryStrengths": string[],
              "workingStyle": string,
              "learningSpeed": "Fast" | "Medium" | "Slow",
              "careerTrajectory": "Specialist" | "Generalist" | "Leadership",
              "recommendedRoles": string[],
              "riskAreas": string[]
            },
            "summary": string
          }

          RESUME:
          ${JSON.stringify(resume)}
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as CareerDNA;
    } catch (error) {
        console.error("Error analyzing career DNA:", error);
        throw error;
    }
};

// ------------------------------------------------
// 12) AI CONFIDENCE VALIDATOR (Explainable AI)
// ------------------------------------------------
export const validateAIOutput = async (aiOutputContent: string): Promise<AIConfidence> => {
    try {
        const prompt = `
          You are an AI Output Validator.

          Evaluate the reliability of the AI-generated output.

          Return ONLY JSON:
          {
            "confidenceScore": number (0–100),
            "confidenceReasoning": string,
            "assumptionsMade": string[],
            "dataGaps": string[],
            "recommendedHumanReview": boolean
          }

          AI_OUTPUT:
          ${aiOutputContent}
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as AIConfidence;
    } catch (error) {
        console.error("Error validating AI output:", error);
        throw error;
    }
};

// ------------------------------------------------
// 13) COVER LETTER GENERATOR (The Writer)
// ------------------------------------------------
export const generateCoverLetter = async (
  resume: ResumeData, 
  company: string, 
  role: string, 
  motivation: string, 
  context: string
): Promise<string> => {
    try {
        const prompt = `
          You are an expert Professional Writer and Career Coach.
          Generate a tailored, high-impact cover letter.

          INPUTS:
          - Target Company: ${company}
          - Target Role: ${role}
          - User Motivation: ${motivation}
          - Referral/Context: ${context}
          - Candidate Resume: ${JSON.stringify(resume)}

          STRICT RULES:
          1. Match the candidate's Resume Archetype (e.g., if technical, be precise; if creative, be expressive).
          2. Use ATS-safe formatting (no complex tables or graphics).
          3. Align with implied job description keywords based on the role title "${role}".
          4. Do NOT simply copy-paste resume bullets. Synthesize them into a narrative.
          5. Keep it concise (under 400 words).
          6. Return ONLY the body of the letter (start with "Dear Hiring Manager," or specific name if provided in context).

          Output plain text.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return text.trim();
    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw error;
    }
};
