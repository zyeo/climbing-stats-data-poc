import { type Athlete } from "../schemas/athlete.js";
import { type BoulderProblem } from "../schemas/boulderProblem.js";
import { type BoulderProblemResult } from "../schemas/boulderProblemResult.js";
import { type Competition } from "../schemas/competition.js";
import { type Event } from "../schemas/event.js";
import { type Result } from "../schemas/result.js";
import { type Round } from "../schemas/round.js";
import { type RoundResult } from "../schemas/roundResult.js";
import { type IfscParsedEventMetadata, type IfscParsedEventResult } from "../sources/ifsc-results/parseEventJson.js";
import { normalizeAthlete } from "./normalizeAthlete.js";
import { normalizeBoulderProblem } from "./normalizeBoulderProblem.js";
import { normalizeBoulderProblemResult } from "./normalizeBoulderProblemResult.js";
import { normalizeCompetition } from "./normalizeCompetition.js";
import { normalizeEvent } from "./normalizeEvent.js";
import { normalizeResult } from "./normalizeResult.js";
import { normalizeRound } from "./normalizeRound.js";
import { normalizeRoundResult } from "./normalizeRoundResult.js";

export interface NormalizeIfscEventResultInput {
  metadata: IfscParsedEventMetadata;
  result: IfscParsedEventResult;
  metadataSourceUrl: string;
  resultSourceUrl: string;
}

export interface NormalizedIfscEventResult {
  competition: Competition;
  event: Event;
  rounds: Round[];
  boulderProblems: BoulderProblem[];
  athletes: Athlete[];
  results: Result[];
  roundResults: RoundResult[];
  boulderProblemResults: BoulderProblemResult[];
}

function lastAvailableScore(rounds: Array<{ score?: string }>): string | undefined {
  return [...rounds].reverse().find((round) => round.score)?.score;
}

function boulderProblemKey(roundId: string, sourceRouteId?: number, routeName?: string): string {
  return [roundId, sourceRouteId ?? "", routeName ?? ""].join(":");
}

