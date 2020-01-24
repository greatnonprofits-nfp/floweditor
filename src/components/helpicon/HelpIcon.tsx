import React from 'react';
import ReactTooltip from 'react-tooltip';
import styles from './HelpIcon.module.scss';

export interface HelpIconProps {
  iconColor: string;
  iconSize: string;
  dataFor: string;
  children: JSX.Element[] | JSX.Element;
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
    <ReactTooltip id={props.dataFor} effect="solid" multiline={true} className={styles.tooltip}>
      {props.children}
    </ReactTooltip>
  </>
);

export default HelpIcon;
