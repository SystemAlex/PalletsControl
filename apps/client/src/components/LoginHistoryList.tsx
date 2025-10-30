import React, { useMemo, useState, useEffect } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Persona,
  Button,
  PresenceBadgeStatus,
  Title3,
  tokens,
  mergeClasses,
  CardFooter,
  CardPreview,
  Divider,
  DialogTitle,
} from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { fetchLoginHistory } from '../api/history';
import { UserRole, LoginRecord } from '../../../shared/types';
import { capitalize, formatDateTime } from '../utils/helper';
import { StatusBadge } from './ui/StatusBadge';
import { SpinnerCustom } from './ui/SpinnerCustom';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const useStyles = makeStyles({
  card: {
    width: '100%',
    padding: '12px 0px',
    maxHeight: '100%',
    gap: '8px',
  },
  title: {
    paddingLeft: '12px',
  },
  roleRow: {
    paddingTop: '8px',
    paddingLeft: '8px',
    backgroundColor: tokens.colorBrandBackground2,
    position: 'sticky',
    top: '0px',
    width: '100%',
    zIndex: 1,
    display: 'block',
    height: 'auto !important',
  },
  rowGrid: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '170px 130px 50px',
    gridTemplateRows: 'repeat(1, 1fr)',
    columnGap: '3px',
    '@media(min-width: 601px) and (max-width: 768px)': {
      gridTemplateColumns: '1fr auto auto',
    },
    '@media(max-width: 600px)': {
      gridTemplateColumns: '1fr auto auto',
    },
  },
  accordionHeader: { '& button': { display: 'grid', gridTemplateColumns: '1fr 28px' } },
  accordionPanel: { overflow: 'auto', maxHeight: '200px !important', marginRight: '0px' },
  accordionRow: {
    paddingBlock: '2px',
    '@media(min-width: 601px) and (max-width: 768px)': {
      paddingRight: '38px',
    },
    '@media(max-width: 600px)': {
      paddingRight: '38px',
    },
  },
  tableContainer: {
    margin: '0px !important',
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 'calc(100% - 76px)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingInline: '16px',
  },
  txtRight: { textAlign: 'right', marginRight: '8px' },
  fitContent: { height: 'fit-content !important' },
  padR: { paddingInline: '4px' },
  fadingTableBody: {
    opacity: 0.7,
    transition: 'opacity 0.2s ease-in-out',
  },
});

interface LoginHistoryListProps {
  activeUsernames: Set<string>;
  handleApiError: (error: unknown) => void;
  searchQuery: string;
}

export default function LoginHistoryList({
  activeUsernames,
  handleApiError,
  searchQuery,
}: LoginHistoryListProps) {
  const styles = useStyles();
  const [page, setPage] = useState(1);
  const limit = 500; // Keep client limit at 500 to fetch enough records for multiple users

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    error: historyError,
  } = useQuery<{ history: LoginRecord[]; totalCount: number }, Error>({
    queryKey: ['loginHistory', page, searchQuery],
    queryFn: async () => {
      try {
        return await fetchLoginHistory(page, limit, searchQuery);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const showHistorySpinner = useDelayedLoading(isLoadingHistory, 300);

  const history = historyData?.history || [];
  const totalCount = historyData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const groupedHistoryByRoleAndUser = useMemo(() => {
    if (!history || history.length === 0) return [];

    const groupedByRole = new Map<string, Map<string, LoginRecord[]>>();

    history.forEach((record) => {
      if (record.role && record.username) {
        if (!groupedByRole.has(record.role)) {
          groupedByRole.set(record.role, new Map<string, LoginRecord[]>());
        }
        const userMap = groupedByRole.get(record.role)!;
        if (!userMap.has(record.username)) {
          userMap.set(record.username, []);
        }
        userMap.get(record.username)!.push(record);
      }
    });

    return Array.from(groupedByRole.entries()).map(([role, userMap]) => ({
      role: role as UserRole,
      userGroups: Array.from(userMap.entries()).map(([username, records]) => ({
        username,
        records,
      })),
    }));
  }, [history]);

  const getUserPresence = (userRecord: LoginRecord) => {
    if (!userRecord.isActive)
      return { status: 'offline' as PresenceBadgeStatus, outOfOffice: true };
    if (userRecord.username && activeUsernames.has(userRecord.username))
      return { status: 'available' as PresenceBadgeStatus };
    return { status: 'offline' as PresenceBadgeStatus, outOfOffice: true };
  };

  const formatLoginDate = (currentTimestamp: string, previousTimestamp?: string): string => {
    const currentDate = formatDateTime(currentTimestamp);
    const currentDatePart = currentDate.split(' ')[0];

    if (previousTimestamp) {
      const previousDate = formatDateTime(previousTimestamp);
      const previousDatePart = previousDate.split(' ')[0];
      if (currentDatePart === previousDatePart) {
        return currentDate.split(' ')[1];
      }
    }
    return currentDate;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<DialogTitle className={styles.title}>Historial de Inicios de Sesión</DialogTitle>}
      />
      {showHistorySpinner ? (
        <SpinnerCustom text="Cargando historial" />
      ) : historyError ? (
        <Text>{(historyError as Error).message}</Text>
      ) : (
        <CardPreview
          className={mergeClasses(
            styles.tableContainer,
            isFetchingHistory && styles.fadingTableBody,
          )}
        >
          {groupedHistoryByRoleAndUser.map(({ role, userGroups }) => (
            <React.Fragment key={role}>
              <Title3 className={styles.roleRow}>
                {capitalize(role)} ({userGroups.length})
              </Title3>
              <Accordion collapsible className={styles.fitContent}>
                {userGroups.map(({ username, records }) => {
                  return (
                    <AccordionItem key={username} value={username} className={styles.padR}>
                      <AccordionHeader
                        className={styles.accordionHeader}
                        expandIconPosition="end"
                        expandIcon={records.length > 1 ? undefined : null}
                      >
                        <span className={styles.rowGrid}>
                          <Persona
                            name={username}
                            secondaryText={records[0].realname}
                            presence={getUserPresence(records[0])}
                            avatar={{ color: 'colorful', name: records[0].realname || undefined }}
                          />
                          <Text className={styles.txtRight}>
                            Último acceso: <br />
                            {formatLoginDate(records[0].timestamp)}
                          </Text>
                          <StatusBadge success={records[0].success} />
                        </span>
                      </AccordionHeader>
                      {records.length > 1 && (
                        <AccordionPanel className={styles.accordionPanel}>
                          {records.map((record, index) =>
                            index > 0 ? (
                              <React.Fragment key={record.id}>
                                <span className={mergeClasses(styles.rowGrid, styles.accordionRow)}>
                                  <span></span>
                                  <Text className={styles.txtRight}>
                                    {formatLoginDate(
                                      record.timestamp,
                                      records[index - 1].timestamp,
                                    )}
                                  </Text>
                                  <StatusBadge success={record.success} />
                                </span>
                                <Divider />
                              </React.Fragment>
                            ) : null,
                          )}
                        </AccordionPanel>
                      )}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </React.Fragment>
          ))}
        </CardPreview>
      )}
      <CardFooter className={styles.footer}>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <Text>
          Página {page} de {totalPages}
        </Text>
        <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Siguiente
        </Button>
      </CardFooter>
    </Card>
  );
}