export function normalizeIfscBoulderingEventResult(input: NormalizeIfscEventResultInput): NormalizedIfscEventResult {
  if (input.result.discipline !== "boulder") {
    throw new Error(`Only bouldering event results are supported. Received discipline: ${input.result.discipline}`);
  }

  const competition = normalizeCompetition({
    name: input.metadata.name,
    season: input.metadata.localStartDate ? Number(input.metadata.localStartDate.slice(0, 4)) : undefined,
    location: input.metadata.location,
    sourceUrl: input.metadataSourceUrl,
    sourceCompetitionId: String(input.metadata.sourceEventId)
  });
  const event = normalizeEvent({
    name: input.result.disciplineCategory,
    competitionId: competition.id,
    discipline: input.result.discipline,
    category: input.result.category,
    sourceUrl: input.resultSourceUrl,
    sourceEventId: String(input.metadata.sourceEventId),
    sourceCompetitionId: String(input.metadata.sourceEventId)
  });
  const rounds = input.result.categoryRounds.map((round, index) =>
    normalizeRound({
      eventId: event.id,
      name: round.name,
      order: index,
      sourceUrl: round.resultUrl ? `https://ifsc.results.info${round.resultUrl}` : input.resultSourceUrl,
      sourceCategoryRoundId: String(round.sourceCategoryRoundId)
    })
  );
  const roundBySourceId = new Map(input.result.categoryRounds.map((round, index) => [round.sourceCategoryRoundId, rounds[index]]));
  const athletes = input.result.rankings.map((ranking) =>
    normalizeAthlete({
      name: ranking.name,
      country: ranking.country,
      sourceUrl: input.resultSourceUrl,
      sourceAthleteId: String(ranking.sourceAthleteId)
    })
  );
  const athleteBySourceId = new Map(input.result.rankings.map((ranking, index) => [ranking.sourceAthleteId, athletes[index]]));
  const results = input.result.rankings.map((ranking) => {
    const athlete = athleteBySourceId.get(ranking.sourceAthleteId);

    if (!athlete) {
      throw new Error(`Missing normalized athlete for source athlete ${ranking.sourceAthleteId}.`);
    }

    return normalizeResult({
      eventId: event.id,
      athleteId: athlete.id,
      rank: ranking.rank,
      score: lastAvailableScore(ranking.rounds),
      sourceUrl: input.resultSourceUrl,
      sourceEventId: String(input.metadata.sourceEventId),
      sourceAthleteId: String(ranking.sourceAthleteId)
    });
  });
  const resultByAthleteId = new Map(results.map((result) => [result.athleteId, result]));
  const boulderProblems: BoulderProblem[] = [];
  const boulderProblemByKey = new Map<string, BoulderProblem>();
  const roundResults: RoundResult[] = [];
  const boulderProblemResults: BoulderProblemResult[] = [];

  for (const ranking of input.result.rankings) {
    const athlete = athleteBySourceId.get(ranking.sourceAthleteId);

    if (!athlete) {
      throw new Error(`Missing normalized athlete for source athlete ${ranking.sourceAthleteId}.`);
    }

    const result = resultByAthleteId.get(athlete.id);

    if (!result) {
      throw new Error(`Missing normalized result for source athlete ${ranking.sourceAthleteId}.`);
    }

    for (const sourceRound of ranking.rounds) {
      const round = roundBySourceId.get(sourceRound.sourceCategoryRoundId);

      if (!round) {
        throw new Error(`Missing normalized round for source category round ${sourceRound.sourceCategoryRoundId}.`);
      }

      const roundResult = normalizeRoundResult({
        resultId: result.id,
        eventId: event.id,
        roundId: round.id,
        athleteId: athlete.id,
        rank: sourceRound.rank,
        score: sourceRound.score,
        startingGroup: sourceRound.startingGroup,
        startOrder: sourceRound.startOrder,
        sourceUrl: input.resultSourceUrl,
        sourceCategoryRoundId: String(sourceRound.sourceCategoryRoundId)
      });
      roundResults.push(roundResult);

      for (const ascent of sourceRound.ascents) {
        const key = boulderProblemKey(round.id, ascent.sourceRouteId, ascent.routeName);
        let boulderProblem = boulderProblemByKey.get(key);

        if (!boulderProblem) {
          boulderProblem = normalizeBoulderProblem({
            eventId: event.id,
            roundId: round.id,
            sourceCategoryRoundId: String(sourceRound.sourceCategoryRoundId),
            sourceRouteId: ascent.sourceRouteId ? String(ascent.sourceRouteId) : undefined,
            routeName: ascent.routeName,
            sourceUrl: input.resultSourceUrl
          });
          boulderProblems.push(boulderProblem);
          boulderProblemByKey.set(key, boulderProblem);
        }

        boulderProblemResults.push(
          normalizeBoulderProblemResult({
            resultId: result.id,
            boulderProblemId: boulderProblem.id,
            athleteId: athlete.id,
            eventId: event.id,
            roundId: round.id,
            sourceCategoryRoundId: String(sourceRound.sourceCategoryRoundId),
            sourceRouteId: ascent.sourceRouteId ? String(ascent.sourceRouteId) : undefined,
            routeName: ascent.routeName,
            points: ascent.points,
            top: ascent.top,
            topTries: ascent.topTries,
            zone: ascent.zone,
            zoneTries: ascent.zoneTries,
            lowZone: ascent.lowZone,
            lowZoneTries: ascent.lowZoneTries,
            sourceUrl: input.resultSourceUrl
          })
        );
      }
    }
  }

  return {
    competition,
    event,
    rounds,
    boulderProblems,
    athletes,
    results,
    roundResults,
    boulderProblemResults
  };
}
