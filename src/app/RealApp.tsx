import React from 'react';
import { useFirestoreStore } from './store/useFirestoreStore';
import { AppShell } from './AppShell';

interface Props {
  onBackToStart: () => void;
}

export default function RealApp({ onBackToStart }: Props) {
  const store = useFirestoreStore();
  return <AppShell store={store} mode="real" onBackToStart={onBackToStart} />;
}
