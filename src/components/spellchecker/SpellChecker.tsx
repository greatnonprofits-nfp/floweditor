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

export const SpellChecker = (props: SpellCheckerProps) => (
  <div className={styles.spellcheckerWrap}>
    <div>
      <CheckboxElement
        name="Enable Spell Checker"
        checked={props.enabledSpell}
        description="Enable spelling correction"
        onChange={props.onEnabledChange}
      />
      <HelpIcon iconColor={variables.dark_blue} iconSize="15px" dataFor="enableSpell">
        <p>Enable spell check for fixing possible misstyping</p>
      </HelpIcon>
    </div>

    {props.enabledSpell && (
      <div className={styles.rangerContainer}>
        <div>
          <span>Correction Sensitivity</span>
          <HelpIcon iconColor={variables.dark_blue} iconSize="15px" dataFor="spellSensitivity">
            <p>Enable spell check for fixing possible misstyping</p>
          </HelpIcon>
        </div>
        <div className={styles.inputWrap}>
          <div>High</div>
          <input
            type="range"
            min="70"
            max="99"
            value={props.spellSensitivity}
            onChange={props.onSensitivityChange}
            className={styles.rangerInput}
          />
          <div>Low</div>
        </div>
        <div className={styles.sensitivity}>
          {`${props.spellSensitivity}% confidence in corrections`}
        </div>
      </div>
    )}
  </div>
);
