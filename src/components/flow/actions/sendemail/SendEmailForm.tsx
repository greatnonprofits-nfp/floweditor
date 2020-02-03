import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { hasErrors } from 'components/flow/actions/helpers';
import { ActionFormProps } from 'components/flow/props';
import TaggingElement from 'components/form/select/tags/TaggingElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import TypeList from 'components/nodeeditor/TypeList';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import UploadButton from '../../../uploadbutton/UploadButton';
import { fakePropType } from '../../../../config/ConfigProvider';
import Button, { ButtonTypes } from '../../../button/Button';
import Pill from '../../../pill/Pill';
import { MediaState } from '../../../../flowTypes';
import * as React from 'react';
import {
  FormState,
  mergeForm,
  StringArrayEntry,
  StringEntry,
  ValidationFailure
} from 'store/nodeEditor';
import { shouldRequireIf, validate } from 'store/validators';

import { initializeForm, stateToAction } from './helpers';
import styles from './SendEmailForm.module.scss';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'image', label: 'Image URL' },
  { value: 'audio', label: 'Audio URL' },
  { value: 'video', label: 'Video URL' }
];

const getAttachmentTypeOption = (type: string): SelectOption => {
  return TYPE_OPTIONS.find((option: SelectOption) => option.value === type);
};

export interface SendEmailFormState extends FormState {
  recipients: StringArrayEntry;
  subject: StringEntry;
  body: StringEntry;
  showUploadFields: boolean;
  attachUrl: boolean;
  media: MediaState | null;
}

export default class SendEmailForm extends React.Component<ActionFormProps, SendEmailFormState> {
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

  private handleFileChanged(url: string): void {
    this.handleUpdate({ media: { value: url ? url : '', type: url ? 'attachment' : '' } });
  }

  public handleShowUploadFields(): void {
    this.setState(prevState => ({ showUploadFields: !prevState.showUploadFields }));
  }

  private handleUpdate(
    keys: {
      recipients?: string[];
      subject?: string;
      body?: string;
      media?: MediaState | null;
    },
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

    if (keys.hasOwnProperty('media')) {
      updates.media! = keys.media!;
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

  public getButtons(): ButtonSet {
    return {
      primary: { name: 'Ok', onClick: this.handleSave },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  }

  public handleAttachmentRemoved(): void {
    this.setState({ media: { value: '', type: '' }, attachUrl: false });
  }

  public onRemoveAttachments(): void {
    this.setState({ showUploadFields: false });
  }

  public onRenderAttachSelect(): void {
    this.setState({ attachUrl: true });
  }

  public handleCheckValid(value: string): boolean {
    return EMAIL_PATTERN.test(value) || value.startsWith('@');
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;
    const { media, showUploadFields, attachUrl } = this.state;

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div className={styles.ele}>
          <TaggingElement
            name="Recipient"
            placeholder="To"
            prompt="Enter e-mail address"
            onCheckValid={this.handleCheckValid}
            entry={this.state.recipients}
            onChange={this.handleRecipientsChanged}
            createPrompt={''}
          />
          <TextInputElement
            __className={styles.subject}
            name="Subject"
            placeholder="Subject"
            onChange={this.handleSubjectChanged}
            entry={this.state.subject}
            onFieldFailures={(persistantFailures: ValidationFailure[]) => {
              const subject = { ...this.state.subject, persistantFailures };
              this.setState({
                subject,
                valid: this.state.valid && !hasErrors(subject)
              });
            }}
            autocomplete={true}
          />
          <TextInputElement
            __className={styles.message}
            name="Message"
            showLabel={false}
            onChange={this.handleBodyChanged}
            entry={this.state.body}
            onFieldFailures={(persistantFailures: ValidationFailure[]) => {
              const body = { ...this.state.body, persistantFailures };
              this.setState({
                body,
                valid: this.state.valid && !hasErrors(body)
              });
            }}
            autocomplete={true}
            textarea={true}
          />
          {!media.value && !showUploadFields && !attachUrl && (
            <div className={styles.icon} onClick={this.handleShowUploadFields}>
              <span className="fe-paperclip" />
            </div>
          )}

          {showUploadFields && !attachUrl && (
            <>
              <UploadButton
                icon="fe-paperclip"
                uploadText="Attach file"
                removeText={`Remove file: ${media.value}`}
                url={media.value}
                endpoint={this.context.config.endpoints.attachments}
                onUploadChanged={this.handleFileChanged}
              />

              {media.type !== 'attachment' && (
                <>
                  <Button
                    name="Attach URL"
                    type={ButtonTypes.tertiary}
                    leftSpacing={true}
                    topSpacing={true}
                    onClick={this.onRenderAttachSelect}
                  />
                  <div className={styles.removeAttach} onClick={this.onRemoveAttachments}>
                    <span className="fe-x" />
                  </div>
                </>
              )}
            </>
          )}

          {attachUrl && (
            <div className={styles.attachUrlWrapper}>
              <SelectElement
                className="attach-select"
                name="Type Options"
                placeholder="Add Attachment URL"
                options={TYPE_OPTIONS}
                entry={{ value: getAttachmentTypeOption(media.type) }}
                onChange={(option: any) => {
                  this.setState({ media: { value: '', type: option.value, url: '' } });
                }}
              />
              {media.type && (
                <>
                  <div className={styles.url}>
                    <TextInputElement
                      placeholder="URL"
                      name="url"
                      onChange={(value: string) => {
                        this.setState(prevState => ({
                          media: {
                            ...prevState.media,
                            url: value,
                            value: `${media.type}:${value}`
                          }
                        }));
                      }}
                      entry={{ value: media.url }}
                      autocomplete={true}
                    />
                  </div>
                  <div className={styles.remove}>
                    <Pill
                      icon="fe-x"
                      text=" Remove"
                      large={true}
                      onClick={() => {
                        this.handleAttachmentRemoved();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Dialog>
    );
  }
}
