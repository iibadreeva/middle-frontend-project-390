/** Сообщение Zod-issue по строковому path (`passengers.0.firstName`). */
export function issueAt(
  result: {
    success: false;
    error: { issues: { path: PropertyKey[]; message: string }[] };
  },
  path: string,
): string | undefined {
  return result.error.issues.find((issue) => issue.path.join('.') === path)
    ?.message;
}
