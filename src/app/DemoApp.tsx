import React from 'react';
import { useDemoStore } from './store/useDemoStore';
import { AppShell } from './AppShell';

interface Props {
  onBackToStart: () => void;
}

export default function DemoApp({ onBackToStart }: Props) {
  const store = useDemoStore();
  return <AppShell store={store} mode="demo" onBackToStart={onBackToStart} />;
}
