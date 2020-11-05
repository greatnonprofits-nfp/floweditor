import * as React from 'react';
import styles from './ContextMenu.module.scss';

interface MenuItem {
  label: string;
  onClick?: (event?: any) => void;
}

export interface ContextMenuProps {
  ref?: any;
  items: MenuItem[];
}

export interface ContextMenuState {
  top: number;
  left: number;
  visible: boolean;
}

export class ContextMenu extends React.Component<ContextMenuProps, ContextMenuState> {
  private wrapperRef: any;

  public constructor(props: ContextMenuProps) {
    super(props);
    this.state = {
      top: 0,
      left: 0,
      visible: false
    };
    this.wrapperRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  public componentDidMount(): void {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  public componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  public handleClickOutside(event: any): void {
    if (
      this.wrapperRef &&
      this.wrapperRef.current &&
      !this.wrapperRef.current.contains(event.target)
    ) {
      this.dismiss();
      event.stopPropagation();
    }
  }

  public show(event?: any): void {
    this.setState({ visible: true, left: event.clientX - 10, top: event.clientY - 10 });
  }

  public dismiss(): void {
    this.setState({ visible: false });
  }

  public render(): JSX.Element | null {
    if (this.state.visible) {
      return (
        <div
          className={styles.contextMenu}
          style={{ left: `${this.state.left}px`, top: `${this.state.top}px` }}
          ref={this.wrapperRef}
        >
          {this.props.items.map((menuItem, index) => (
            <div
              key={index}
              className={styles.menuItem}
              onClick={e => {
                menuItem.onClick(e);
                this.dismiss();
              }}
            >
              {menuItem.label}
            </div>
          ))}
        </div>
      );
    } else {
      return <></>;
    }
  }
}
