// FSRS (Free Spaced Repetition Scheduler) Algorithm Implementation
// Based on FSRS-5 with default parameters
// Reference: https://github.com/open-spaced-repetition/fsrs4anki

import type { UserAnkiCard } from '@/types';

// FSRS-5 Default Parameters (w[0] to w[18])
// These are the optimized default parameters from the FSRS paper
const FSRS_PARAMS = {
  w0: 0.40255,   // Initial stability for Again (grade 1)
  w1: 1.18385,   // Initial stability for Hard (grade 2)
  w2: 3.173,     // Initial stability for Good (grade 3)
  w3: 15.69105,  // Initial stability for Easy (grade 4)
  w4: 7.1949,    // Initial difficulty parameter
  w5: 0.5345,    // Difficulty adjustment
  w6: 1.4604,    // Difficulty delta for grade
  w7: 0.0046,    // Difficulty mean reversion
  w8: 1.54575,   // Stability increase base
  w9: 0.1192,    // Stability decay exponent
  w10: 1.01925,  // Retrievability impact
  w11: 1.9395,   // Post-lapse stability factor
  w12: 0.11,     // Post-lapse difficulty exponent
  w13: 0.29605,  // Post-lapse stability exponent
  w14: 2.2698,   // Post-lapse retrievability impact
  w15: 0.2315,   // Hard penalty multiplier
  w16: 2.9898,   // Easy bonus multiplier
  w17: 0.51655,  // Same-day stability factor
  w18: 0.6621,   // Same-day grade adjustment
};

// Forgetting curve constants
const FACTOR = 19 / 81;  // ≈ 0.234567
const DECAY = -0.5;

// Desired retention (90% = 0.9 is the default)
const DESIRED_RETENTION = 0.9;

/**
 * Calculate retrievability (R) - probability of recalling the card
 * R = (1 + FACTOR * t/S)^DECAY
 * where t = elapsed days, S = stability
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY);
}

/**
 * Calculate interval based on desired retention
 * I = (S / FACTOR) * (R^(1/DECAY) - 1)
 * where R = desired retention
 */
export function calculateInterval(stability: number, desiredRetention: number = DESIRED_RETENTION): number {
  // Safety checks for NaN or invalid values
  if (!stability || stability <= 0 || isNaN(stability)) return 1;
  if (!desiredRetention || desiredRetention <= 0 || desiredRetention > 1) return 1;
  
  const interval = (stability / FACTOR) * (Math.pow(desiredRetention, 1 / DECAY) - 1);
  
  // Final safety check
  if (isNaN(interval) || !isFinite(interval)) return 1;
  
  return Math.max(1, Math.round(interval));
}

/**
 * Calculate initial difficulty based on first rating
 * D = w4 - exp(w5 * (grade - 1)) + 1
 * Constrained to [1, 10]
 */
export function calculateInitialDifficulty(grade: number): number {
  const { w4, w5 } = FSRS_PARAMS;
  const difficulty = w4 - Math.exp(w5 * (grade - 1)) + 1;
  return Math.max(1, Math.min(10, difficulty));
}

/**
 * Calculate initial stability based on first rating
 * S = w[grade - 1] for grades 1-4
 */
export function calculateInitialStability(grade: number): number {
  switch (grade) {
    case 1: return FSRS_PARAMS.w0; // Again
    case 2: return FSRS_PARAMS.w1; // Hard
    case 3: return FSRS_PARAMS.w2; // Good
    case 4: return FSRS_PARAMS.w3; // Easy
    default: return FSRS_PARAMS.w2; // Default to Good
  }
}

/**
 * Update difficulty after a review
 * D' = D - w6 * (grade - 3) * ((10 - D) / 9)
 * D'' = w7 * initialDifficulty(4) + (1 - w7) * D'
 * Constrained to [1, 10]
 */
export function updateDifficulty(currentDifficulty: number, grade: number): number {
  const { w6, w7 } = FSRS_PARAMS;
  
  // Calculate difficulty delta
  const deltaD = -w6 * (grade - 3);
  const dPrime = currentDifficulty + deltaD * ((10 - currentDifficulty) / 9);
  
  // Apply mean reversion towards initial difficulty for Easy (grade 4)
  const dTarget = calculateInitialDifficulty(4);
  const newDifficulty = w7 * dTarget + (1 - w7) * dPrime;
  
  return Math.max(1, Math.min(10, newDifficulty));
}

/**
 * Calculate stability increase multiplier
 * inc = 1 + w15 * w16 * exp(w8) * (11 - D) * S^(-w9) * (exp(w10 * (1 - R)) - 1)
 * w15 is applied for Hard (grade 2)
 * w16 is applied for Easy (grade 4)
 */
