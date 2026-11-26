import { type Npc } from '@guild/models/npc.model';
import { type Relationship } from '@guild/models/relationship.model';
import { type Session } from '@guild/models/session.model';

function relationshipSessionIds(relationship: Relationship): ReadonlyArray<string> {
  return [
    ...(relationship.sharedEvents ?? []),
    ...(relationship.quotes ?? []),
    ...(relationship.evolution ?? []),
    ...(relationship.history ?? []),
    ...(relationship.promiseHistory ?? []),
    ...(relationship.sharedMemories ?? []),
  ].map((entry) => entry.sessionId);
}

/**
 * Chooses the latest encountered NPCs from authored relationship evidence.
 * Manifest order breaks ties within one session and is the legacy fallback.
 */
export function latestNpcIds(
  npcs: ReadonlyArray<Npc>,
  relationships: ReadonlyArray<Relationship>,
  sessions: ReadonlyArray<Session>,
  limit = 2,
): ReadonlyArray<string> {
  if (limit <= 0) return [];
  const sessionOrder = new Map(
    [...sessions]
      .sort((a, b) => a.sessionNumber - b.sessionNumber || a.date.localeCompare(b.date))
      .map((session, index) => [session.id, index]),
  );

  return npcs
    .map((npc, npcOrder) => {
      const latestSession = Math.max(
        -1,
        ...relationships
          .filter(
            (relationship) => relationship.sourceId === npc.id || relationship.targetId === npc.id,
          )
          .flatMap(relationshipSessionIds)
          .map((sessionId) => sessionOrder.get(sessionId) ?? -1),
      );
      return { id: npc.id, latestSession, npcOrder };
    })
    .sort((a, b) => a.latestSession - b.latestSession || a.npcOrder - b.npcOrder)
    .slice(-limit)
    .map(({ id }) => id);
}
