import { BadRequestException } from '@nestjs/common';

/**
 * Validates a "full list" payload ({ id? }[]) against the existing children of a parent:
 * every id must belong to the parent and appear only once.
 * Returns the ids that are no longer in the list (to delete).
 */
export function diffChildren(
  existingIds: string[],
  incoming: { id?: string }[],
  label: string,
): string[] {
  const known = new Set(existingIds);
  const seen = new Set<string>();

  for (const item of incoming) {
    if (!item.id) continue;
    if (!known.has(item.id)) throw new BadRequestException(`Unknown ${label} id: ${item.id}`);
    if (seen.has(item.id)) throw new BadRequestException(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }

  return existingIds.filter((id) => !seen.has(id));
}
