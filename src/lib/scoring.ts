/** Returns time-based score (0-100) based on how early submission was made */
export function getSubmissionTimeScore(submittedAt: Date, dueDate: Date): number {
  const msBeforeDeadline = dueDate.getTime() - submittedAt.getTime();
  const days = msBeforeDeadline / (1000 * 60 * 60 * 24);
  if (days < 0) return 0;    // Late
  if (days >= 3) return 100;
  if (days >= 2) return 60;
  if (days >= 1) return 30;
  return 15; // Same day
}

export function computeScores(
  evalScore: number,
  submittedAt: Date,
  dueDate: Date | null | undefined
): { submissionTimeScore: number; compoundScore: number } {
  // Rule: evalScore <= 40 → no time bonus, compound = evalScore
  if (evalScore <= 40) {
    return { submissionTimeScore: 0, compoundScore: evalScore };
  }

  const isLate = dueDate ? submittedAt > dueDate : false;

  if (isLate || !dueDate) {
    // Late: cap evalScore at 70, timeScore = 0
    const capped = Math.min(evalScore, 70);
    return {
      submissionTimeScore: 0,
      compoundScore: Math.round(capped * 0.8 * 10) / 10,
    };
  }

  const timeScore = getSubmissionTimeScore(submittedAt, dueDate);
  const compound = evalScore * 0.8 + timeScore * 0.2;
  return {
    submissionTimeScore: timeScore,
    compoundScore: Math.round(compound * 10) / 10,
  };
}
