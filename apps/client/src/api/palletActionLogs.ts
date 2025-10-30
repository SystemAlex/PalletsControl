import { ApiError, fetchJson } from '../utils/api';
import { PalletActionLogRecord } from '../../../shared/types';

export interface FetchPalletActionLogsParams {
  limit?: number;
  offset?: number;
  search?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
}

export const fetchPalletActionLogs = async (
  params: FetchPalletActionLogsParams,
): Promise<{ logs: PalletActionLogRecord[]; totalCount: number }> => {
  const query = new URLSearchParams();
  if (params.limit) query.append('limit', String(params.limit));
  if (params.offset) query.append('offset', String(params.offset));
  if (params.search) query.append('search', params.search);
  if (params.actionType) query.append('actionType', params.actionType);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const url = `/api/pallet-action-logs?${query.toString()}`;
  const result = await fetchJson<{ logs: PalletActionLogRecord[]; totalCount: number }>(url);
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};
