import { rules, PLACEHOLDER_DISCLAIMER } from '@/lib/rules';
import { analysisSchema, extractionSchema, type Analysis, type Extraction } from '@/lib/schemas';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

type TextBlock = { type: 'text'; text: string };
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };
type DocumentBlock = { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };
type ContentBlock = TextBlock | ImageBlock | DocumentBlock;

export class ClaudeError extends Error {}

async function callClaude(system: string, content: ContentBlock[], maxTokens = 4096): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ClaudeError('ANTHROPIC_API_KEY is not configured on the server.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ClaudeError(`Claude API returned ${res.status}: ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (json.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
    .trim();
  if (!text) throw new ClaudeError('Claude returned an empty response.');
  return text;
}

function parseJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new ClaudeError('Model response did not contain JSON.');
  return JSON.parse(text.slice(start, end + 1));
}

function fileBlock(mimeType: string, base64: string): ContentBlock {
  if (mimeType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };
  }
  return { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };
}

const EXTRACTION_SYSTEM = `You are an assistant helping a licensed electrical engineer do a first-pass intake of an electrical safety submission (panel schedules, single-line diagrams, load calculations).

Extract only what is actually visible in the document. Never invent values. If something is illegible or absent, leave the field as an empty string, and add a short note to "unreadableItems" (illegible) or "missingDocuments" (absent).

Respond only with valid JSON matching this schema, with no prose and no markdown fences:
{
  "projectDetails": { "projectName": string, "address": string, "occupancyType": string, "submitterName": string, "designer": string, "submissionDate": string },
  "panels": [ { "designation": string, "voltage": string, "phase": string, "mainBreakerAmps": string, "busRatingAmps": string, "spaces": string, "location": string } ],
  "circuits": [ { "circuit": string, "description": string, "breakerAmps": string, "conductorSize": string, "protection": string } ],
  "loadCalculations": { "calculatedLoad": string, "serviceSize": string, "method": string, "notes": string },
  "documentsPresent": [string],
  "missingDocuments": [string],
  "unreadableItems": [string],
  "summary": string
}`;

export async function extractSubmission(args: {
  mimeType: string;
  base64: string;
  projectName: string;
  submitterName: string;
  description: string;
}): Promise<Extraction> {
  const raw = await callClaude(EXTRACTION_SYSTEM, [
    fileBlock(args.mimeType, args.base64),
    {
      type: 'text',
      text: `Submitted project name: ${args.projectName}\nSubmitter: ${args.submitterName}\nProject description from the submitter: ${args.description || '(none provided)'}\n\nExtract the submission data as JSON.`,
    },
  ]);
  return extractionSchema.parse(parseJson(raw));
}

const ANALYSIS_SYSTEM = `You are an assistant performing a first-pass compliance screen of an electrical safety submission for a licensed engineer who makes the final determination.

You are given extracted submission data and a demo rule set. ${PLACEHOLDER_DISCLAIMER}

Evaluate every rule you are given, in the order given. Use "insufficient_data" whenever the extracted data does not contain enough information to judge the rule — do not guess, and do not treat missing information as a failure. Use "fail" only when the extracted data positively indicates a likely non-compliance. Keep each explanation to one or two sentences aimed at an engineer, and put the specific extracted value you relied on in "evidence" (empty string if none).

Respond only with valid JSON matching this schema, with no prose and no markdown fences:
{ "results": [ { "ruleId": string, "status": "pass" | "fail" | "insufficient_data", "explanation": string, "evidence": string } ] }`;

export async function runComplianceCheck(extraction: Extraction): Promise<Analysis> {
  const raw = await callClaude(
    ANALYSIS_SYSTEM,
    [
      {
        type: 'text',
        text: `Demo rule set:\n${JSON.stringify(rules, null, 2)}\n\nExtracted submission data:\n${JSON.stringify(extraction, null, 2)}\n\nEvaluate all ${rules.length} rules and respond with JSON.`,
      },
    ],
    8192,
  );
  return analysisSchema.parse(parseJson(raw));
}
