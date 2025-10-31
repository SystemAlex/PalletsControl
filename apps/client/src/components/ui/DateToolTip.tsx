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
  const [ref, setRef] = React.useState<HTMLElement | null>();
  const styles = useStyles();
  let onlyText = false;
  let textDateTime = '';
  let toolTipDateTime = '';

  if (text === '') {
    onlyText = true;
    textDateTime = '';
  } else {
    toolTipDateTime = formatDateTime(text);
    if (isDateOnly) {
      text = text + 'T00:00:00';
      toolTipDateTime = format(new Date(text), 'dd/MM/yyyy');
      textDateTime = formatRelativeTime(text, true);
    } else {
      textDateTime = formatRelativeTime(text, false);
    }
    onlyText = toolTipDateTime === textDateTime;
  }

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
