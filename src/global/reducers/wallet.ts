import type { GlobalState } from '../types';
import { TransferState } from '../types';

import { selectAccountState, selectCurrentAccountState } from '../selectors';
import { updateAccountState, updateCurrentAccountState } from './misc';

export function updateCurrentTransfer(global: GlobalState, update: Partial<GlobalState['currentTransfer']>) {
  return {
    ...global,
    currentTransfer: {
      ...global.currentTransfer,
      ...update,
    },
  };
}

export function clearCurrentTransfer(global: GlobalState) {
  return {
    ...global,
    currentTransfer: {
      state: TransferState.None,
    },
  };
}

export function updateCurrentSignature(global: GlobalState, update: Partial<GlobalState['currentSignature']>) {
  return {
    ...global,
    currentSignature: {
      ...global.currentSignature,
      ...update,
    },
  } as GlobalState;
}

export function clearCurrentSignature(global: GlobalState) {
  return {
    ...global,
    currentSignature: undefined,
  };
}

export function updateActivitiesIsLoading(global: GlobalState, isLoading: boolean) {
  const { activities } = selectCurrentAccountState(global) || {};

  return updateCurrentAccountState(global, {
    activities: {
      ...activities || { byId: {} },
      isLoading,
    },
  });
}

export function updateActivitiesIsHistoryEndReached(global: GlobalState, isReached: boolean, slug?: string) {
  const { activities } = selectCurrentAccountState(global) || {};

  if (slug) {
    const bySlug = activities?.isHistoryEndReachedBySlug ?? {};

    return updateCurrentAccountState(global, {
      activities: {
        ...activities || { byId: {} },
        isHistoryEndReachedBySlug: {
          ...bySlug,
          [slug]: isReached,
        },
      },
    });
  }

  return updateCurrentAccountState(global, {
    activities: {
      ...activities || { byId: {} },
      isMainHistoryEndReached: isReached,
    },
  });
}

export function updateActivitiesIsLoadingByAccount(global: GlobalState, accountId: string, isLoading: boolean) {
  const { activities } = selectAccountState(global, accountId) || {};

  return updateAccountState(global, accountId, {
    activities: {
      ...activities || { byId: {} },
      isLoading,
    },
  });
}