export function calculateStabilityIncrease(
  difficulty: number,
  stability: number,
  retrievability: number,
  grade: number
): number {
  const { w8, w9, w10, w15, w16 } = FSRS_PARAMS;
  
  // Apply hard penalty or easy bonus
  const hardPenalty = grade === 2 ? w15 : 1;
  const easyBonus = grade === 4 ? w16 : 1;
  
  const increase = 1 + 
    hardPenalty * 
    easyBonus * 
    Math.exp(w8) * 
    (11 - difficulty) * 
    Math.pow(stability, -w9) * 
    (Math.exp(w10 * (1 - retrievability)) - 1);
  
  return increase;
}

/**
 * Update stability after a successful review (grade >= 3)
 * S' = S * inc
 */
export function updateStabilitySuccess(
  currentStability: number,
  difficulty: number,
  retrievability: number,
  grade: number
): number {
  const increase = calculateStabilityIncrease(difficulty, currentStability, retrievability, grade);
  return currentStability * increase;
}

/**
 * Update stability after a failed review (grade = 1 - Again)
 * S' = w11 * D^(-w12) * ((S + 1)^w13 - 1) * exp(w14 * (1 - R))
 * Constrained to be less than current stability
 */
export function updateStabilityFailure(
  currentStability: number,
  difficulty: number,
  retrievability: number
): number {
  const { w11, w12, w13, w14 } = FSRS_PARAMS;
  
  const newStability = w11 * 
    Math.pow(difficulty, -w12) * 
    (Math.pow(currentStability + 1, w13) - 1) * 
    Math.exp(w14 * (1 - retrievability));
  
  // Ensure new stability is less than current stability
  return Math.min(newStability, currentStability);
}

/**
 * Apply fuzz to interval to prevent cards from clustering
 * Returns interval with random variation between 0.95x and 1.05x
 */
export function applyFuzz(interval: number): number {
  const fuzz = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
  return Math.round(interval * fuzz);
}

/**
 * Main FSRS review function
 * Updates card's stability and difficulty based on the rating
 * Returns the new interval in days
 */
export function fsrsReview(
  card: UserAnkiCard,
  grade: number, // 1=Again, 2=Hard, 3=Good, 4=Easy
  elapsedDays: number = 0
): { 
  stability: number; 
  difficulty: number; 
  interval: number;
  retrievability: number;
} {
  // Get stability and difficulty with fallback for old cards
  const cardStability = card.stability ?? 0;
  const cardDifficulty = card.difficulty ?? 5;
  
  // For new cards or cards without stability, initialize with first rating values
  if (card.status === 'new' || cardStability === 0 || !card.stability) {
    const stability = calculateInitialStability(grade);
    const difficulty = calculateInitialDifficulty(grade);
    const interval = calculateInterval(stability);
    return { stability, difficulty, interval, retrievability: 1 };
  }
  
  // Calculate current retrievability
  const retrievability = calculateRetrievability(elapsedDays, cardStability);
  
  // Update difficulty
  const newDifficulty = updateDifficulty(cardDifficulty, grade);
  
  // Update stability based on grade
  let newStability: number;
  if (grade === 1) {
    // Again - card was forgotten
    newStability = updateStabilityFailure(cardStability, newDifficulty, retrievability);
  } else {
    // Hard, Good, or Easy - successful recall
    newStability = updateStabilitySuccess(cardStability, newDifficulty, retrievability, grade);
  }
  
  // Calculate new interval
  const interval = applyFuzz(calculateInterval(newStability));
  
  return {
    stability: newStability,
    difficulty: newDifficulty,
    interval,
    retrievability
  };
}

/**
 * Get interval display text for a given grade
 * Shows what the interval would be if rated with this grade
 */
export function getIntervalTextForGrade(
  card: UserAnkiCard,
  grade: number,
  elapsedDays: number = 0
): string {
  // Get stability with fallback for old cards
  const cardStability = card.stability ?? 0;
  
  // For new cards or cards without stability
  if (card.status === 'new' || cardStability === 0 || !card.stability) {
    const stability = calculateInitialStability(grade);
    const interval = calculateInterval(stability);
    return formatInterval(interval);
  }
  
  // Calculate what the interval would be
  const result = fsrsReview(card, grade, elapsedDays);
  return formatInterval(result.interval);
}

/**
 * Format interval number to display text
 */
function formatInterval(interval: number): string {
  // Safety check for NaN or invalid values
  if (!interval || isNaN(interval) || !isFinite(interval)) {
    return '1d';
  }
  
  if (interval < 1) {
    return '<1m';
  } else if (interval === 1) {
    return '1d';
  } else if (interval < 30) {
    return `${Math.round(interval)}d`;
  } else if (interval < 365) {
    return `${Math.round(interval / 30)}mo`;
  } else {
    return `${Math.round(interval / 365)}y`;
  }
}

/**
 * Get the status of a card based on its stability
 */
export function getCardStatusFromStability(stability: number, reviewCount: number): UserAnkiCard['status'] {
  if (reviewCount === 0) return 'new';
  if (stability < 7) return 'learning';
  if (stability < 21) return 'review';
  return 'mastered';
}
