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
  ALLOWED_AUTO_TESTS,
  getLocalizedCases
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
  localizedCases?: CaseProps[];
  automatedTestCases?: { [lang: string]: AutomatedTestCase[] };
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

    this.state = nodeToState(this.props.nodeSettings, this.props);

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
    const localizedCases = getLocalizedCases(cases, this.props, this.state.testingLang.value);
    this.setState({ cases, localizedCases, valid: !invalidCase });
    this.retestAutomatedTestCases();
  }

  private handleSave(): void {
    // retest all cases and show error if some of them are failed or unconfirmed
    if (!this.retestAutomatedTestCases()) {
      let message = '';
      if (
        !this.state.automatedTestCases[this.state.testingLang.value].every(
          testCase => testCase.actualCategory === testCase.confirmedCategory
        )
      ) {
        message = 'Test cases have not been confirmed or contain failures.';
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
    if (!this.checkKeywordConflict()) {
      return;
    }
    if (this.state.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private checkKeywordConflict() {
    let cases = this.state.cases.filter(case_ => ALLOWED_AUTO_TESTS.includes(case_.kase.type));
    let triggersDict: any = this.props.assetStore.keywordTriggers.items;
    triggersDict = Object.entries(triggersDict);

    // we shold allow to use triggers of current flow for the first flow step
    if (this.props.nodeSettings.isStartingNode) {
      triggersDict = triggersDict.filter((item: any) => {
        return item[1].content.flow.uuid !== this.props.nodeSettings.flowID;
      });
    }
    let usedKeywords = [];
    for (const [, trigger] of triggersDict) {
      if (
        cases.some(case_ =>
          case_.kase.arguments[0].toLowerCase().includes(trigger.content.keyword.toLowerCase())
        )
      ) {
        usedKeywords.push(trigger.content.keyword);
      }
    }
    if (usedKeywords.length) {
      let singular = usedKeywords.length === 1;
      let body = `${usedKeywords.map(word => `'${word}'`).join(', ')} 
      ${singular ? 'is' : 'are'} used by another flow as an active trigger.
      This means that a user responding with 
      ${singular ? 'this word' : 'these words'} will start a different flow. 
      If you do not intend for this to happen, please change the response rule in this flow step.`;
      // @ts-ignore
      this.props.mergeEditorState({
        modalMessage: {
          title: 'Warning',
          body: body
        },
        saving: false
      });
      return false;
    }
    return true;
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
      ? matchResponseTextWithCategory(this.state.liveTestText.value, this.state.localizedCases)
      : [];
    let automatedTestCases = this.state.automatedTestCases;
    const testAlreadyExists = automatedTestCases[this.state.testingLang.value]
      .filter(test => !test.deleted)
      .some(item => item.testText === this.state.liveTestText.value);
    if (matched.length > 0 && !testAlreadyExists) {
      const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
        $push: [
          {
            type: AutomatedTestCaseType.USER_GENERATED,
            testText: this.state.liveTestText.value,
            actualCategory: matched.join(', '),
            confirmedCategory: matched.join(', '),
            categoriesMatch: false,
            confirmed: false
          }
        ]
      });
      automatedTestCases[this.state.testingLang.value] = updated;
      this.setState({ automatedTestCases, liveTestText: { value: '' } });
    }
  }

  private onConfirmTestCaseClicked(index: number, value: boolean) {
    let dataToChange = { confirmed: value };
    let automatedTestCases = this.state.automatedTestCases;
    if (value) {
      // @ts-ignore
      dataToChange.confirmedCategory =
        automatedTestCases[this.state.testingLang.value][index].actualCategory;
    }
    const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
      [index]: { $merge: dataToChange }
    });
    automatedTestCases[this.state.testingLang.value] = updated;
    this.setState({ automatedTestCases });
  }

  private onConfirmAllClicked() {
    let automatedTests = this.state.automatedTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => {
      item.confirmed = true;
      item.confirmedCategory = item.actualCategory;
    });
    this.setState({ automatedTestCases: automatedTests });
  }

  private onUnconfirmAllClicked() {
    let automatedTests = this.state.automatedTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => (item.confirmed = false));
    this.setState({ automatedTestCases: automatedTests });
  }

  private onDeleteTestCaseClicked(index: number) {
    let dataToChange = { deleted: true };
    let automatedTestCases = this.state.automatedTestCases;
    const updated: any = mutate(automatedTestCases[this.state.testingLang.value], {
      [index]: { $merge: dataToChange }
    });
    automatedTestCases[this.state.testingLang.value] = updated;
    this.setState({ automatedTestCases });
  }

  private onDeleteAllCkicked() {
    let automatedTests = this.state.automatedTestCases;
    automatedTests[this.state.testingLang.value].forEach(item => (item.deleted = true));
    this.setState({ automatedTestCases: automatedTests });
  }

  private retestAutoGeneratedTests() {
    let retestedTestCases: AutomatedTestCase[] = [];
    let testCases = this.state.automatedTestCases[this.state.testingLang.value].filter(
      item => item.type === AutomatedTestCaseType.AUTO_GENERATED
    );
    let testCasesMap = Object.assign({}, ...testCases.map(item => ({ [item.testText]: item })));
    let cases = this.state.localizedCases.filter(case_ =>
      ALLOWED_AUTO_TESTS.includes(case_.kase.type)
    );
    cases.forEach(item => {
      if (item.kase.arguments[0] === '') return;
      if (item.kase.arguments[0] in testCasesMap) {
        let testCase = testCasesMap[item.kase.arguments[0]];
        if (item.categoryName !== testCase.confirmedCategory) {
          let previousCase = testCase;
          testCase = generateAutomatedTest(item, this.state.localizedCases);
          if (testCase.actualCategory === previousCase.actualCategory && previousCase.confirmed) {
            if (cases.some(case_ => case_.categoryName === previousCase.confirmedCategory)) {
              testCase.confirmedCategory = previousCase.confirmedCategory;
              testCase.confirmed = previousCase.confirmed;
              testCase.deleted = previousCase.deleted;
            }
          }
        } else {
          let matched = testCase.testText
            ? matchResponseTextWithCategory(testCase.testText, this.state.localizedCases)
            : [];
          let newActualCategory = matched.join(', ');
          testCase.confirmed =
            newActualCategory === testCase.actualCategory ? testCase.confirmed : false;
          testCase.actualCategory = newActualCategory;
        }
        retestedTestCases.push(testCase);
      } else {
        let testCase = generateAutomatedTest(item, this.state.localizedCases);
        retestedTestCases.push(testCase);
      }
    });
    return retestedTestCases;
  }

  private retestManualyGeneratedTests() {
    let alreadyCreatedManalTests = this.state.automatedTestCases[
      this.state.testingLang.value
    ].filter(item => item.type === AutomatedTestCaseType.USER_GENERATED);
    alreadyCreatedManalTests.forEach(item => {
      let matched = item.testText
        ? matchResponseTextWithCategory(item.testText, this.state.localizedCases)
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
    let automatedTestCases = this.state.automatedTestCases;
    automatedTestCases[this.state.testingLang.value] = [...errored, ...unconfirmed, ...confirmed];
    this.setState({ automatedTestCases });
    let allTestsPassedAndConfirmed = this.state.automatedTestCases[this.state.testingLang.value]
      .filter(testCase => !testCase.deleted)
      .every(
        testCase => testCase.confirmed && testCase.actualCategory === testCase.confirmedCategory
      );
    return allTestsPassedAndConfirmed;
  }

  private onTestingLangChanged(lang: any) {
    let localizedCases = getLocalizedCases(this.state.cases, this.props, lang.value);
    this.setState({ testingLang: lang, localizedCases });
    /* need some time to change language before retesting */
    setTimeout(() => this.retestAutomatedTestCases(), 100);
  }

  private renderTestingTab(): JSX.Element {
    let matched = this.state.liveTestText
      ? matchResponseTextWithCategory(this.state.liveTestText.value, this.state.localizedCases)
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
              onChange={this.onTestingLangChanged}
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
                {this.state.automatedTestCases[this.state.testingLang.value].map(
                  (test, index: number) =>
                    !test.deleted ? (
                      <tr
                        className={
                          test.actualCategory === test.confirmedCategory
                            ? styles.testCorrect
                            : styles.testFailed
                        }
                      >
                        <td>
                          <p className={styles.text} title={test.testText}>
                            {test.testText}
                          </p>
                        </td>
                        <td className={styles.categoryName}>
                          <p className={styles.text} title={test.actualCategory}>
                            {test.actualCategory}
                          </p>
                        </td>
                        <td>
                          <CheckboxElement
                            name="checked"
                            checked={test.confirmed}
                            onChange={value => this.onConfirmTestCaseClicked(index, value)}
                          />
                        </td>
                        <td className={styles.categoryName}>
                          <p className={styles.text} title={test.confirmedCategory}>
                            {test.confirmedCategory}
                          </p>
                        </td>
                        <td>
                          <i
                            className="fe-x"
                            onClick={() => this.onDeleteTestCaseClicked(index)}
                          ></i>
                        </td>
                      </tr>
                    ) : (
                      <></>
                    )
                )}
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
    const checked = this.state.automatedTestCases[this.state.testingLang.value]
      .filter(item => !item.deleted)
      .every(item => item.confirmed && item.actualCategory === item.confirmedCategory);
    let isTestingAvailable = this.state.cases.some(case_ => {
      return (
        ALLOWED_TESTS.includes(case_.kase.type) &&
        ((case_.kase.arguments.length > 0 && case_.kase.arguments[0] !== '') ||
          case_.kase.arguments.length === 0)
      );
    });
    isTestingAvailable =
      isTestingAvailable || this.state.automatedTestCases[this.state.testingLang.value].length > 0;
    const tabs = [
      {
        name: 'Testing',
        checked: checked,
        body: this.renderTestingTab(),
        hasErrors: !checked,
        nameStyle: checked ? '' : styles.testingTabNameError,
        onClick: () => {
          this.retestAutomatedTestCases();
        }
      }
    ];

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={isTestingAvailable ? tabs : []}
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
