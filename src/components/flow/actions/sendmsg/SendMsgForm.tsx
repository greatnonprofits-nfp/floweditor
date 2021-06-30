/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { react as bindCallbacks } from 'auto-bind';
import { AxiosResponse } from 'axios';
import Dialog, { ButtonSet, Tab } from 'components/dialog/Dialog';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import {
  initializeForm as stateToForm,
  stateToAction,
  RECEIVE_ATTACHMENT_OPTIONS,
  TOPIC_OPTIONS
} from 'components/flow/actions/sendmsg/helpers';
import TaggingElement from 'components/form/select/tags/TaggingElement';
import { ActionFormProps } from 'components/flow/props';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { hasUseableTranslation } from 'components/form/assetselector/helpers';
import CheckboxElement from 'components/form/checkbox/CheckboxElement';
import MultiChoiceInput from 'components/form/multichoice/MultiChoice';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import HelpIcon from 'components/helpicon/HelpIcon';
import TypeList from 'components/nodeeditor/TypeList';
import { fakePropType } from 'config/ConfigProvider';
import { fetchAsset } from 'external';
import { Template, TemplateTranslation } from 'flowTypes';
import mutate from 'immutability-helper';
import * as React from 'react';
import { Asset } from 'store/flowContext';
import {
  FormState,
  mergeForm,
  StringArrayEntry,
  StringEntry,
  SelectOptionEntry,
  FormEntry
} from 'store/nodeEditor';
import { MaxOfTenItems, Required, shouldRequireIf, validate } from 'store/validators';
import { range, renderIf } from 'utils';

import styles from './SendMsgForm.module.scss';
import { hasFeature } from 'config/typeConfigs';
import { FeatureFilter, FlowTypes } from 'config/interfaces';

import variables from 'variables.module.scss';

import i18n from 'config/i18n';
import { Trans } from 'react-i18next';
import { Attachment, renderAttachments } from './attachments';
import { TembaSelectStyle } from '../../../../temba/TembaSelect';

const FACEBOOK_ICON = require('static/images/facebook.png');
const TELEGRAM_ICON = require('static/images/telegram.png');
const WHATSAPP_ICON = require('static/images/whatsapp.png');
const LINE_ICON = require('static/images/line.png');
const PINTEREST_ICON = require('static/images/pinterest.png');
const TWITTER_ICON = require('static/images/twitter.png');
const DOWNLOAD_ICON = require('static/images/download.png');
const EMAIL_ICON = require('static/images/email.png');
const HASHTAG_PATTERN = /(?:\s|^)#[A-Za-z0-9\\.\\_]+(?:\s|$)/;

export interface SendMsgFormState extends FormState {
  message: StringEntry;
  quickReplies: StringArrayEntry;
  quickReplyEntry: StringEntry;
  sendAll: boolean;
  attachments: Attachment[];
  template: FormEntry;
  topic: SelectOptionEntry;
  templateVariables: StringEntry[];
  templateTranslation?: TemplateTranslation;
  receiveAttachment?: SelectOptionEntry;
  sharingBtnText: StringEntry;
  sharingBtnHashtags?: StringArrayEntry;
  emailSharing?: boolean;
  facebookSharing?: boolean;
  whatsappSharing?: boolean;
  pinterestSharing?: boolean;
  downloadSharing?: boolean;
  twitterSharing?: boolean;
  telegramSharing?: boolean;
  lineSharing?: boolean;
  viewShareableButtons?: boolean;
}

export default class SendMsgForm extends React.Component<ActionFormProps, SendMsgFormState> {
  constructor(props: ActionFormProps, context: any) {
    super(props);
    this.context = context;
    this.state = stateToForm(this.props.nodeSettings, this.props.assetStore);
    bindCallbacks(this, {
      include: [/^handle/, /^on/]
    });

    // intialize our templates if we have them
    if (this.state.template.value !== null) {
      fetchAsset(this.props.assetStore.templates, this.state.template.value.uuid).then(
        (asset: Asset) => {
          if (asset !== null) {
            this.handleTemplateChanged([{ ...this.state.template.value, ...asset.content }]);
          }
        }
      );
    }
  }

  public static contextTypes = {
    config: fakePropType
  };

