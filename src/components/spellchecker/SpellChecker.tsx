import React from 'react';
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
            <p>
              This feature will automatically correct typos and misspellings by users in multiple
              languages. The language for the spell checker is based on the language set for the
              user. Corrections occur before the categorization rules. For example, if user types
              “thankks” it would be corrected to “thanks.” The word “thanks” would then be used for
              the categorization. The corrected text is available as a flow variable with
              @flow.variable.corrected
            </p>
            <p>
              We encourage you to test misspellings in order to tune the sensitivity for your use
              case. For more information and a list of languages, see our{' '}
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://docs.microsoft.com/en-us/azure/cognitive-services/bing-spell-check/language-support"
              >
                help page
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
                <p>
                  This slider bar enables you to control the sensitivity of the correction. Like all
                  spell checkers, it does not always make the correction you would want it to make.
                  The higher the sensitivity, the more corrections will be made. Lower sensitivity
                  will only make more obvious corrections.
                </p>
                <p>
                  We encourage you to test misspellings in order to tune the sensitivity for your
                  usecase. For more information and a list of languages, see our{' '}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://docs.microsoft.com/en-us/azure/cognitive-services/bing-spell-check/language-support"
                  >
                    help page
                  </a>
                  .
                </p>
              </HelpIcon>
            </div>
            <div className={styles.inputWrap}>
              <div>Low</div>
              <input
                type="range"
                min="70"
                max="99"
                value={this.props.spellSensitivity}
                onChange={this.props.onSensitivityChange}
                className={styles.rangerInput}
              />
              <div>High</div>
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
