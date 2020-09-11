/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { CaseProps } from 'components/flow/routers/caselist/CaseList';
import {
  createCaseProps,
  createRenderNode,
  hasCases,
  resolveRoutes
} from 'components/flow/routers/helpers';
import { ResponseRouterFormState } from 'components/flow/routers/response/ResponseRouterForm';
import { DEFAULT_OPERAND } from 'components/nodeeditor/constants';
import { Types, Operators } from 'config/interfaces';
import { getType } from 'config/typeConfigs';
import { Router, RouterTypes, SwitchRouter, Wait, WaitTypes } from 'flowTypes';
import { RenderNode } from 'store/flowContext';
import { NodeEditorSettings, StringEntry } from 'store/nodeEditor';
import { SelectOption } from 'components/form/select/SelectElement';
import { getLocalizations } from 'store/helpers';
import { RouterFormProps } from 'components/flow/props';

export enum AutomatedTestCaseType {
  AUTO_GENERATED,
  USER_GENERATED
}

export const ALLOWED_USER_TESTS = [
  Operators.has_email,
  Operators.has_phone,
  Operators.has_pattern,
  Operators.has_date,
  Operators.has_date_lt,
  Operators.has_date_eq,
  Operators.has_date_gt,
  Operators.has_time,
  Operators.has_text,
  Operators.has_number,
  Operators.has_number_lt,
  Operators.has_number_lte,
  Operators.has_number_eq,
  Operators.has_number_gte,
  Operators.has_number_gt,
  Operators.has_number_between
];

export const ALLOWED_AUTO_TESTS = [
  Operators.has_any_word,
  Operators.has_all_words,
  Operators.has_phrase,
  Operators.has_only_phrase,
  Operators.has_beginning
];

export const ALLOWED_TESTS = [...ALLOWED_USER_TESTS, ...ALLOWED_AUTO_TESTS];

export interface AutomatedTestCase {
  type: AutomatedTestCaseType;
  testText: string;
  actualCategory: string;
  confirmedCategory: string;
  categoriesMatch: boolean;
  confirmed: boolean;
  deleted: boolean;
}

interface ConfigRouter {
  spell_checker?: boolean;
  spelling_correction_sensitivity?: string;
  test_cases?: { [lang: string]: AutomatedTestCase[] };
}

