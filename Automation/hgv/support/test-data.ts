export type GeneratedCase = {
  id: string;
  category: string;
  name: string;
  fieldId: string | null;
  fieldName?: string;
  value: unknown;
  expected: string;
};

export function casesByCategory(blueprint: { testCases: readonly GeneratedCase[] }, category: string): GeneratedCase[] {
  return blueprint.testCases.filter((testCase) => testCase.category === category);
}

export function fieldById(blueprint: { elements: readonly any[] }, fieldId: string | null): any {
  if (!fieldId) throw new Error('Test case has no fieldId');
  const field = blueprint.elements.find((item) => item.id === fieldId);
  if (!field) throw new Error('Unknown fieldId: ' + fieldId);
  return field;
}
