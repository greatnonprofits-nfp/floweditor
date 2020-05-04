import * as React from 'react';
import { SendEmail } from 'flowTypes';
import styles from './SendEmail.module.scss';

const SendEmailComp: React.SFC<SendEmail> = (action: SendEmail): JSX.Element => {
  return (
    <>
      <div>{action.subject}?</div>
      <div>
        {action.attachments && action.attachments.length > 0 ? (
          <div className={`${styles.attachment} fe-paperclip`} />
        ) : null}
      </div>
    </>
  );
};

export default SendEmailComp;
