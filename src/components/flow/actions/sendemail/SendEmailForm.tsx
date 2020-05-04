/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { react as bindCallbacks } from 'auto-bind';
import axios from 'axios';
import Dialog, { ButtonSet, Tab } from 'components/dialog/Dialog';
import { ActionFormProps } from 'components/flow/props';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import TaggingElement from 'components/form/select/tags/TaggingElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import Pill from 'components/pill/Pill';
import TypeList from 'components/nodeeditor/TypeList';
import i18n from 'config/i18n';
import { fakePropType } from 'config/ConfigProvider';
import { getCookie } from 'external';
import mutate from 'immutability-helper';
import * as React from 'react';
import { FormState, mergeForm, StringArrayEntry, StringEntry } from 'store/nodeEditor';
import { shouldRequireIf, validate } from 'store/validators';
import { createUUID } from 'utils';
import { small } from 'utils/reactselect';

import { initializeForm, stateToAction } from './helpers';
import styles from './SendEmailForm.module.scss';
import { renderIssues } from '../helpers';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const MAX_ATTACHMENTS = 3;

const UNSUPPORTED_EMAIL_ATTACHMENTS = [
  'ade',
  'adp',
  'apk',
  'bat',
  'chm',
  'cmd',
  'com',
  'cpl',
  'dll',
  'dmg',
  'exe',
  'hta',
  'ins',
  'isp',
  'jar',
  'js',
  'jse',
  'lib',
  'lnk',
  'mde',
  'msc',
  'msi',
  'msp',
  'mst',
  'nshpif',
  'scr',
  'sct',
  'shb',
  'sys',
  'vb',
  'vbe',
  'vbs',
  'vxd',
  'wsc',
  'wsf',
  'wsh',
  'cab'
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'image', label: 'Image URL' },
  { value: 'audio', label: 'Audio URL' },
  { value: 'video', label: 'Video URL' }
];

const NEW_TYPE_OPTIONS = TYPE_OPTIONS.concat([{ value: 'upload', label: 'Upload Attachment' }]);

const getAttachmentTypeOption = (type: string): SelectOption => {
  return TYPE_OPTIONS.find((option: SelectOption) => option.value === type);
};

export interface Attachment {
  type: string;
  url: string;
  uploaded?: boolean;
}

export interface SendEmailFormState extends FormState {
  recipients: StringArrayEntry;
  subject: StringEntry;
  body: StringEntry;
  attachments: Attachment[];
}

export default class SendEmailForm extends React.Component<ActionFormProps, SendEmailFormState> {
  private filePicker: any;