  private handleUpdate(
    keys: {
      text?: string;
      sendAll?: boolean;
      quickReplies?: string[];
      sharingBtnText?: string;
      sharingBtnHashtags?: string[];
      emailSharing?: boolean;
      facebookSharing?: boolean;
      whatsappSharing?: boolean;
      pinterestSharing?: boolean;
      downloadSharing?: boolean;
      twitterSharing?: boolean;
      telegramSharing?: boolean;
      lineSharing?: boolean;
      viewShareableButtons?: boolean;
    },
    submitting = false
  ): boolean {
    const updates: Partial<SendMsgFormState> = {};
    if (keys.hasOwnProperty('text')) {
      updates.message = validate(i18n.t('forms.message', 'Message'), keys.text, [
        shouldRequireIf(submitting)
      ]);
    }

    if (keys.hasOwnProperty('sendAll')) {
      updates.sendAll = keys.sendAll;
    }

    if (keys.hasOwnProperty('quickReplies')) {
      updates.quickReplies = validate(
        i18n.t('forms.quick_replies', 'Quick Replies'),
        keys.quickReplies,
        [MaxOfTenItems]
      );
    }

    if (keys.hasOwnProperty('sharingBtnText')) {
      updates.sharingBtnText = { value: keys.sharingBtnText };
    }

    if (keys.hasOwnProperty('sharingBtnHashtags')) {
      updates.sharingBtnHashtags = { value: keys.sharingBtnHashtags };
    }

    if (keys.hasOwnProperty('emailSharing')) {
      updates.emailSharing = keys.emailSharing;
    }

    if (keys.hasOwnProperty('facebookSharing')) {
      updates.facebookSharing = keys.facebookSharing;
    }

    if (keys.hasOwnProperty('whatsappSharing')) {
      updates.whatsappSharing = keys.whatsappSharing;
    }

    if (keys.hasOwnProperty('pinterestSharing')) {
      updates.pinterestSharing = keys.pinterestSharing;
    }

    if (keys.hasOwnProperty('downloadSharing')) {
      updates.downloadSharing = keys.downloadSharing;
    }

    if (keys.hasOwnProperty('twitterSharing')) {
      updates.twitterSharing = keys.twitterSharing;
    }

    if (keys.hasOwnProperty('telegramSharing')) {
      updates.telegramSharing = keys.telegramSharing;
    }

    if (keys.hasOwnProperty('lineSharing')) {
      updates.lineSharing = keys.lineSharing;
    }

    if (keys.hasOwnProperty('viewShareableButtons')) {
      updates.viewShareableButtons = keys.viewShareableButtons;
    }

    const updated = mergeForm(this.state, updates) as SendMsgFormState;

    this.setState(updated);
    return updated.valid;
  }

  public handleMessageInput(event: React.KeyboardEvent) {
    return this.handleUpdate({ text: (event.target as any).value }, false);
  }

  public handleMessageUpdate(message: string, name: string, submitting = false): boolean {
    return this.handleUpdate({ text: message }, submitting);
  }

  public handleQuickRepliesUpdate(quickReplies: string[]): boolean {
    return this.handleUpdate({ quickReplies });
  }

  public handleSendAllUpdate(sendAll: boolean): boolean {
    return this.handleUpdate({ sendAll });
  }

