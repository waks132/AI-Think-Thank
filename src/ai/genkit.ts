'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';

const plugins = [
  googleAI(),
  googleCloud(),
];

export const ai = genkit({
  plugins,
  // Set a default model for the entire application.
  // This can be overridden in individual generate calls.
  model: 'googleai/gemini-2.0-flash',
});