export const matchResponseTextWithCategory = (text: string, cases: CaseProps[]): string[] => {
  let matches: string[] = [];
  let args: string[] = [];
  let emailRegExp = /.*\b(?<email>\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+)\b.*/;
  let phoneRegExp = /.*\b(?<phone>\+?(?:[0-9] ?){6,14}[0-9])\b.*/;
  let dateRegExp = /.*\b(?<date>([0-9]{1,2})[-.\\/_]([0-9]{1,2})[-.\\/_]([0-9]{4}|[0-9]{2})|([0-9]{4})[-.\\/_]([0-9]{1,2})[-.\\/_]([0-9]{1,2})|\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.(\d{0,9}))?([+-]\d{2}:\d{2}|Z))\b.*/;
  let timeRegExp = /.*\b(?<time>([0-9]{1,2}):([0-9]{2})(:([0-9]{2})(\.(\d+))?)?\W*([aApP][mM])?)\b.*/;
  let numberRegExp = /.*\b(?<number>[$£€]?([\d,][\d,.]*([.,]\d+)?)\D*$)\b.*/;
  let originalText = text;
  text = text.toLowerCase();
  cases.some(item => {
    let match = false;
    let type = item.kase.type;
    switch (type) {
      case 'has_any_word':
        args = item.kase.arguments[0].toLowerCase().split(/\s+/);
        args = args.filter(arg => arg !== '');
        match = args.some(element => new RegExp('(' + element + ')').test(text));
        break;
      case 'has_all_words':
        args = item.kase.arguments[0].toLowerCase().split(/\s+/);
        args = args.filter(arg => arg !== '');
        match = args.every(element => new RegExp('(' + element + ')').test(text));
        break;
      case 'has_phrase':
        match = new RegExp('(^|.*\\s)(' + item.kase.arguments[0].toLowerCase() + ')(\\s.*|$)').test(
          text
        );
        break;
      case 'has_only_phrase':
        match = new RegExp('^(' + item.kase.arguments[0].toLowerCase() + ')$').test(text);
        break;
      case 'has_beginning':
        match = new RegExp('^(' + item.kase.arguments[0].toLowerCase() + ').*').test(text);
        break;
      case 'has_email':
        args = text.split(/\s+/);
        args = args.filter(arg => arg !== '');
        match = args.some(word => emailRegExp.test(word));
        break;
      case 'has_phone':
        match = phoneRegExp.test(text);
        break;
      case 'has_pattern':
        try {
          match = new RegExp(item.kase.arguments[0]).test(originalText);
          // eslint-disable-next-line no-empty
        } catch (error) {}
        break;
      case 'has_date':
        var msgDate = dateRegExp.exec(originalText);
        if (msgDate) {
          match = !isNaN(Date.parse(msgDate.groups.date));
        }
        break;
      case 'has_date_eq':
        var kwargs = /(?<days>-?\d+)/.exec(item.kase.arguments[0]);
        var days = Number.parseInt((kwargs ? kwargs : { groups: { days: '' } }).groups.days);
        // eslint-disable-next-line no-redeclare
        var msgDate = dateRegExp.exec(originalText);
        if (!isNaN(days) && msgDate && Date.parse(msgDate.groups.date)) {
          var exactDay = new Date();
          var testedDate = new Date(Date.parse(msgDate.groups.date));
          testedDate.setHours(0, 0, 0, 0);
          exactDay.setDate(exactDay.getDate() + days);
          exactDay.setHours(0, 0, 0, 0);
          match = exactDay.valueOf() === testedDate.valueOf();
        }
        break;
      case 'has_date_lt':
        // eslint-disable-next-line no-redeclare
        var kwargs = /(?<days>-?\d+)/.exec(item.kase.arguments[0]);
        // eslint-disable-next-line no-redeclare
        var days = Number.parseInt((kwargs ? kwargs : { groups: { days: '' } }).groups.days);
        // eslint-disable-next-line no-redeclare
        var msgDate = dateRegExp.exec(originalText);
        if (!isNaN(days) && msgDate && !isNaN(Date.parse(msgDate.groups.date))) {
          // eslint-disable-next-line no-redeclare
          var exactDay = new Date();
          // eslint-disable-next-line no-redeclare
          var testedDate = new Date(Date.parse(msgDate.groups.date));
          testedDate.setHours(0, 0, 0, 0);
          exactDay.setDate(exactDay.getDate() + days);
          exactDay.setHours(0, 0, 0, 0);
          match = exactDay.valueOf() > testedDate.valueOf();
        }
        break;
      case 'has_date_gt':
        // eslint-disable-next-line no-redeclare
        var kwargs = /(?<days>-?\d+)/.exec(item.kase.arguments[0]);
        // eslint-disable-next-line no-redeclare
        var days = Number.parseInt((kwargs ? kwargs : { groups: { days: '' } }).groups.days);
        // eslint-disable-next-line no-redeclare
        var msgDate = dateRegExp.exec(originalText);
        if (!isNaN(days) && msgDate && !isNaN(Date.parse(msgDate.groups.date))) {
          // eslint-disable-next-line no-redeclare
          var exactDay = new Date();
          // eslint-disable-next-line no-redeclare
          var testedDate = new Date(Date.parse(msgDate.groups.date));
          testedDate.setHours(0, 0, 0, 0);
          exactDay.setDate(exactDay.getDate() + days);
          exactDay.setHours(0, 0, 0, 0);
          match = exactDay.valueOf() < testedDate.valueOf();
        }
        break;
      case 'has_time':
        match = timeRegExp.test(text);
        break;
      case 'has_text':
        match = Boolean(originalText.trim());
        break;
      case 'has_number':
        match = numberRegExp.test(text);
        break;
      case 'has_number_lt':
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) > Number.parseFloat(testingNum.groups.number);
        }
        break;
      case 'has_number_lte':
        // eslint-disable-next-line no-redeclare
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) >=
            Number.parseFloat(testingNum.groups.number);
        }
        break;
      case 'has_number_eq':
        // eslint-disable-next-line no-redeclare
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) ===
            Number.parseFloat(testingNum.groups.number);
        }
        break;
      case 'has_number_gte':
        // eslint-disable-next-line no-redeclare
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) <=
            Number.parseFloat(testingNum.groups.number);
        }
        break;
      case 'has_number_gt':
        // eslint-disable-next-line no-redeclare
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) < Number.parseFloat(testingNum.groups.number);
        }
        break;
      case 'has_number_between':
        // eslint-disable-next-line no-redeclare
        var testingNum = numberRegExp.exec(text);
        if (testingNum) {
          match =
            Number.parseFloat(item.kase.arguments[0]) <
              Number.parseFloat(testingNum.groups.number) &&
            Number.parseFloat(item.kase.arguments[1]) > Number.parseFloat(testingNum.groups.number);
        }
        break;
      default:
        break;
    }
    if (match && item.categoryName !== '') {
      matches.push(item.categoryName);
      // stop iterations to return first matched category
      return true;
    }
    return false;
  });
  return matches;
};

