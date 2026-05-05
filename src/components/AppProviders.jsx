'use client';

import { WorkspaceProvider } from '../context/WorkspaceContext';

export default function AppProviders({ children }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
