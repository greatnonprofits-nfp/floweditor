/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import i18n from 'config/i18n';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import CaseList, { CaseProps } from 'components/flow/routers/caselist/CaseList';
import {
  nodeToState,
  stateToNode,
  matchResponseTextWithCategory,
  AutomatedTestCase,
  AutomatedTestCaseType,
  generateAutomatedTest,
  ALLOWED_TESTS,
  ALLOWED_AUTO_TESTS
} from 'components/flow/routers/response/helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TimeoutControl from 'components/form/timeout/TimeoutControl';
import TypeList from 'components/nodeeditor/TypeList';
import { FormState, StringEntry } from 'store/nodeEditor';
import { Alphanumeric, StartIsNonNumeric, validate } from 'store/validators';
import { WAIT_LABEL } from 'components/flow/routers/constants';
import { SpellChecker } from 'components/spellchecker/SpellChecker';
import { fakePropType } from 'config/ConfigProvider';
import styles from './ResponseRouterForm.module.scss';
import Select from 'react-select';
import { SelectOption } from 'components/form/select/SelectElement';
import { small } from 'utils/reactselect';
import TextInputElement from 'components/form/textinput/TextInputElement';
import Pill from 'components/pill/Pill';
import Button, { ButtonTypes } from 'components/button/Button';
import CheckboxElement from 'components/form/checkbox/CheckboxElement';
import mutate from 'immutability-helper';

// TODO: Remove use of Function
// tslint:disable:ban-types
export enum InputToFocus {
  args = 'args',
  min = 'min',
  max = 'max',
  exit = 'exit'
}

interface TestingFormState {
  testingLang?: SelectOption;
  testingLangs?: SelectOption[];
  liveTestText?: StringEntry;
  automatedTestCases?: AutomatedTestCase[];
}

export interface ResponseRouterFormState extends FormState, TestingFormState {
  cases: CaseProps[];
  resultName: StringEntry;
  timeout: number;
  enabledSpell: boolean;
  spellSensitivity: string;
}

export const leadInSpecId = 'lead-in';

export default class ResponseRouterForm extends React.Component<
  RouterFormProps,
  ResponseRouterFormState