  constructor(props: ActionFormProps) {
    super(props);

    this.state = initializeForm(this.props.nodeSettings);

    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  public static contextTypes = {
    config: fakePropType
  };

  public handleRecipientsChanged(recipients: string[]): boolean {
    return this.handleUpdate({ recipients });
  }

  public handleSubjectChanged(subject: string): boolean {
    return this.handleUpdate({ subject });
  }

  public handleBodyChanged(body: string): boolean {
    return this.handleUpdate({ body });
  }

  private handleUpdate(
    keys: { recipients?: string[]; subject?: string; body?: string },
    submitting = false
  ): boolean {
    const updates: Partial<SendEmailFormState> = {};

    if (keys.hasOwnProperty('recipients')) {
      updates.recipients = validate('Recipients', keys.recipients!, [shouldRequireIf(submitting)]);
    }

    if (keys.hasOwnProperty('subject')) {
      updates.subject = validate('Subject', keys.subject!, [shouldRequireIf(submitting)]);
    }

    if (keys.hasOwnProperty('body')) {
      updates.body = validate('Body', keys.body!, [shouldRequireIf(submitting)]);
    }

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  public handleSave(): void {
    // validate in case they never updated an empty field
    const valid = this.handleUpdate(
      {
        recipients: this.state.recipients.value,
        subject: this.state.subject.value,
        body: this.state.body.value
      },
      true
    );

    if (valid) {
      this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));

      // notify our modal we are done
      this.props.onClose(false);
    }
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: i18n.t('buttons.ok', 'Ok'), onClick: this.handleSave },
      secondary: {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => this.props.onClose(true)
      }
    };
  }

  public handleCheckValid(value: string): boolean {
    return EMAIL_PATTERN.test(value) || value.startsWith('@');
  }

  public renderAttachments(): JSX.Element {
    const attachments = this.state.attachments.map((attachment, index: number) =>
      attachment.uploaded
        ? this.renderUpload(index, attachment)
        : this.renderAttachment(index, attachment)
    );

    const emptyOption =
      this.state.attachments.length < MAX_ATTACHMENTS
        ? this.renderAttachment(-1, { url: '', type: '' })
        : null;
    return (
      <>
        <p>
          {i18n.t(
            'forms.send_msg.summary',
            'Add an attachment to each message. The attachment can be a file you upload or a dynamic URL using expressions and variables from your Flow.',
            { count: MAX_ATTACHMENTS }
          )}
        </p>
        {attachments}
        {emptyOption}
        <input
          style={{
            display: 'none'
          }}
          ref={ele => {
            this.filePicker = ele;
          }}
          type="file"
          onChange={e => this.handleUploadFile(e.target.files)}
        />
      </>
    );
  }

  private renderUpload(index: number, attachment: Attachment): JSX.Element {
    return (
      <div
        className={styles.url_attachment}
        key={index > -1 ? 'url_attachment_' + index : createUUID()}
      >
        <div className={styles.type_choice}>
          <SelectElement
            name="Type"
            styles={small as any}
            entry={{
              value: { label: attachment.type }
            }}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className={styles.url}>
          <span className={styles.upload}>
            <Pill
              icon="fe-download"
              text=" Download"
              large={true}
              onClick={() => {
                window.open(attachment.url, '_blank');
              }}
            />
            <div className={styles.remove_upload}>
              <Pill
                icon="fe-x"
                text=" Remove"
                large={true}
                onClick={() => {
                  this.handleAttachmentRemoved(index);
                }}
              />
            </div>
          </span>
        </div>
      </div>
    );
  }

  private renderAttachment(index: number, attachment: Attachment): JSX.Element {
    let attachments: any = this.state.attachments;
    return (
      <div
        className={styles.url_attachment}
        key={index > -1 ? 'url_attachment_' + index : createUUID()}
      >
        <div className={styles.type_choice}>
          <SelectElement
            styles={small as any}
            name="Type Options"
            placeholder="Add Attachment"
            entry={{
              value: index > -1 ? getAttachmentTypeOption(attachment.type) : null
            }}
            onChange={(option: any) => {
              if (option.value === 'upload') {
                window.setTimeout(() => {
                  this.filePicker.click();
                }, 200);
              } else {
                if (index === -1) {
                  attachments = mutate(attachments, {
                    $push: [{ type: option.value, url: '' }]
                  });
                } else {
                  attachments = mutate(attachments, {
                    [index]: {
                      $set: { type: option.value, url: attachment.url }
                    }
                  });
                }
                this.setState({ attachments });
              }
            }}
            options={index > -1 ? TYPE_OPTIONS : NEW_TYPE_OPTIONS}
          />
        </div>
        {index > -1 ? (
          <>
            <div className={styles.url}>
              <TextInputElement
                placeholder="URL"
                name="url"
                onChange={(value: string) => {
                  attachments = mutate(attachments, {
                    [index]: { $set: { type: attachment.type, url: value } }
                  });
                  this.setState({ attachments });
                }}
                entry={{ value: attachment.url }}
                autocomplete={true}
              />
            </div>
            <div className={styles.remove}>
              <Pill
                icon="fe-x"
                text=" Remove"
                large={true}
                onClick={() => {
                  this.handleAttachmentRemoved(index);
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  private handleUploadFile(files: FileList): void {
    let attachments: any = this.state.attachments;

    // if we have a csrf in our cookie, pass it along as a header
    const csrf = getCookie('csrftoken');
    const headers = csrf ? { 'X-CSRFToken': csrf } : {};

    if (!this.isAttachmentsValid(files)) {
      return null;
    }

    const data = new FormData();
    data.append('file', files[0]);
    axios
      .post(this.context.config.endpoints.attachments, data, { headers })
      .then(response => {
        attachments = mutate(attachments, {
          $push: [{ type: response.data.type, url: response.data.url, uploaded: true }]
        });
        this.setState({ attachments });
      })
      .catch(error => {
        console.log(error);
      });
  }

  private isAttachmentsValid(files: FileList) {
    let title = '';
    let message = '';
    let isValid = true;
    const file = files[0];
    const fileExtension = file.name.split('.').pop();

    if (UNSUPPORTED_EMAIL_ATTACHMENTS.includes(fileExtension)) {
      title = 'Invalid Format';
      message =
        'This file type is not supported for security reasons. If you still wish to send, please convert this file to an allowable type.';
      isValid = false;
    } else if (file.size > 26214400) {
      title = 'File Size Exceeded';
      message =
        'The file size should be less than 25MB for files. Please choose another file and try again.';
      isValid = false;
    }

    if (!isValid) {
      this.props.mergeEditorState({
        modalMessage: {
          title: title,
          body: message
        },
        saving: false
      });
    }
    return isValid;
  }

  public handleAttachmentRemoved(index: number): void {
    // we found a match, merge us in
    const updated: any = mutate(this.state.attachments, {
      $splice: [[index, 1]]
    });
    this.setState({ attachments: updated });
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;
    const attachments: Tab = {
      name: 'Attachments',
      body: this.renderAttachments(),
      checked: this.state.attachments.length > 0
    };
    const tabs = [attachments];
    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={tabs}
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div className={styles.ele}>
          <TaggingElement
            name={i18n.t('forms.send_email.recipient_name', 'Recipient')}
            placeholder={i18n.t('forms.send_email.recipient_placeholder', 'To')}
            prompt={i18n.t('forms.send_email.recipient_prompt', 'Enter email address')}
            onCheckValid={this.handleCheckValid}
            entry={this.state.recipients}
            onChange={this.handleRecipientsChanged}
            createPrompt={''}
          />
          <TextInputElement
            __className={styles.subject}
            name={i18n.t('forms.send_email.subject_name', 'Subject')}
            placeholder={i18n.t('forms.send_email.subject_placeholder', 'Subject')}
            onChange={this.handleSubjectChanged}
            entry={this.state.subject}
            autocomplete={true}
          />
          <TextInputElement
            __className={styles.message}
            name={i18n.t('forms.send_email.message_name', 'Message')}
            showLabel={false}
            onChange={this.handleBodyChanged}
            entry={this.state.body}
            autocomplete={true}
            textarea={true}
          />
        </div>
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
