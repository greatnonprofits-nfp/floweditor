/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { getActionUUID } from 'components/flow/actions/helpers';
import { SendEmailFormState, Attachment } from 'components/flow/actions/sendemail/SendEmailForm';
import { Types } from 'config/interfaces';
import { SendEmail } from 'flowTypes';
import { NodeEditorSettings } from 'store/nodeEditor';

export const initializeForm = (settings: NodeEditorSettings): SendEmailFormState => {
  if (settings.originalAction && settings.originalAction.type === Types.send_email) {
    const action = settings.originalAction as SendEmail;
    const attachments: Attachment[] = [];
    (action.attachments || []).forEach((attachmentString: string) => {
      const splitPoint = attachmentString.indexOf(':');

      const type = attachmentString.substring(0, splitPoint);
      const attachment = {
        type,
        url: attachmentString.substring(splitPoint + 1),
        uploaded: type.indexOf('/') > -1
      };

      attachments.push(attachment);
    });
    return {
      body: { value: action.body },
      subject: { value: action.subject },
      recipients: { value: action.addresses },
      attachments: attachments,
      valid: true
    };
  }

  return {
    body: { value: '' },
    subject: { value: '' },
    recipients: { value: [] },
    attachments: [],
    valid: true
  };
};

export const stateToAction = (
  settings: NodeEditorSettings,
  formState: SendEmailFormState
): SendEmail => {
  const attachments = formState.attachments
    .filter((attachment: Attachment) => attachment.url.trim().length > 0)
    .map((attachment: Attachment) => `${attachment.type}:${attachment.url}`);
  return {
    attachments,
    addresses: formState.recipients.value,
    subject: formState.subject.value,
    body: formState.body.value,
    type: Types.send_email,
    uuid: getActionUUID(settings, Types.send_email)
  };
};
