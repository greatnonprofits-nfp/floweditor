import { react as bindCallbacks } from 'auto-bind';
import CheckboxElement from 'components/form/checkbox/CheckboxElement';
import * as React from 'react';
import { renderIf } from 'utils';

import styles from './TimeoutControl.module.scss';
import i18n from 'config/i18n';
import TembaSelect, { TembaSelectStyle } from 'temba/TembaSelect';
import { SelectOption } from '../select/SelectElement';

export const TIMEOUT_OPTIONS = [
  { value: 10, name: '10 seconds' },
  { value: 20, name: '20 seconds' },
  { value: 30, name: '30 seconds' },
  { value: 45, name: '45 seconds' },
  { value: 60, name: '1 minute' },
  { value: 120, name: '2 minutes' },
  { value: 180, name: '3 minutes' },
  { value: 240, name: '4 minutes' },
  { value: 300, name: '5 minutes' },
  { value: 600, name: '10 minutes' },
  { value: 900, name: '15 minutes' },
  { value: 1800, name: '30 minutes' },
  { value: 3600, name: '1 hours' },
  { value: 7200, name: '2 hours' },
  { value: 10800, name: '3 hours' },
  { value: 21600, name: '6 hours' },
  { value: 43200, name: '12 hours' },
  { value: 64800, name: '18 hours' },
  { value: 86400, name: '1 day' },
  { value: 172800, name: '2 days' },
  { value: 259200, name: '3 days' },
  { value: 604800, name: '1 week' }
];

export const DEFAULT_TIMEOUT = TIMEOUT_OPTIONS[8];

export const ellipsize = (str: string) => `${str}...`;

export interface TimeoutControlProps {
  timeout: number;
  onChanged(timeout: number): void;
}

export default class TimeoutControl extends React.Component<TimeoutControlProps> {
  constructor(props: TimeoutControlProps) {
    super(props);
    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private getSelected(timeout: number): any {
    for (const [idx, { value }] of TIMEOUT_OPTIONS.entries()) {
      if (value === '' + timeout) {
        return TIMEOUT_OPTIONS[idx];
      }
    }
    return null;
  }

  private isChecked(): boolean {
    return this.props.timeout > 0;
  }

  private getInstructions(): string {
    const base = 'Continue when there is no response';
    return this.isChecked() ? `${base} for` : ellipsize(base);
  }

  private handleChecked(): void {
    if (this.props.timeout > 0) {
      this.props.onChanged(0);
    } else {
      this.props.onChanged(parseInt(DEFAULT_TIMEOUT.value));
    }
  }

  private handleTimeoutChanged(selected: any): void {
    this.props.onChanged(parseInt(selected.value));
  }

  public render(): JSX.Element {
    return (
      <div className={styles.timeout_control_container}>
        <div className={styles.left_section}>
          <CheckboxElement
            name={i18n.t('forms.timeout', 'Timeout')}
            checked={this.isChecked()}
            description={this.getInstructions()}
            checkboxClassName={styles.checkbox}
            onChange={this.handleChecked}
          />
        </div>
        {renderIf(this.isChecked())(
          <div className={styles.drop_down}>
            <TembaSelect
              name={i18n.t('forms.timeout', 'Timeout')}
              style={TembaSelectStyle.small}
              value={this.getSelected(this.props.timeout)}
              options={TIMEOUT_OPTIONS}
              onChange={this.handleTimeoutChanged}
            ></TembaSelect>
          </div>
        )}
      </div>
    );
  }
}
