/**
 * Global test setup — runs before every test file.
 *
 * Imports @testing-library/jest-dom to extend Vitest's expect with DOM-aware
 * matchers such as:
 *   - toBeInTheDocument()
 *   - toHaveTextContent()
 *   - toBeVisible()
 *   - toHaveClass()
 *   - toBeDisabled()
 *
 * This file is referenced in vitest.config.ts → test.setupFiles.
 */
import "@testing-library/jest-dom";
