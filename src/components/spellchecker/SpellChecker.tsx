import React from 'react';
import i18n from 'config/i18n';
import CheckboxElement from '../form/checkbox/CheckboxElement';
import HelpIcon from '../helpicon/HelpIcon';
import styles from './SpellChecker.module.scss';
import variables from 'variables.module.scss';

export interface SpellCheckerProps {
  enabledSpell: boolean;
  onEnabledChange(): void;
  spellSensitivity: string;
  onSensitivityChange(event: React.FormEvent<HTMLInputElement>): void;
}

export class SpellChecker extends React.Component<SpellCheckerProps> {
  public render(): JSX.Element {
    return (
      <div className={styles.spellcheckerWrap}>
        <div>
          <CheckboxElement
            name="Enable Spell Checker"
            checked={this.props.enabledSpell}
            description="Enable spelling correction"
            onChange={this.props.onEnabledChange}
          />
          <HelpIcon
            iconColor={variables.dark_blue}
            iconSize="15px"
            dataFor="enableSpell"
            bigTooltip
          >
            <p>{i18n.t('spell_checker.main_description')}</p>
            <p>
              {i18n.t('spell_checker.detail_link') + ' '}
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://docs.microsoft.com/en-us/azure/cognitive-services/bing-spell-check/language-support"
              >
                {i18n.t('help page')}
              </a>
              .
            </p>
          </HelpIcon>
        </div>
        {this.props.enabledSpell && (
          <div className={styles.rangerContainer}>
            <div>
              <span>Correction Sensitivity</span>
              <HelpIcon
                iconColor={variables.dark_blue}
                iconSize="15px"
                dataFor="spellSensitivity"
                bigTooltip
              >
                <p>{i18n.t('spell_checker.sensitivity_description')}</p>
                <p>
                  {i18n.t('spell_checker.detail_link') + ' '}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://docs.microsoft.com/en-us/azure/cognitive-services/bing-spell-check/language-support"
                  >
                    {i18n.t('help page')}
                  </a>
                  .
                </p>
              </HelpIcon>
            </div>
            <div className={styles.inputWrap}>
              <div>High</div>
              <input
                type="range"
                min="70"
                max="99"
                value={this.props.spellSensitivity}
                onChange={this.props.onSensitivityChange}
                className={styles.rangerInput}
              />
              <div>Low</div>
            </div>
            <div className={styles.sensitivity}>
              {`${this.props.spellSensitivity}% confidence in corrections`}
            </div>
          </div>
        )}
      </div>
    );
  }
}
