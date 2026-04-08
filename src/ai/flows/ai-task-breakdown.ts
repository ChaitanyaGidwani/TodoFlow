'use server';
/**
 * @fileOverview An AI agent that breaks down a complex to-do item into smaller, actionable sub-tasks.
 *
 * - aiTaskBreakdown - A function that handles the task breakdown process.
 * - AITaskBreakdownInput - The input type for the aiTaskBreakdown function.
 * - AITaskBreakdownOutput - The return type for the aiTaskBreakdown function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AITaskBreakdownInputSchema = z
  .string()
  .describe('A complex to-do item description.');
export type AITaskBreakdownInput = z.infer<typeof AITaskBreakdownInputSchema>;

const AITaskBreakdownOutputSchema = z
  .array(z.string())
  .describe('An array of smaller, actionable sub-tasks derived from the input.');
export type AITaskBreakdownOutput = z.infer<typeof AITaskBreakdownOutputSchema>;

export async function aiTaskBreakdown(
  input: AITaskBreakdownInput
): Promise<AITaskBreakdownOutput> {
  return aiTaskBreakdownFlow(input);
}

const aiTaskBreakdownPrompt = ai.definePrompt({
  name: 'aiTaskBreakdownPrompt',
  input: { schema: AITaskBreakdownInputSchema },
  output: { schema: AITaskBreakdownOutputSchema },
  prompt: `You are a helpful task management assistant. Your goal is to break down a given complex to-do item into a list of smaller, actionable sub-tasks.
Each sub-task should be a distinct, manageable step towards completing the main task.

Here is the complex to-do item:

{{{this}}}

Please respond with a JSON array of strings, where each string is a sub-task. Do not include any other text.
`,
});

const aiTaskBreakdownFlow = ai.defineFlow(
  {
    name: 'aiTaskBreakdownFlow',
    inputSchema: AITaskBreakdownInputSchema,
    outputSchema: AITaskBreakdownOutputSchema,
  },
  async (input) => {
    const { output } = await aiTaskBreakdownPrompt(input);
    return output!;
  }
);