  private handleSave(): void {
    // don't continue if our message already has errors
    if (hasErrors(this.state.message)) {
      return;
    }

    // make sure we validate untouched text fields and contact fields
    let valid = this.handleMessageUpdate(this.state.message.value, null, true);

    let templateVariables = this.state.templateVariables;
    // make sure we don't have untouched template variables
    this.state.templateVariables.forEach((variable: StringEntry, num: number) => {
      const updated = validate(`Variable ${num + 1}`, variable.value, [Required]);
      templateVariables = mutate(templateVariables, {
        [num]: { $merge: updated }
      }) as StringEntry[];
      valid = valid && !hasErrors(updated);
    });

    valid = valid && !hasErrors(this.state.quickReplyEntry);

    if (valid) {
      this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));
      // notify our modal we are done
      this.props.onClose(false);
    } else {
      this.setState({ templateVariables, valid });
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

  private handleTemplateChanged(selected: any[]): void {
    const template = selected ? selected[0] : null;

    if (!template) {
      this.setState({
        template: { value: null },
        templateTranslation: null,
        templateVariables: []
      });
    } else {
      const templateTranslation = template.translations[0];

      const templateVariables =
        this.state.templateVariables.length === 0 ||
        (this.state.template.value && this.state.template.value.uuid !== template.uuid)
          ? range(0, templateTranslation.variable_count).map(() => {
              return {
                value: ''
              };
            })
          : this.state.templateVariables;

      this.setState({
        template: { value: template },
        templateTranslation,
        templateVariables
      });
    }
  }

  private handleTemplateVariableChanged(updatedText: string, num: number): void {
    const entry = validate(`Variable ${num + 1}`, updatedText, [Required]);
    const templateVariables = mutate(this.state.templateVariables, {
      $merge: { [num]: entry }
    }) as StringEntry[];
    this.setState({ templateVariables });
  }

  private handleShouldExcludeTemplate(template: any): boolean {
    return !hasUseableTranslation(template as Template);
  }

  private renderTopicConfig(): JSX.Element {
    return (
      <>
        <p>
          {i18n.t(
            'forms.send_msg_facebook_warning',
            'Sending bulk messages over a Facebook channel requires that a topic be specified if the user has not sent a message in the last 24 hours. Setting a topic to use over Facebook is especially important for the first message in your flow.'
          )}
        </p>
        <SelectElement
          key={'fb_method_select'}
          name={i18n.t('forms.method', 'Method')}
          entry={this.state.topic}
          onChange={this.handleTopicUpdate}
          options={TOPIC_OPTIONS}
          placeholder={i18n.t(
            'forms.send_msg_facebook_topic_placeholder',
            'Select a topic to use over Facebook'
          )}
          clearable={true}
        />
      </>
    );
  }

  private handleTopicUpdate(topic: SelectOption) {
    this.setState({ topic: { value: topic } });
  }

  private renderTemplateConfig(): JSX.Element {
    return (
      <>
        <p>
          {i18n.t(
            'forms.whatsapp_warning',
            'Sending messages over a WhatsApp channel requires that a template be used if you have not received a message from a contact in the last 24 hours. Setting a template to use over WhatsApp is especially important for the first message in your flow.'
          )}
        </p>
        <AssetSelector
          name={i18n.t('forms.template', 'template')}
          noOptionsMessage="No templates found"
          assets={this.props.assetStore.templates}
          entry={this.state.template}
          onChange={this.handleTemplateChanged}
          shouldExclude={this.handleShouldExcludeTemplate}
          searchable={true}
          formClearable={true}
        />
        {this.state.templateTranslation ? (
          <>
            <div className={styles.template_text}>{this.state.templateTranslation.content}</div>
            {range(0, this.state.templateTranslation.variable_count).map((num: number) => {
              return (
                <div className={styles.variable} key={'tr_arg_' + num}>
                  <TextInputElement
                    name={`${i18n.t('forms.variable', 'Variable')} ${num + 1}`}
                    showLabel={false}
                    placeholder={`${i18n.t('forms.variable', 'Variable')} ${num + 1}`}
                    onChange={(updatedText: string) => {
                      this.handleTemplateVariableChanged(updatedText, num);
                    }}
                    entry={this.state.templateVariables[num]}
                    autocomplete={true}
                  />
                </div>
              );
            })}
          </>
        ) : null}
      </>
    );
  }

  private handleAttachmentUploaded(response: AxiosResponse) {
    const attachments: any = mutate(this.state.attachments, {
      $push: [{ type: response.data.type, url: response.data.url, uploaded: true }]
    });
    this.setState({ attachments });
  }

  private handleAttachmentChanged(index: number, type: string, url: string) {
    let attachments: any = this.state.attachments;
    if (index === -1) {
      attachments = mutate(attachments, {
        $push: [{ type, url }]
      });
    } else {
      attachments = mutate(attachments, {
        [index]: {
          $set: { type, url }
        }
      });
    }

    this.setState({ attachments });
  }

  private handleAttachmentRemoved(index: number) {
    const attachments: any = mutate(this.state.attachments, {
      $splice: [[index, 1]]
    });
    this.setState({ attachments });
  }

  private handleAttachmentError(title: string, message: string) {
    this.props.mergeEditorState({
      modalMessage: {
        title: title,
        body: message
      },
      saving: false
    });
  }

  private handleEmailSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ emailSharing: checked });
  }

  private handleFacebookSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ facebookSharing: checked });
  }

  private handleWhatsAppSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ whatsappSharing: checked });
  }

  private handlePinterestSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ pinterestSharing: checked });
  }

  private handleDownloadSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ downloadSharing: checked });
  }

  private handleTwitterSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ twitterSharing: checked });
  }

  private handleTelegramSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ telegramSharing: checked });
  }

  private handleLineSharingItem(checked: boolean): boolean {
    return this.handleUpdate({ lineSharing: checked });
  }

  private renderSharingButtons(): JSX.Element {
    return (
      <div className={styles.sharing_buttons_box_items}>
        <div className={styles.sharing_buttons_items}>
          <img src={EMAIL_ICON} alt="Email" />
          <CheckboxElement
            name="Email"
            title="Email"
            labelClassName={styles.checkbox}
            checked={this.state.emailSharing}
            onChange={this.handleEmailSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={FACEBOOK_ICON} alt="Facebook" />
          <CheckboxElement
            name="Facebook"
            title="Facebook"
            labelClassName={styles.checkbox}
            checked={this.state.facebookSharing}
            onChange={this.handleFacebookSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={WHATSAPP_ICON} alt="WhatsApp" />
          <CheckboxElement
            name="WhatsApp"
            title="WhatsApp"
            labelClassName={styles.checkbox}
            checked={this.state.whatsappSharing}
            onChange={this.handleWhatsAppSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={PINTEREST_ICON} alt="Pinterest" />
          <CheckboxElement
            name="Pinterest"
            title="Pinterest"
            labelClassName={styles.checkbox}
            checked={this.state.pinterestSharing}
            onChange={this.handlePinterestSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={DOWNLOAD_ICON} alt="Download" />
          <CheckboxElement
            name="Download"
            title="Download"
            labelClassName={styles.checkbox}
            checked={this.state.downloadSharing}
            onChange={this.handleDownloadSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={TWITTER_ICON} alt="Twitter" />
          <CheckboxElement
            name="Twitter"
            title="Twitter"
            labelClassName={styles.checkbox}
            checked={this.state.twitterSharing}
            onChange={this.handleTwitterSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={TELEGRAM_ICON} alt="Telegram" />
          <CheckboxElement
            name="Telegram"
            title="Telegram"
            labelClassName={styles.checkbox}
            checked={this.state.telegramSharing}
            onChange={this.handleTelegramSharingItem}
          />
        </div>
        <div className={styles.sharing_buttons_items}>
          <img src={LINE_ICON} alt="Line" />
          <CheckboxElement
            name="Line"
            title="Line"
            labelClassName={styles.checkbox}
            checked={this.state.lineSharing}
            onChange={this.handleLineSharingItem}
          />
        </div>
      </div>
    );
  }

  public handleSharingButtonDefaultText(defaultText: string): boolean {
    return this.handleUpdate({ sharingBtnText: defaultText });
  }

  public handleCheckHashtagValid(value: string): boolean {
    if (this.state.sharingBtnHashtags.value.length > 0) {
      return false;
    }
    return HASHTAG_PATTERN.test(value) && !(value.indexOf(' ') >= 0);
  }

  public handleHashtagChanged(hashtags: string[]): boolean {
    return this.handleUpdate({ sharingBtnHashtags: hashtags });
  }

  private handleViewShareableButtons(): boolean {
    return this.handleUpdate({ viewShareableButtons: !this.state.viewShareableButtons });
  }

  private renderSharingButtonsBox(): JSX.Element {
    return (
      <div className={styles.sharing_buttons}>
        <div className={styles.sharing_buttons_default_text}>
          <label className={styles.sharing_buttons_default_label}>
            {i18n.t('forms.send_msg.sharing_buttons_default', 'Default text')}
            <HelpIcon iconColor={variables.light_gray} iconSize="18px" dataFor="sharingBtnType">
              <p>
                Some social media application allow sharing to include default text. Type here the
                text and hashtags if you wish to include default text.
              </p>
            </HelpIcon>
          </label>
          <TextInputElement
            __className={styles.sharing_buttons_default_field}
            name="Sharing Buttons Default Text"
            showLabel={false}
            onChange={this.handleSharingButtonDefaultText}
            entry={this.state.sharingBtnText}
            autocomplete={false}
            focus={false}
            textarea={true}
          />
        </div>
        <div className={styles.sharing_buttons_hashtag}>
          <label className={styles.sharing_buttons_default_label}>
            {i18n.t('forms.send_msg.sharing_buttons_default', 'Hashtag')}
          </label>
          <div className={styles.sharing_buttons_default_field}>
            <TaggingElement
              name="Hashtag"
              placeholder={i18n.t(
                'forms.send_msg.sharing_buttons_hashtag_placeholder',
                '(if available)'
              )}
              prompt={i18n.t('forms.send_msg.sharing_buttons_hashtag_prompt', 'Enter a hashtag')}
              onCheckValid={this.handleCheckHashtagValid}
              entry={this.state.sharingBtnHashtags}
              onChange={this.handleHashtagChanged}
              createPrompt={''}
            />
          </div>
        </div>
        <div>
          <p className={styles.sharing_buttons_available}>
            {i18n.t(
              'forms.send_msg.sharing_buttons_available',
              'Available sharing buttons to include'
            )}
          </p>
          {this.renderSharingButtons()}
        </div>
      </div>
    );
  }

  private renderReceiveAttachment(): JSX.Element {
    if (this.context.config.flowType === FlowTypes.MESSAGING) {
      return (
        <>
          <span className={styles.span_separator}></span>
          <p>
            Receive attachment: <br />
            Select a type of attachment to receive from a user as an answer choice. <br />
            Note: only available for channels with file upload capabilities.
          </p>
          <div className={styles.type_choice}>
            <SelectElement
              style={TembaSelectStyle.small}
              name="ReceiveAttachment"
              entry={this.state.receiveAttachment}
              onChange={this.handleReceiveAttachmentUpdate}
              options={RECEIVE_ATTACHMENT_OPTIONS}
              placeholder="Receive Attachment"
              clearable={true}
            />
          </div>
        </>
      );
    }
  }

  private handleReceiveAttachmentUpdate(option: SelectOption) {
    this.setState({ receiveAttachment: { value: option } });
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    const quickReplies: Tab = {
      name: i18n.t('forms.quick_replies', 'Quick Replies'),
      body: (
        <>
          <p>
            {i18n.t(
              'forms.quick_replies_summary',
              'Quick Replies are made into buttons for supported channels. For example, when asking a question, you might add a Quick Reply for "Yes" and one for "No".'
            )}
          </p>

          <MultiChoiceInput
            name={i18n.t('forms.quick_reply', 'quick_reply')}
            helpText={
              <Trans i18nKey="forms.add_quick_reply">Add a new Quick Reply and press enter.</Trans>
            }
            items={this.state.quickReplies}
            entry={this.state.quickReplyEntry}
            onChange={this.handleQuickRepliesUpdate}
          />

          {renderIf(this.context.config.flowType === FlowTypes.MESSAGING)(
            <>
              <p>
                {/* eslint-disable-next-line */}
                <a
                  role="button"
                  onClick={this.handleViewShareableButtons}
                  className={styles.view_shareable_button}
                >
                  {this.state.viewShareableButtons ? (
                    <span
                      className={
                        styles.tab_icon + ' fe-arrow-up ' + styles.view_shareable_button_icon
                      }
                    />
                  ) : (
                    <span
                      className={
                        styles.tab_icon + ' fe-plus-circle ' + styles.view_shareable_button_icon
                      }
                    />
                  )}
                  {i18n.t(
                    'forms.send_msg.add_sharing_buttons',
                    'Add sharing buttons (For WebChat only)'
                  )}
                </a>
              </p>
              {this.state.viewShareableButtons ? this.renderSharingButtonsBox() : null}
            </>
          )}
        </>
      ),
      checked: this.state.quickReplies.value.length > 0,
      hasErrors: hasErrors(this.state.quickReplyEntry)
    };

    const attachments: Tab = {
      name: i18n.t('forms.attachments', 'Attachments'),
      body: (
        <>
          {renderAttachments(
            this.context.config.endpoints.attachments,
            this.state.attachments,
            this.handleAttachmentUploaded,
            this.handleAttachmentChanged,
            this.handleAttachmentRemoved,
            this.handleAttachmentError
          )}
          {this.renderReceiveAttachment()}
        </>
      ),
      checked: this.state.attachments.length > 0
    };

    const advanced: Tab = {
      name: i18n.t('forms.advanced', 'Advanced'),
      body: (
        <CheckboxElement
          name={i18n.t('forms.all_destinations', 'All Destinations')}
          title={i18n.t('forms.all_destinations', 'All Destinations')}
          labelClassName={styles.checkbox}
          checked={this.state.sendAll}
          description={i18n.t(
            'forms.all_destinations_description',
            "Send a message to all destinations known for this contact. If you aren't sure what this means, leave it unchecked."
          )}
          onChange={this.handleSendAllUpdate}
        />
      ),
      checked: this.state.sendAll
    };

    const tabs = [quickReplies, attachments, advanced];

    if (hasFeature(this.context.config, FeatureFilter.HAS_WHATSAPP)) {
      const templates: Tab = {
        name: 'WhatsApp',
        body: this.renderTemplateConfig(),
        checked: this.state.template.value != null,
        hasErrors: !!this.state.templateVariables.find((entry: StringEntry) => hasErrors(entry))
      };
      tabs.splice(0, 0, templates);
    }

    if (hasFeature(this.context.config, FeatureFilter.HAS_FACEBOOK)) {
      const templates: Tab = {
        name: 'Facebook',
        body: this.renderTopicConfig(),
        checked: this.state.topic.value != null
      };
      tabs.splice(0, 0, templates);
    }

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={tabs}
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <TextInputElement
          name={i18n.t('forms.message', 'Message')}
          showLabel={false}
          counter=".sms-counter"
          onChange={this.handleMessageUpdate}
          entry={this.state.message}
          autocomplete={true}
          focus={true}
          textarea={true}
        />
        <temba-charcount class="sms-counter"></temba-charcount>
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
