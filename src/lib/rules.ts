import rulesJson from '@/data/rules.json';

export type ComplianceRule = {
  id: string;
  title: string;
  citation: string;
  category: string;
  requirement: string;
  appliesTo: string;
};

export const rules: ComplianceRule[] = rulesJson as ComplianceRule[];

export const PLACEHOLDER_DISCLAIMER =
  'Demo rule set only. These rules are illustrative placeholders written for this proof of concept and are NOT verified Canadian Electrical Code text. Every clause reference must be checked against the current CEC / provincial amendments before use on a real submission.';

export function getRule(id: string): ComplianceRule | undefined {
  return rules.find((r) => r.id === id);
}
