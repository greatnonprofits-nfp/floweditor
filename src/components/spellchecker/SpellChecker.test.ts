import { composeComponentTestUtils } from 'testUtils';
import { SpellChecker, SpellCheckerProps } from './SpellChecker';

const baseProps: SpellCheckerProps = {
  enabledSpell: true,
  onEnabledChange: jest.fn(),
  spellSensitivity: '80',
  onSensitivityChange: jest.fn()
};

const { setup } = composeComponentTestUtils(SpellChecker, baseProps);

describe('SpellChecker component', () => {
  it('should render checkbox and ranger', () => {
    const { wrapper } = setup();
    expect(wrapper).toMatchSnapshot();
  });

  it('should render only checkbox', () => {
    const { wrapper } = setup(false, { $merge: { enabledSpell: false } });
    expect(wrapper).toMatchSnapshot();
  });
});
