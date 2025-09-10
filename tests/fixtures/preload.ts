try {
  await import("bun-match-svg")
} catch {
  // bun-match-svg is only needed for SVG snapshot comparisons. Some
  // environments (like this test runner) may not have the dependency
  // installed, so we ignore the error and continue without the matcher.
}
import "lib/register-catalogue"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}