> {
  public constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings, this.props.assetStore.languages);

    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  public static contextTypes = {
    config: fakePropType
  };

  private handleUpdateResultName(value: string): void {
    const resultName = validate('Result Name', value, [Alphanumeric, StartIsNonNumeric]);
    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  }

  private handleUpdateTimeout(timeout: number): void {
    this.setState({ timeout });
  }

  private handleCasesUpdated(cases: CaseProps[]): void {
    const invalidCase = cases.find((caseProps: CaseProps) => !caseProps.valid);
    this.setState({ cases, valid: !invalidCase });
    this.retestAutomatedTestCases();
  }

  private handleSave(): void {
    // retest all cases and show error if some of them are failed or unconfirmed
    if (!this.retestAutomatedTestCases()) {
      let message = '';
      if (
        !this.state.automatedTestCases.every(
          testCase => testCase.actualCategory === testCase.confirmedCategory
        )
      ) {
        message = 'Some of tests are failed. Fix errors or confirm new test behavior.';
      } else {
        message = 'You have unconfirmed test results. Please confirm the results before saving.';
      }
      // @ts-ignore
      this.props.mergeEditorState({
        modalMessage: {
          title: "This data can't be saved",
          body: message
        },
        saving: false
      });
      return;
    }
    if (this.state.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
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

  private onEnabledChange(): void {
    this.setState(prevState => ({ enabledSpell: !prevState.enabledSpell }));
  }

  private onSensitivityChange(event: React.FormEvent<HTMLInputElement>): void {
    this.setState({ spellSensitivity: event.currentTarget.value });
  }

  private renderSpellChecker(): JSX.Element {
    if (!(this.context.config.filters || []).find((name: string) => name === 'spell_checker')) {
      return (
        <SpellChecker
          enabledSpell={this.state.enabledSpell}
          onEnabledChange={this.onEnabledChange}
          spellSensitivity={this.state.spellSensitivity}
          onSensitivityChange={this.onSensitivityChange}
        />
      );
    }
  }

  private onAddTestCaseClicked() {
    let matched = this.state.liveTestText
      ? matchResponseTextWithCategory(this.state.liveTestText.value, this.state.cases)
      : [];
    if (matched.length > 0) {
      const updated: any = mutate(this.state.automatedTestCases, {
        $push: [
          {
            type: AutomatedTestCaseType.USER_GENERATED,
            testText: this.state.liveTestText.value,
            actualCategory: matched.join(', '),
            confirmedCategory: '',
            categoriesMatch: false,
            confirmed: false
          }
        ]
      });
      this.setState({ automatedTestCases: updated, liveTestText: { value: '' } });
    }
  }

  private onConfirmTestCaseClicked(index: number, value: boolean) {
    let dataToChange = { confirmed: value };
    if (value) {
      // @ts-ignore
      dataToChange.confirmedCategory = this.state.automatedTestCases[index].actualCategory;
    }
    const updated: any = mutate(this.state.automatedTestCases, {
      [index]: { $merge: dataToChange }
    });
    this.setState({ automatedTestCases: updated });
  }

  private onConfirmAllClicked() {
    let automatedTests = this.state.automatedTestCases;
    automatedTests.forEach(item => {
      item.confirmed = true;
      item.confirmedCategory = item.actualCategory;
    });
    this.setState({ automatedTestCases: automatedTests });
  }

  private onUnconfirmAllClicked() {
    let automatedTests = this.state.automatedTestCases;
    automatedTests.forEach(item => (item.confirmed = false));
    this.setState({ automatedTestCases: automatedTests });
  }

  private onDeleteTestCaseClicked(index: number) {
    // we found a match, merge us in
    const updated: any = mutate(this.state.automatedTestCases, {
      $splice: [[index, 1]]
    });
    this.setState({ automatedTestCases: updated });
  }

  private onDeleteAllCkicked() {
    this.setState({ automatedTestCases: [] });
  }

  private retestAutoGeneratedTests() {
    let retestedTestCases: AutomatedTestCase[] = [];
    let testCases = this.state.automatedTestCases.filter(
      item => item.type === AutomatedTestCaseType.AUTO_GENERATED
    );
    let testCasesMap = Object.assign({}, ...testCases.map(item => ({ [item.testText]: item })));
    let cases = this.state.cases.filter(case_ => ALLOWED_AUTO_TESTS.includes(case_.kase.type));
    cases.forEach(item => {
      if (item.kase.arguments[0] === '') return;
      if (item.kase.arguments[0] in testCasesMap) {
        let testCase = testCasesMap[item.kase.arguments[0]];
        if (item.categoryName !== testCase.confirmedCategory) {
          testCase = generateAutomatedTest(item, this.state.cases);
        } else {
          let matched = testCase.testText
            ? matchResponseTextWithCategory(testCase.testText, this.state.cases)
            : [];
          let newActualCategory = matched.join(', ');
          testCase.confirmed =
            newActualCategory === testCase.actualCategory ? testCase.confirmed : false;
          testCase.actualCategory = newActualCategory;
        }
        retestedTestCases.push(testCase);
      } else {
        let testCase = generateAutomatedTest(item, this.state.cases);
        retestedTestCases.push(testCase);
      }
    });
    return retestedTestCases;
  }

  private retestManualyGeneratedTests() {
    let alreadyCreatedManalTests = this.state.automatedTestCases.filter(
      item => item.type === AutomatedTestCaseType.USER_GENERATED
    );
    alreadyCreatedManalTests.forEach(item => {
      let matched = item.testText
        ? matchResponseTextWithCategory(item.testText, this.state.cases)
        : [];
      let newActualCategory = matched.join(',');
      item.confirmed = newActualCategory === item.actualCategory ? item.confirmed : false;
      item.actualCategory = newActualCategory;
    });
    return alreadyCreatedManalTests;
  }

  private retestAutomatedTestCases(): boolean {
    let automatedTests = this.retestAutoGeneratedTests();
    let manualTests = this.retestManualyGeneratedTests();
    let allTests = [...automatedTests, ...manualTests];
    let errored = allTests.filter(item => item.actualCategory !== item.confirmedCategory);
    let unconfirmed = allTests.filter(
      item => item.actualCategory === item.confirmedCategory && !item.confirmed
    );
    let confirmed = allTests.filter(
      item => item.actualCategory === item.confirmedCategory && item.confirmed
    );
    this.setState({ automatedTestCases: [...errored, ...unconfirmed, ...confirmed] });
    let allTestsPassedAndConfirmed = this.state.automatedTestCases.every(
      testCase => testCase.confirmed && testCase.actualCategory === testCase.confirmedCategory
    );
    return allTestsPassedAndConfirmed;
  }

  private renderTestingTab(): JSX.Element {
    let matched = this.state.liveTestText
      ? matchResponseTextWithCategory(this.state.liveTestText.value, this.state.cases)
      : [];
    let filteredCases = this.state.cases.filter(case_ => ALLOWED_TESTS.includes(case_.kase.type));
    let cases = Object.assign(
      {},
      ...filteredCases.map(item => ({
        [item.categoryName]: {
          case: item,
          matched: matched.some(categoryName => categoryName === item.categoryName)
        }
      }))
    );

    return (
      <div className={styles.testingTab}>
        <div className={styles.liveTests}>
          <div className={styles.header}>Live Tests</div>
          <div className={styles.body}>
            <Select
              name="Intent"
              value={this.state.testingLang}
              options={this.state.testingLangs}
              onChange={(lang: any) => {
                this.setState({ testingLang: lang });
              }}
              placeholder="Language"
              isSearchable={false}
              className={styles.languageSelect}
              styles={small as any}
            ></Select>
            <div className={styles.testLine}>
              <TextInputElement
                name="arguments"
                onChange={text => this.setState({ liveTestText: { value: text } })}
                entry={this.state.liveTestText}
                placeholder={'Type text for testing'}
              />
            </div>
            <div className={styles.categoriesContainer}>
              {Object.entries(cases).map(([key, value]) => {
                // eslint-disable-next-line
                if (key === '') return;

                return (
                  // @ts-ignore
                  <div className={value.matched ? styles.categoryMatched : styles.categoryName}>
                    <Pill large={true} text={key || 'Other'} />
                  </div>
                );
              })}
            </div>
            <div className={styles.buttons}>
              <Button
                name="Save Test"
                onClick={this.onAddTestCaseClicked}
                type={ButtonTypes.secondary}
              />
            </div>
          </div>
        </div>
        <div className={styles.automatedTests}>
          <div className={styles.header}>Automated Tests</div>
          <div className={styles.body}>
            <table>
              <thead>
                <tr>
                  <th>Test Text</th>
                  <th>Current Category</th>
                  <th>Confirm</th>
                  <th>Confirmed Category</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {this.state.automatedTestCases.map((test, index: number) => (
                  <tr
                    className={
                      test.actualCategory === test.confirmedCategory
                        ? styles.testCorrect
                        : styles.testFailed
                    }
                  >
                    <td>{test.testText}</td>
                    <td className={styles.categoryName}>{test.actualCategory}</td>
                    <td>
                      <CheckboxElement
                        name="checked"
                        checked={test.confirmed}
                        onChange={value => this.onConfirmTestCaseClicked(index, value)}
                      />
                    </td>
                    <td className={styles.categoryName}>{test.confirmedCategory}</td>
                    <td>
                      <i className="fe-x" onClick={() => this.onDeleteTestCaseClicked(index)}></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.buttons}>
              <Button
                name="Confirm All"
                onClick={this.onConfirmAllClicked}
                type={ButtonTypes.secondary}
              />
              <Button
                name="Unconfirm All"
                onClick={this.onUnconfirmAllClicked}
                type={ButtonTypes.secondary}
              />
              <Button
                name="Delete All"
                onClick={this.onDeleteAllCkicked}
                type={ButtonTypes.secondary}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  public renderEdit(): JSX.Element {
    const typeConfig = this.props.typeConfig;
    const checked = this.state.automatedTestCases.every(
      item => item.confirmed && item.actualCategory === item.confirmedCategory
    );
    const tabs = [
      {
        name: 'Testing',
        checked: checked,
        body: this.renderTestingTab(),
        hasErrors: !checked
      }
    ];

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={this.state.automatedTestCases.length > 0 ? tabs : []}
        gutter={
          <TimeoutControl timeout={this.state.timeout} onChanged={this.handleUpdateTimeout} />
        }
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        {this.renderSpellChecker()}
        <div>{WAIT_LABEL}</div>
        <CaseList
          data-spec="cases"
          cases={this.state.cases}
          onCasesUpdated={this.handleCasesUpdated}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }

  public render(): JSX.Element {
    return this.renderEdit();
  }
}
