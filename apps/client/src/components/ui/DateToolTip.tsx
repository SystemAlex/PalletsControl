import React from 'react';
import { makeStyles, Text, Tooltip } from '@fluentui/react-components';
import { formatDateTime, formatRelativeTime } from '../../utils/helper';
import { format } from 'date-fns';

const useStyles = makeStyles({
  full: {
    textWrap: 'nowrap',
    whiteSpace: 'nowrap',
    position: 'absolute',
    zIndex: '10',
    top: '0px',
    left: '0px',
    height: '0px',
    width: '0px',
  },
});

export const DateToolTip = ({ text, isDateOnly }: { text: string; isDateOnly?: boolean }) => {
  let toolTipDateTime = formatDateTime(text);
  if (isDateOnly) {
    toolTipDateTime = format(new Date(text), 'dd/MM/yyyy');
    text = text + 'T00:00:00';
  }
  const textDateTime = formatRelativeTime(text);
  const onlyText = toolTipDateTime === textDateTime;
  const [ref, setRef] = React.useState<HTMLElement | null>();
  const styles = useStyles();

  return onlyText ? (
    <Text>{textDateTime}</Text>
  ) : (
    <>
      <Tooltip content={toolTipDateTime} relationship="label" mountNode={ref} positioning="below">
        <Text>{textDateTime}</Text>
      </Tooltip>
      <span className={styles.full} ref={setRef} />
    </>
  );
};
