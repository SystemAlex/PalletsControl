import React from 'react';
import { Badge } from '@fluentui/react-components';

export const StatusBadge = ({ success }: { success: boolean }) => {
  return success ? (
    <Badge shape="rounded" color="success">
      Exitoso
    </Badge>
  ) : (
    <Badge shape="rounded" color="danger">
      Fallido
    </Badge>
  );
};
