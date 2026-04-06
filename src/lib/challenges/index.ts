import type { Challenge } from '@/types/challenge';
import questionBank from '../../../data/datav3.cleaned.json';

type QuestionBankFile = { questions: Challenge[] };

/** All challenges from `data/datav3.cleaned.json` (`{ "questions": [...] }`). */
export const challenges: Challenge[] = (questionBank as QuestionBankFile).questions;

/** Get challenge by ID */
export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
