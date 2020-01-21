import FormElement, { FormElementProps } from 'components/form/FormElement';
import * as React from 'react';
import Select from 'react-select';
import { StylesConfig } from 'react-select/lib/styles';
import styles from '../FormElement.module.scss';

interface SelectElementProps extends FormElementProps {
  onChange?(value: any): void;
  options: any;
  placeholder?: string;
  styles?: StylesConfig;
  getOptionLabel?: (item: any) => string;
  getOptionValue?: (item: any) => string;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export default class SelectElement extends React.Component<SelectElementProps> {
  public render(): JSX.Element {
    return (
      <FormElement
        name={this.props.name}
        entry={this.props.entry}
        __className={this.props.className && styles[this.props.className]}
      >
        <Select
          isDisabled={this.props.onChange === undefined}
          placeholder={this.props.placeholder}
          styles={this.props.styles}
          name={this.props.name}
          value={this.props.entry.value}
          onChange={this.props.onChange}
          isSearchable={false}
          isClearable={false}
          options={this.props.options}
          getOptionLabel={this.props.getOptionLabel}
          getOptionValue={this.props.getOptionValue}
        />
      </FormElement>
    );
  }
}
