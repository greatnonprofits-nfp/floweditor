/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Map, Set } from 'core-js';
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
import moment from 'moment-timezone';

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

const DATE_PATTERNS = {
  DAY_MONTH_YEAR: /(((3[0-1])|([0-2]?[0-9]))[-.\\/_ ]((1[0-2])|(0?[0-9]))[-.\\/_ ]([0-9]{4}|[0-9]{2}))/,
  MONTH_DAY_YEAR: /(((1[0-2])|(0?[0-9]))[-.\\/_ ]((3[0-1])|([0-2]?[0-9]))[-.\\/_ ]([0-9]{4}|[0-9]{2}))/,
  YEAR_MONTH_DAY: /(([0-9]{4})[-]((1[0-2])|(0?[0-9]))[-]((3[0-1])|([0-2]?[0-9])))/,
  ISO_FORMAT: /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.(\d{0,9}))?([+-]\d{2}:\d{2}|Z))/
};

export interface AutomatedTestCase {
  type: AutomatedTestCaseType;
  testText: string;
  actualCategory: string;
  confirmedCategory: string;
  confirmed: boolean;
  deleted: boolean;
}

export interface TimezoneData {
  dateFormat?: string;
  timeZone?: string;
}

interface ConfigRouter {
  spell_checker?: boolean;
  spelling_correction_sensitivity?: string;
  test_cases?: { [lang: string]: AutomatedTestCase[] };
}

enum Comparators {
  EQUAL,
  LESS_THAN,
  GREATER_THAN,
  EXIST
}

const date = (tz?: string, dateString?: string | number, format?: string) => {
  let dateObj;
  if (format) {
    dateObj = dateString
      ? moment.tz(dateString.toString(), [format, 'YYYY-MM-DD'], tz)
      : moment.tz(tz);
  } else {
    dateObj = dateString ? moment.tz(dateString, tz) : moment.tz(tz);
  }

  return dateObj
    .hour(0)
    .minute(0)
    .second(0)
    .millisecond(0);
};

const testDate = (
  message: string,
  daysSinceNow: string,
  comparator: Comparators,
  timezoneData: TimezoneData
) => {
  let dateRegExp = new RegExp(
    `.*\\b(?<date>${
      timezoneData.dateFormat.toUpperCase().replace(new RegExp('[.\\/_]+', 'g'), '-') ===
      'DD-MM-YYYY'
        ? DATE_PATTERNS.DAY_MONTH_YEAR.source
        : DATE_PATTERNS.MONTH_DAY_YEAR.source
    }|${DATE_PATTERNS.YEAR_MONTH_DAY.source}|${DATE_PATTERNS.ISO_FORMAT.source})\\b.*`
  );
  let kwargs = /(?<days>-?\d+)/.exec(daysSinceNow);
  let msgDate = dateRegExp.exec(message);
  let daysToTheTesingDate = Number.parseInt(
    (kwargs ? kwargs : { groups: { days: '' } }).groups.days
  );
  if (!isNaN(daysToTheTesingDate) && msgDate && msgDate.groups.date) {
    let actual: any = date(timezoneData.timeZone, msgDate.groups.date, timezoneData.dateFormat);
    if (actual.isValid()) {
      actual = actual.valueOf();
      if (comparator === Comparators.EXIST) {
        return true;
      }
    } else {
      return false;
    }
    let expected = date(timezoneData.timeZone)
      .add(daysToTheTesingDate, 'days')
      .valueOf();
    switch (comparator) {
      case Comparators.EQUAL:
        return expected === actual;
      case Comparators.LESS_THAN:
        return expected > actual;
      case Comparators.GREATER_THAN:
        return expected < actual;
    }
  }
  return false;
};

