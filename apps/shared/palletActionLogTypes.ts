export type PalletActionType =
  | 'CREATE_POSITION'
  | 'UPDATE_POSITION_STATUS'
  | 'DELETE_POSITION'
  | 'ADD_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT';

export interface PalletActionLogRecord {
  id: number;
  palletProductId: number | null;
  palletPositionId: number | null;
  actionType: PalletActionType;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  userId: number;
  username: string;
  realname: string;
  idEmpresa: number;
  timestamp: string; // ISO string
}
