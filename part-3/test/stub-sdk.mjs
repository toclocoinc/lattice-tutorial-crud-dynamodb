// Resolve hook: replaces the AWS SDK with in-memory stubs so the unit test
// needs no install and can never reach AWS.
export async function resolve(specifier, context, next) {
  if (specifier === '@aws-sdk/client-dynamodb' || specifier === '@aws-sdk/lib-dynamodb') {
    return { url: new URL(`./stub-${specifier.split('/')[1]}.mjs`, import.meta.url).href, shortCircuit: true };
  }
  return next(specifier, context);
}
