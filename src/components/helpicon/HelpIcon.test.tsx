import React from 'react';
import { composeComponentTestUtils } from 'testUtils';
import HelpIcon, { HelpIconProps } from './HelpIcon';

const baseProps: HelpIconProps = {
  iconColor: '#000',
  iconSize: '15px',
  dataFor: 'testNode',
  children: <p>Some test tooltip text</p>
};

const { setup } = composeComponentTestUtils(HelpIcon, baseProps);

describe('HelpIcon component', () => {
  it('should render helper icon with tooltip', () => {
    const { wrapper } = setup();
    expect(wrapper).toMatchSnapshot();
  });
});