export const generateAutomatedTest = (
  caseItem: CaseProps,
  cases: CaseProps[]
): AutomatedTestCase => {
  let testCase = {
    type: AutomatedTestCaseType.AUTO_GENERATED,
    testText: caseItem.kase.arguments[0],
    actualCategory: matchResponseTextWithCategory(caseItem.kase.arguments[0], cases).join(', '),
    confirmedCategory: caseItem.categoryName
  };
  return testCase as AutomatedTestCase;
};

export const generateAutomatedTests = (cases: CaseProps[]): AutomatedTestCase[] => {
  let testCases: AutomatedTestCase[] = [];
  cases = cases.filter(case_ => ALLOWED_AUTO_TESTS.includes(case_.kase.type));
  cases.forEach(item => {
    let testCase = generateAutomatedTest(item, cases);
    if (testCase.confirmedCategory) {
      testCases.push(testCase as AutomatedTestCase);
    }
  });
  return testCases;
};

export const getLocalizedCases = (cases: CaseProps[], props: RouterFormProps, isoLang: string) => {
  if (isoLang === props.nodeSettings.defaultLanguage) {
    return cases;
  }
  let localizations = getLocalizations(
    props.nodeSettings.originalNode.node,
    null,
    props.assetStore.languages.items[isoLang],
    props.nodeSettings.localization[isoLang]
  );
  // eslint-disable-next-line no-undef
  let localizedCases = new Map();
  localizations.forEach(localization => {
    let localizedObj = localization.getObject();
    if (
      localizedObj.hasOwnProperty('uuid') &&
      localizedObj.hasOwnProperty('type') &&
      localizedObj.hasOwnProperty('category_uuid') &&
      localizedObj.hasOwnProperty('arguments')
    ) {
      localizedCases.set(localizedObj.uuid, localizedObj);
    }
  });
  /* copying of cases to prevent updating of original cases */
  cases = JSON.parse(JSON.stringify(cases));
  cases.forEach(case_ => {
    let translatedKase = localizedCases.get(case_.kase.uuid);
    if (translatedKase) {
      case_.kase = translatedKase;
    }
  });
  return cases;
};