const splitRegex = /[[\]{}().?!,:;\s\\/\-*]+/;
const escapeRegex = (str: string) => {
  return str.replace(/[|\\{}()[\]-^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};

const preprocessArgs = (str: string) => {
  return str
    .toLowerCase()
    .replace('+', ' + ')
    .replace('|', ' | ')
    .trim()
    .split(splitRegex)
    .filter(arg => arg !== '')
    .map(escapeRegex);
};

export const matchResponseTextWithCategory = (
  text: string,
  cases: CaseProps[],
  timezoneData: TimezoneData
): string[] => {
  let matches: string[] = [];
  let args: string[] = [];
  let emailRegExp = /.*\b(?<email>\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+)\b.*/;
  let phoneRegExp = /.*\b(?<phone>\+?(?:[0-9] ?){6,14}[0-9])\b.*/;
  let timeRegExp = /.*\b(?<time>([0-9]{1,2}):([0-9]{2})(:([0-9]{2})(\.(\d+))?)?\W*([aApP][mM])?)\b.*/;
  let numberRegExp = /.*\b(?<number>[$£€]?([\d,][\d,.]*([.,]\d+)?)\D*$)\b.*/;
  let originalText = text;
  text = text.toLowerCase();
  let clearText = text
    .split(splitRegex)
    .join(' ')
    .replace('+', ' + ')
    .replace(/\s+/, ' ')
    .trim();
  cases.some(item => {
    let match = false;
    let type = item.kase.type;
    let phrase = '';
    switch (type) {
      case 'has_any_word':
        args = preprocessArgs(item.kase.arguments[0]);
        match =
          args.length > 0 &&
          args.some(element => new RegExp('(^|.*\\s)(' + element + ')(\\s.*|$)').test(clearText));
        break;
      case 'has_all_words':
        args = preprocessArgs(item.kase.arguments[0]);
        match =
          args.length > 0 &&
          args.every(element => new RegExp('(^|.*\\s)(' + element + ')(\\s.*|$)').test(clearText));
        break;
      case 'has_phrase':
        phrase = escapeRegex(item.kase.arguments[0].toLowerCase());
        match = new RegExp('(^|.*\\s)(' + phrase + ')(\\s.*|$)').test(text);
        break;
      case 'has_only_phrase':
        phrase = escapeRegex(item.kase.arguments[0].toLowerCase());
        match = new RegExp('^(' + phrase + ')$').test(text);
        break;
      case 'has_beginning':
        phrase = escapeRegex(item.kase.arguments[0].toLowerCase());
        match = new RegExp('^(' + phrase + ').*').test(text);
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
        match = testDate(originalText, '0', Comparators.EXIST, timezoneData);
        break;
      case 'has_date_eq':
        match = testDate(originalText, item.kase.arguments[0], Comparators.EQUAL, timezoneData);
        break;
      case 'has_date_lt':
        match = testDate(originalText, item.kase.arguments[0], Comparators.LESS_THAN, timezoneData);
        break;
      case 'has_date_gt':
        match = testDate(
          originalText,
          item.kase.arguments[0],
          Comparators.GREATER_THAN,
          timezoneData
        );
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
            Number.parseFloat(item.kase.arguments[0]) <=
              Number.parseFloat(testingNum.groups.number) &&
            Number.parseFloat(item.kase.arguments[1]) >=
              Number.parseFloat(testingNum.groups.number);
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
  cases: CaseProps[],
  timezoneData: TimezoneData
): AutomatedTestCase => {
  let testCase = {
    type: AutomatedTestCaseType.AUTO_GENERATED,
    testText: caseItem.kase.arguments[0],
    actualCategory: matchResponseTextWithCategory(
      caseItem.kase.arguments[0],
      cases,
      timezoneData
    ).join(', '),
    confirmedCategory: caseItem.categoryName
  };
  return testCase as AutomatedTestCase;
};

export const generateAutomatedTests = (
  cases: CaseProps[],
  timezoneData: TimezoneData
): AutomatedTestCase[] => {
  let testCases: AutomatedTestCase[] = [];
  cases = cases.filter(case_ => ALLOWED_AUTO_TESTS.includes(case_.kase.type));
  cases.forEach(item => {
    let testCase = generateAutomatedTest(item, cases, timezoneData);
    if (testCase.confirmedCategory) {
      testCases.push(testCase as AutomatedTestCase);
    }
  });
  return testCases;
};

export const getLocalizedCases = (
  cases: CaseProps[],
  props: RouterFormProps,
  isoLang: string,
  activeLocalizations = new Set()
) => {
  if (isoLang === props.nodeSettings.defaultLanguage) {
    activeLocalizations.add(isoLang);
    return cases;
  }
  let localizations = getLocalizations(
    props.nodeSettings.originalNode.node,
    null,
    props.assetStore.languages.items[isoLang],
    props.nodeSettings.localization ? props.nodeSettings.localization[isoLang] : {}
  );
  let localizedCases = new Map<string, any>();
  let localizedCategories = new Map<string, string>();
  localizations.forEach(localization => {
    let localizedObj: any = localization.getObject();
    if (
      localizedObj.hasOwnProperty('uuid') &&
      localizedObj.hasOwnProperty('type') &&
      localizedObj.hasOwnProperty('category_uuid') &&
      localizedObj.hasOwnProperty('arguments') &&
      localizedObj.arguments.length &&
      localizedObj.arguments[0] !== ''
    ) {
      localizedCases.set(localizedObj.uuid, localizedObj);
      if (localization.isLocalized()) {
        activeLocalizations.add(isoLang);
      }
    }

    if (
      localizedObj.hasOwnProperty('uuid') &&
      localizedObj.hasOwnProperty('name') &&
      localizedObj.hasOwnProperty('exit_uuid')
    ) {
      localizedCategories.set(localizedObj.uuid, localizedObj.name);
      if (localization.isLocalized()) {
        activeLocalizations.add(isoLang);
      }
    }
  });
  /* copying of cases to prevent updating of original cases */
  cases = JSON.parse(JSON.stringify(cases));
  cases.forEach(case_ => {
    let translatedKase = localizedCases.get(case_.kase.uuid);
    if (translatedKase) {
      case_.kase = translatedKase;
    }
    let categoryName = localizedCategories.get(case_.kase.category_uuid);
    if (categoryName && categoryName !== '') {
      case_.categoryName = categoryName;
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
  let localizedCases: { [lang: string]: CaseProps[] } = {};
  let currentLanguage: any = null;
  let testCases: any = {};
  let testResults: any = {};
  let activeLocalizations: Set<string> = new Set<string>();
  let timezoneData: TimezoneData = {
    timeZone: null,
    dateFormat: null
  };

  let environment = props.assetStore.environment.items.environment;
  if (environment) {
    timezoneData = {
      dateFormat: environment.date_format,
      timeZone: environment.timezone
    };
  }

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

    if (!currentLanguage) {
      currentLanguage = { label: 'English', value: settings.defaultLanguage || 'eng' };
      languages.push(currentLanguage);
    }
    languages.forEach(language => {
      localizedCases[language.value] = getLocalizedCases(
        initialCases,
        props,
        language.value,
        activeLocalizations
      );
      if (router.config && router.config.test_cases && router.config.test_cases[language.value]) {
        testCases[language.value] = router.config.test_cases[language.value];
      } else {
        testCases[language.value] = generateAutomatedTests(
          localizedCases[language.value],
          timezoneData
        );
      }
      testResults[language.value] = testCases[language.value].every(
        (testCase: { confirmed: any; actualCategory: any; confirmedCategory: any }) => {
          return testCase.confirmed && testCase.actualCategory === testCase.confirmedCategory;
        }
      );
    });
  }

  // RegexTesting for new wait for resoponse node
  if (!currentLanguage) {
    Object.entries(props.assetStore.languages.items).forEach(([_, item]) => {
      // @ts-ignore
      languages.push({ label: item.name, value: item.id });
      // @ts-ignore
      if (item.id === (settings.defaultLanguage || 'eng')) {
        // @ts-ignore
        currentLanguage = { label: item.name, value: item.id };
      }
    });
    languages.forEach(language => {
      testCases[language.value] = [];
      localizedCases[language.value] = [];
      testResults[language.value] = true;
    });
    activeLocalizations.add(currentLanguage.value);
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
    localizedCases,
    activeLocalizations,
    testResults,
    timezoneData
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
