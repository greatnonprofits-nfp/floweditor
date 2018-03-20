import * as React from 'react';
import { react as bindCallbacks } from 'auto-bind';
import axios from 'axios';
import { Async, AsyncCreatable } from 'react-select';
import { SearchResult } from '../store';
import { jsonEqual, resultsToSearchOpts } from '../utils';

export interface SelectSearchProps {
    url: string;
    name: string;
    resultType: string;
    placeholder?: string;
    searchPromptText?: string | JSX.Element;
    multi?: boolean;
    closeOnSelect?: boolean;
    initial?: SearchResult[];
    localSearchOptions?: SearchResult[];
    _className?: string;
    createPrompt?: string;
    onChange?: (selections: SearchResult | SearchResult[]) => void;
    isValidNewOption?: (option: { label: string }) => boolean;
    createNewOption?: (option: { label: string; labelKey: string; valueKey: string }) => any;
}

interface SelectSearchState {
    selections: SearchResult[];
}

interface SelectSearchResult {
    options: SearchResult[];
    complete: boolean;
}

// Quick fix for flash of 'Loading...' text when user makes selection.
// Async and AsyncCreatable make a network request on each selection, perhaps we
// should discuss a caching strategy.
export const LOADING_PLACEHOLDER = '';

export default class SelectSearch extends React.Component<SelectSearchProps, SelectSearchState> {
    private select: HTMLInputElement;

    constructor(props: SelectSearchProps) {
        super(props);

        this.state = {
            selections: props.initial || []
        };

        bindCallbacks(this, {
            include: ['selectRef', 'loadOptions', 'onChange', 'onChangeMulti']
        });
    }

    public selectRef(ref: HTMLInputElement): HTMLInputElement {
        return (this.select = ref);
    }

    public componentWillReceiveProps(nextProps: SelectSearchProps): void {
        if (!jsonEqual(this.props.initial, nextProps.initial)) {
            this.setState({ selections: nextProps.initial });
        }
    }

    /**
     * Sorts all search results by name
     */
    private sortResults(a: SearchResult, b: SearchResult): number {
        return a.name.localeCompare(b.name);
    }

    private addSearchResult(results: SearchResult[], result: SearchResult): SearchResult[] {
        const newResults = [...results];

        let found = false;
        for (const existing of newResults) {
            if (result.id === existing.id) {
                found = true;
                break;
            }
        }

        if (!found) {
            newResults.push(result);
        }

        return newResults;
    }

    public search(term: string, remoteResults: SearchResult[] = []): SelectSearchResult {
        let combined: SearchResult[] = [...remoteResults];

        if (this.props.localSearchOptions) {
            for (const local of this.props.localSearchOptions) {
                if (!term || local.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
                    combined = this.addSearchResult(combined, local);
                }
            }
        }
        const options: SearchResult[] = combined.sort(this.sortResults);

        const results: SelectSearchResult = {
            options,
            complete: true
        };

        return results;
    }

    public loadOptions(input: string, callback: Function): void {
        if (!this.props.url) {
            const options = this.search(input);
            callback(options);
        } else {
            axios.get(this.props.url).then(response => {
                const results = response.data.results.map(resultsToSearchOpts);
                const options = this.search(input, results);
                callback(null, options);
            });
        }
    }

    private onChange(selection: SearchResult): void {
        // Account for null selections
        if (!selection) {
            return;
        }

        // Convert to array to update state
        const selections = [selection];

        if (!jsonEqual(this.state.selections, selections)) {
            if (this.props.onChange) {
                this.props.onChange(selection);
            }

            this.setState(
                {
                    selections
                },
                () => this.select.focus()
            );
        }
    }

    private onChangeMulti(selections: SearchResult[]): void {
        // Account for null selections
        if (!selections) {
            return;
        }

        if (!jsonEqual(this.state.selections, selections)) {
            if (this.props.onChange) {
                this.props.onChange(selections);
            }

            this.setState(
                {
                    selections
                },
                () => this.select.focus()
            );
        }
    }

    private filterOption(option: SearchResult, term: string): boolean {
        return option.name.toLowerCase().indexOf(term.toLowerCase()) > -1;
    }

    public render(): JSX.Element {
        let value: any;

        if (this.props.multi) {
            value = [];
        }

        if (this.state.selections.length) {
            for (const selections of this.state.selections) {
                if (selections) {
                    const selectionValue: string | SearchResult =
                        selections.extraResult || this.props.multi ? selections : selections.id;

                    if (this.props.multi) {
                        value.push(selectionValue);
                    } else {
                        value = selectionValue;
                    }
                }
            }
        }

        const onChange = this.props.multi ? this.onChangeMulti : this.onChange;

        const options: any = {};
        if (this.props.createPrompt) {
            options.promptTextCreator = (label: string) => this.props.createPrompt + label;
        }
        if (this.props.createNewOption) {
            options.newOptionCreator = this.props.createNewOption;
        }
        if (this.props.isValidNewOption) {
            options.isValidNewOption = this.props.isValidNewOption;
        }

        if (this.props.createNewOption) {
            return (
                <AsyncCreatable
                    ref={this.selectRef}
                    className={this.props._className}
                    name={this.props.name}
                    placeholder={this.props.placeholder}
                    loadOptions={this.loadOptions}
                    loadingPlaceholder={LOADING_PLACEHOLDER}
                    closeOnSelect={this.props.closeOnSelect}
                    ignoreCase={false}
                    ignoreAccents={false}
                    value={value}
                    openOnFocus={true}
                    cache={false}
                    valueKey="id"
                    labelKey="name"
                    multi={this.props.multi}
                    clearable={this.props.multi}
                    searchable={true}
                    onCloseResetsInput={true}
                    onBlurResetsInput={true}
                    filterOption={this.filterOption}
                    onChange={onChange}
                    searchPromptText={this.props.searchPromptText}
                    {...options}
                />
            );
        } else {
            return (
                <Async
                    ref={this.selectRef}
                    className={this.props._className}
                    name={this.props.name}
                    placeholder={this.props.placeholder}
                    loadOptions={this.loadOptions}
                    loadingPlaceholder={LOADING_PLACEHOLDER}
                    closeOnSelect={this.props.closeOnSelect}
                    ignoreCase={false}
                    ignoreAccents={false}
                    value={value}
                    openOnFocus={true}
                    cache={false}
                    valueKey="id"
                    labelKey="name"
                    multi={this.props.multi}
                    clearable={this.props.multi}
                    searchable={true}
                    onCloseResetsInput={true}
                    onBlurResetsInput={true}
                    filterOption={this.filterOption}
                    onChange={onChange}
                    searchPromptText={this.props.searchPromptText}
                    {...options}
                />
            );
        }
    }
}
