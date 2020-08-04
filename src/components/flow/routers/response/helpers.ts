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

export enum AutomatedTestCaseType {
  AUTO_GENERATED,
  USER_GENERATED
}

export const ALLOWED_USER_TESTS = [Operators.has_email, Operators.has_phone, Operators.has_pattern];

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
}

interface ConfigRouter {
  spell_checker?: boolean;
  spelling_correction_sensitivity?: string;
  test_cases?: AutomatedTestCase[];
}

export const matchResponseTextWithCategory = (text: string, cases: CaseProps[]): string[] => {
  let matches: string[] = [];
  let args: string[] = [];
  let emailRegExp = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  let phoneRegExp = /\+(?:[0-9] ?){6,14}[0-9]/;
  let originalText = text;
  text = text.toLowerCase();
  cases.some(item => {
    let match = false;
    let type = item.kase.type;
    switch (type) {
      case 'has_any_word':
        args = item.kase.arguments[0].toLowerCase().split(/[^\w]+/);
        args = args.filter(arg => arg !== '');
        match = args.some(element => new RegExp('\\b(' + element + ')\\b').test(text));
        break;
      case 'has_all_words':
        args = item.kase.arguments[0].toLowerCase().split(/[^\w]+/);
        args = args.filter(arg => arg !== '');
        match = args.every(element => new RegExp('\\b(' + element + ')\\b').test(text));
        break;
      case 'has_phrase':
        match = new RegExp('.*(' + item.kase.arguments[0].toLowerCase() + ').*').test(text);
        break;
      case 'has_only_phrase':
        match = new RegExp('^(' + item.kase.arguments[0].toLowerCase() + ')$').test(text);
        break;
      case 'has_beginning':
        match = new RegExp('^(' + item.kase.arguments[0].toLowerCase() + ').*').test(text);
        break;
      case 'has_email':
        args = text.split(/[^\w@.]+/);
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

export const nodeToState = (
  settings: NodeEditorSettings,
  assetLanguages?: any
): ResponseRouterFormState => {
  let initialCases: CaseProps[] = [];

  // TODO: work out an incremental result name
  let resultName: StringEntry = { value: 'Result' };
  let timeout = 0;
  let enabledSpell = false;
  let spellSensitivity = '70';
  let languages: SelectOption[] = [];
  let testCases: AutomatedTestCase[] = [];

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

    Object.entries(assetLanguages.items).forEach(([_, item]) => {
      // @ts-ignore
      languages.push({ label: item.name, value: item.id });
    });

    if (router.config && router.config.test_cases) {
      testCases = router.config.test_cases;
    } else {
      testCases = generateAutomatedTests(initialCases);
    }
  }

  return {
    cases: initialCases,
    resultName,
    timeout,
    enabledSpell,
    spellSensitivity,
    valid: true,
    testingLangs: languages,
    testingLang: languages[0],
    liveTestText: { value: '' },
    automatedTestCases: testCases
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

  if (state.automatedTestCases.length) {
    config.test_cases = state.automatedTestCases;
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
