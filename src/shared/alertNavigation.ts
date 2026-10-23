import type { Alert } from './model';

export interface AlertDestination {
  targetType: Alert['targetType'];
  resourceId: string;
}

export function openAlertDestination<T>(
  alert: Pick<Alert, 'targetType' | 'sourceId'>,
  openers: { server: (id: string) => T; rack: (id: string) => T },
): T {
  const destination: AlertDestination = { targetType: alert.targetType, resourceId: alert.sourceId };
  return destination.targetType === 'rack'
    ? openers.rack(destination.resourceId)
    : openers.server(destination.resourceId);
}