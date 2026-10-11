import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Screens that load several resources can take over the 1s default on a busy machine or CI runner
// when many test files run in parallel; waiting longer makes that load-only flake go away.
configure({ asyncUtilTimeout: 4000 });
