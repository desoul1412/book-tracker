/**
 * Vitest global setup file.
 *
 * Runs before every test file (configured via vitest.config.ts → test.setupFiles).
 *
 * What this does
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. Imports @testing-library/jest-dom which extends Vitest's `expect` with
 *    DOM-specific matchers:
 *      • toBeInTheDocument()
 *      • toHaveTextContent(…)
 *      • toBeVisible()
 *      • toBeDisabled()
 *      • toHaveClass(…)
 *      … and more — see https://github.com/testing-library/jest-dom
 *
 * Add project-wide mocks or global test utilities here (e.g. mock next/router,
 * mock next/navigation, initialise MSW request handlers, etc.).
 */

import "@testing-library/jest-dom";
