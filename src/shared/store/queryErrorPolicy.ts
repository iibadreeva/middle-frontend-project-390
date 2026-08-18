export type QueryErrorPolicy = { silent: true } | { message: string };

export type QueryErrorExtraOptions = {
  /** Задавайте на каждом endpoint: RTK не умеет сделать поле обязательным. */
  errorPolicy?: QueryErrorPolicy;
};

const policies = new Map<string, QueryErrorPolicy>();

export function registerQueryErrorPolicy(
  endpointName: string,
  policy: QueryErrorPolicy,
): void {
  policies.set(endpointName, policy);
}

export function registerQueryErrorPoliciesFromEndpoints(
  definitions: Record<string, unknown>,
): void {
  for (const [name, definition] of Object.entries(definitions)) {
    const policy = readErrorPolicy(definition);
    if (policy) {
      registerQueryErrorPolicy(name, policy);
    }
  }
}

function readErrorPolicy(definition: unknown): QueryErrorPolicy | undefined {
  if (!definition || typeof definition !== 'object') {
    return undefined;
  }
  if (!('extraOptions' in definition)) {
    return undefined;
  }
  const extra = definition.extraOptions;
  if (!extra || typeof extra !== 'object' || !('errorPolicy' in extra)) {
    return undefined;
  }
  return isQueryErrorPolicy(extra.errorPolicy) ? extra.errorPolicy : undefined;
}

function isQueryErrorPolicy(value: unknown): value is QueryErrorPolicy {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if ('silent' in value && value.silent === true) {
    return true;
  }
  return 'message' in value && typeof value.message === 'string';
}

export function getQueryErrorPolicy(
  endpointName: string,
): QueryErrorPolicy | undefined {
  return policies.get(endpointName);
}

export function isSilentQueryErrorPolicy(
  policy: QueryErrorPolicy | undefined,
): boolean {
  return Boolean(policy && 'silent' in policy && policy.silent);
}

export function queryErrorPolicyMessage(
  policy: QueryErrorPolicy | undefined,
  fallback: string,
): string {
  return policy && 'message' in policy ? policy.message : fallback;
}

/** Только для тестов — не реэкспортируется из store barrel. */
export function resetQueryErrorPolicies(): void {
  policies.clear();
}
