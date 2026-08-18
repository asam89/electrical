import { z } from 'zod';

export const panelSchema = z.object({
  designation: z.string().default(''),
  voltage: z.string().default(''),
  phase: z.string().default(''),
  mainBreakerAmps: z.string().default(''),
  busRatingAmps: z.string().default(''),
  spaces: z.string().default(''),
  location: z.string().default(''),
});

export const circuitSchema = z.object({
  circuit: z.string().default(''),
  description: z.string().default(''),
  breakerAmps: z.string().default(''),
  conductorSize: z.string().default(''),
  protection: z.string().default(''),
});

export const extractionSchema = z.object({
  projectDetails: z
    .object({
      projectName: z.string().default(''),
      address: z.string().default(''),
      occupancyType: z.string().default(''),
      submitterName: z.string().default(''),
      designer: z.string().default(''),
      submissionDate: z.string().default(''),
    })
    .default({}),
  panels: z.array(panelSchema).default([]),
  circuits: z.array(circuitSchema).default([]),
  loadCalculations: z
    .object({
      calculatedLoad: z.string().default(''),
      serviceSize: z.string().default(''),
      method: z.string().default(''),
      notes: z.string().default(''),
    })
    .default({}),
  documentsPresent: z.array(z.string()).default([]),
  missingDocuments: z.array(z.string()).default([]),
  unreadableItems: z.array(z.string()).default([]),
  summary: z.string().default(''),
});

export type Extraction = z.infer<typeof extractionSchema>;

export const analysisSchema = z.object({
  results: z
    .array(
      z.object({
        ruleId: z.string(),
        status: z.enum(['pass', 'fail', 'insufficient_data']),
        explanation: z.string().default(''),
        evidence: z.string().default(''),
      }),
    )
    .default([]),
});

export type Analysis = z.infer<typeof analysisSchema>;

export const newSubmissionSchema = z.object({
  projectName: z.string().min(1, 'Project name is required').max(200),
  submitterName: z.string().min(1, 'Submitter name is required').max(200),
  submissionDate: z.string().min(1, 'Submission date is required'),
  description: z.string().max(4000).default(''),
});

export const decisionSchema = z.object({
  decision: z.enum(['PENDING', 'CONFIRMED', 'FALSE_POSITIVE', 'WAIVED']),
  note: z.string().max(1000).default(''),
});
