import { react as bindCallbacks } from 'auto-bind';
import { AirtimeTransferEntry } from 'components/flow/routers/airtime/AirtimeRouterForm';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import FormElement from 'components/form/FormElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import * as React from 'react';
import { Asset, Assets } from 'store/flowContext';
import { ValidationFailure } from 'store/nodeEditor';
import { small } from 'utils/reactselect';

import styles from './CurrencyElement.module.scss';

export interface AirtimeTransfer {
  amount: string;
  code: string;
}

export interface CurrencyElementProps {
  currencies: Assets;
  transfer: AirtimeTransferEntry;
  index: number;
  exclude: AirtimeTransferEntry[];
  onChange(index: number, transfer: AirtimeTransferEntry): void;
  onRemove(index: number): void;
}

export default class CurrencyElement extends React.Component<CurrencyElementProps> {
  constructor(props: CurrencyElementProps) {
    super(props);

    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  private handleCurrencyChanged(selected: Asset[]): void {
    this.props.onChange(this.props.index, {
      value: { amount: this.props.transfer.value.amount, code: selected[0].id },
      validationFailures: this.props.transfer.validationFailures
    });
  }

  private handleAmountChanged(value: string): void {
    const validationFailures: ValidationFailure[] = [];
    if (isNaN(Number(value))) {
      validationFailures.push({
        message: 'Invalid amount, please enter a number'
      });
    }
    this.props.onChange(this.props.index, {
      value: { amount: value, code: this.props.transfer.value.code },
      validationFailures
    });
  }

  public render(): JSX.Element {
    let placeholder = 'Transfer Amount';

    let amount = '';
    let currency: any = null;

    if (this.props.transfer.value) {
      const transfer = this.props.transfer.value;
      if (transfer.code) {
        placeholder = `${transfer.code} ${placeholder}`;
        currency = { id: transfer.code };
      }

      amount = '' + transfer.amount;
    }

    const amountInput =
      this.props.index > -1 ? (
        <div className={styles.amount}>
          <TextInputElement
            placeholder={placeholder}
            name="value"
            onChange={this.handleAmountChanged}
            entry={{ value: amount }}
          />
        </div>
      ) : null;

    const removeIco =
      this.props.index > -1 ? (
        <div
          className={styles.remove}
          onClick={() => {
            this.props.onRemove(this.props.index);
          }}
        >
          <span className="fe-x" />
        </div>
      ) : null;

    const shouldExclude = (asset: Asset): boolean => {
      return (
        this.props.exclude.filter(
          (airtime: AirtimeTransferEntry) => airtime.value.code === asset.id
        ).length > 1
      );
    };

    return (
      <FormElement name="Currency" entry={this.props.transfer} __className={styles.form_element}>
        <div className={styles.transfer}>
          <div className={styles.currency}>
            <AssetSelector
              styles={small as any}
              name="Currency"
              shouldExclude={shouldExclude}
              assets={this.props.currencies}
              entry={{ value: currency }}
              searchable={true}
              onChange={this.handleCurrencyChanged}
              placeholder={'Select a currency'}
            />
          </div>
          {amountInput} {removeIco}
        </div>
      </FormElement>
    );
  }
}
