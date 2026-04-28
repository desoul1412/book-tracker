/**
 * Ambient type augmentation for Vitest globals + jest-dom matchers.
 *
 * Because vitest.config.ts sets `globals: true`, the test globals
 * (describe, it, expect, vi, …) are injected without imports.
 * This file ensures TypeScript resolves their types without an explicit
 * `import { describe } from "vitest"` in every test file.
 */

/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