export const nodeToState = (settings: NodeEditorSettings, props?: any): ResponseRouterFormState => {
  let initialCases: CaseProps[] = [];

  // TODO: work out an incremental result name
  let resultName: StringEntry = { value: 'Result' };
  let timeout = 0;
  let enabledSpell = false;
  let spellSensitivity = '70';
  let languages: SelectOption[] = [];
  let localizedCases: CaseProps[] = [];
  let currentLanguage: any = null;
  let testCases: any = {};

  if (settings.originalNode && getType(settings.originalNode) === Types.wait_for_response) {
    const router = settings.originalNode.node.router as SwitchRouter;
    if (router) {
      if (hasCases(settings.originalNode.node)) {
        initialCases = createCaseProps(router.cases, settings.originalNode);
      }

      resultName = { value: router.result_name || '' };
    }

    if (router.config && router.config.spell_checker) {
      enabledSpell = router.config.spell_checker;
      spellSensitivity = router.config.spelling_correction_sensitivity;
    }

    if (settings.originalNode.node.router.wait && settings.originalNode.node.router.wait.timeout) {
      timeout = settings.originalNode.node.router.wait.timeout.seconds || 0;
    }

    Object.entries(props.assetStore.languages.items).forEach(([_, item]) => {
      // @ts-ignore
      languages.push({ label: item.name, value: item.id });
      // @ts-ignore
      if (item.id === (settings.defaultLanguage || 'eng')) {
        // @ts-ignore
        currentLanguage = { label: item.name, value: item.id };
      }
    });

    localizedCases = getLocalizedCases(initialCases, props, currentLanguage.value);

    if (router.config && router.config.test_cases) {
      testCases = router.config.test_cases;
      languages.forEach(lang => {
        if (!testCases[lang.value]) {
          let cases = getLocalizedCases(initialCases, props, lang.value);
          testCases[lang.value] = generateAutomatedTests(cases);
        }
      });
    } else {
      testCases[currentLanguage.value] = generateAutomatedTests(localizedCases);
      languages.forEach(lang => {
        let cases = getLocalizedCases(initialCases, props, lang.value);
        testCases[lang.value] = generateAutomatedTests(cases);
      });
    }
  }

  if (!currentLanguage) {
    currentLanguage = { label: 'English', value: settings.defaultLanguage || 'eng' };
    testCases[currentLanguage.value] = [];
    languages.push(currentLanguage);
  }

  return {
    cases: initialCases,
    resultName,
    timeout,
    enabledSpell,
    spellSensitivity,
    valid: true,
    testingLangs: languages,
    testingLang: currentLanguage,
    liveTestText: { value: '' },
    automatedTestCases: testCases,
    localizedCases
  };
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: ResponseRouterFormState
): RenderNode => {
  const { cases, exits, defaultCategory, timeoutCategory, caseConfig, categories } = resolveRoutes(
    state.cases,
    state.timeout > 0,
    settings.originalNode.node
  );

  const optionalRouter: Pick<Router, 'result_name'> = {};
  if (state.resultName.value) {
    optionalRouter.result_name = state.resultName.value;
  }

  const wait = { type: WaitTypes.msg } as Wait;
  if (state.timeout > 0) {
    wait.timeout = {
      seconds: state.timeout,
      category_uuid: timeoutCategory
    };
  }

  const config: ConfigRouter = {};
  if (state.enabledSpell) {
    config.spell_checker = state.enabledSpell;
    config.spelling_correction_sensitivity = state.spellSensitivity;
  }

  if (state.automatedTestCases) {
    config.test_cases = {};
    for (const [lang, testCases] of Object.entries(state.automatedTestCases)) {
      config.test_cases[lang] = testCases.filter(test => !test.deleted);
    }
  }

  const router: SwitchRouter = {
    type: RouterTypes.switch,
    default_category_uuid: defaultCategory,
    cases,
    categories,
    operand: DEFAULT_OPERAND,
    wait,
    config,
    ...optionalRouter
  };

  const newRenderNode = createRenderNode(
    settings.originalNode.node.uuid,
    router,
    exits,
    Types.wait_for_response,
    [],
    { cases: caseConfig }
  );

  return newRenderNode;
};
