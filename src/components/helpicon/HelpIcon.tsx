import React from 'react';
import classNames from 'classnames/bind';
import ReactTooltip from 'react-tooltip';
import styles from './HelpIcon.module.scss';

export interface HelpIconProps {
  iconColor: string;
  iconSize: string;
  dataFor: string;
  children: JSX.Element[] | JSX.Element;
  bigTooltip?: boolean;
}

const HelpIcon = (props: HelpIconProps): JSX.Element => (
  <>
    <div
      className={styles.icon}
      style={{ color: props.iconColor, fontSize: props.iconSize }}
      data-tip=""
      data-for={props.dataFor}
    >
      <span className="fe-help" />
    </div>
    <ReactTooltip
      id={props.dataFor}
      effect="solid"
      multiline={true}
      delayHide={300}
      className={classNames(styles.tooltip, { [styles.bigTooltip]: props.bigTooltip })}
    >
      {props.children}
    </ReactTooltip>
  </>
);

export default HelpIcon;
