import type { Challenge } from '@/types/challenge';
import questionsData from '../../../questions.json';

/** All available challenges loaded from questions.json */
export const challenges: Challenge[] = questionsData as Challenge[];

/** Get challenge by ID */
export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
