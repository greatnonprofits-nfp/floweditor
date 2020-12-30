import { react as bindCallbacks } from 'auto-bind';
import Button from 'components/button/Button';
import { Canvas } from 'components/canvas/Canvas';
import { CanvasDraggableProps } from 'components/canvas/CanvasDraggable';
import Node from 'components/flow/node/Node';
import { getDraggedFrom } from 'components/helpers';
import NodeEditor from 'components/nodeeditor/NodeEditor';
import Simulator from 'components/simulator/Simulator';
import Sticky, { STICKY_BODY, STICKY_TITLE } from 'components/sticky/Sticky';
import { ConfigProviderContext, fakePropType } from 'config/ConfigProvider';
import { FlowDefinition, FlowMetadata, FlowPosition } from 'flowTypes';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Plumber from 'services/Plumber';
import { DragSelection, DebugState } from 'store/editor';
import { RenderNode } from 'store/flowContext';
import { createEmptyNode, detectLoops, duplicateNode, getOrderedNodes } from 'store/helpers';
import { NodeEditorSettings, StringEntry } from 'store/nodeEditor';
import AppState from 'store/state';
import {
  ConnectionEvent,
  DispatchWithState,
  mergeEditorState,
  MergeEditorState,
  NoParamsAC,
  onConnectionDrag,
  OnConnectionDrag,
  OnOpenNodeEditor,
  onOpenNodeEditor,
  onRemoveNodes,
  OnRemoveNodes,
  OnUpdateCanvasPositions,
  onUpdateCanvasPositions,
  resetNodeEditingState,
  UpdateConnection,
  updateConnection,
  updateSticky,
  UpdateSticky,
  updateNode,
  UpdateNode
} from 'store/thunks';
import {
  createUUID,
  isRealValue,
  NODE_PADDING,
  renderIf,
  snapToGrid,
  timeEnd,
  timeStart
} from 'utils';
import Debug from 'utils/debug';

import styles from './Flow.module.scss';
import { Trans } from 'react-i18next';
import { PopTabType } from 'config/interfaces';
import i18n from 'config/i18n';
import { RefObject } from 'react';
import { ContextMenu } from 'components/contextmenu/ContextMenu';
import TextInputElement from 'components/form/textinput/TextInputElement';
import Modal from 'components/modal/Modal';
import Dialog from 'components/dialog/Dialog';

declare global {
  interface Window {
    fe: any;
  }
}

export interface FlowStoreProps {
  ghostNode: RenderNode;
  debug: DebugState;
  translating: boolean;
  popped: string;
  dragActive: boolean;

  mergeEditorState: MergeEditorState;

  definition: FlowDefinition;
  nodes: { [uuid: string]: RenderNode };
  metadata: FlowMetadata;
  nodeEditorSettings: NodeEditorSettings;

  updateConnection: UpdateConnection;
  onOpenNodeEditor: OnOpenNodeEditor;
  onUpdateCanvasPositions: OnUpdateCanvasPositions;
  onRemoveNodes: OnRemoveNodes;
  resetNodeEditingState: NoParamsAC;
  onConnectionDrag: OnConnectionDrag;
  updateSticky: UpdateSticky;
  updateNode: UpdateNode;
}

export interface FlowStoreState {
  isClipboardAvailable?: boolean;
  displayClipboardBuffer?: boolean;
  clipboardBuffer?: StringEntry;
  pastingModalCallback?: () => void;
}

export interface Translations {
  [uuid: string]: any;
}

export const DRAG_THRESHOLD = 3;
export const REPAINT_TIMEOUT = 500;
export const GHOST_POSITION_INITIAL = { left: -1000, top: -1000 };

export const nodeSpecId = 'node';
export const nodesContainerSpecId = 'node-container';
export const ghostNodeSpecId = 'ghost-node';
export const dragSelectSpecId = 'drag-select';

export const isDraggingBack = (event: ConnectionEvent) => {
  return event.suspendedElementId === event.targetId && event.source !== null;
};

export const getDragStyle = (drag: DragSelection) => {
  const left = Math.min(drag.startX, drag.currentX);
  const top = Math.min(drag.startY, drag.currentY);
  const width = Math.max(drag.startX, drag.currentX) - left;
  const height = Math.max(drag.startY, drag.currentY) - top;
  return {
    left,
    top,
    width,
    height
  };
};

export class Flow extends React.PureComponent<FlowStoreProps, FlowStoreState> {
  private Plumber: Plumber;
  private ele: HTMLDivElement;
  private nodeContainerUUID: string;

  // Refs
  private ghost: any;

  public static contextTypes = {
    config: fakePropType
  };

  constructor(props: FlowStoreProps, context: ConfigProviderContext) {
    super(props, context);

    this.nodeContainerUUID = createUUID();

    this.Plumber = new Plumber();
    this.state = { clipboardBuffer: { value: '' } };

    /* istanbul ignore next */
    if (context.config.debug) {
      window.fe = new Debug(props, this.props.debug);
    }

    bindCallbacks(this, {
      include: [/Ref$/, /^on/, /^is/, /^get/, /^handle/]
    });

    timeStart('Loaded Flow');
  }

  private onRef(ref: HTMLDivElement): HTMLDivElement {
    return (this.ele = ref);
  }

  private ghostRef(ref: any): any {
    return (this.ghost = ref);
  }

  public componentDidMount(): void {
    this.Plumber.bind('connection', (event: ConnectionEvent) =>
      this.props.updateConnection(event.sourceId, event.targetId)
    );
    this.Plumber.bind('beforeDrag', (event: ConnectionEvent) => {
      this.beforeConnectionDrag(event);
    });

    this.Plumber.bind('connectionDrag', (event: ConnectionEvent) => {
      if (this.context.config.mutable) {
        this.props.onConnectionDrag(event, this.context.config.flowType);
      }
    });

    this.Plumber.bind('connectionDragStop', (event: ConnectionEvent) =>
      this.onConnectorDrop(event)
    );
    this.Plumber.bind(
      'beforeStartDetach',
      (event: ConnectionEvent) => !this.props.translating && this.context.config.mutable
    );
    this.Plumber.bind('beforeDetach', (event: ConnectionEvent) => true);
    this.Plumber.bind('beforeDrop', (event: ConnectionEvent) => {
      if (this.context.config.mutable) {
        return this.onBeforeConnectorDrop(event);
      }
    });
    this.Plumber.triggerLoaded(this.context.config.onLoad);

    timeEnd('Loaded Flow');
  }

  public componentWillUnmount(): void {
    this.Plumber.reset();
  }

  /**
   * Called right before a connector is dropped onto a new node
   */
  private onBeforeConnectorDrop(event: ConnectionEvent): boolean {
    this.props.resetNodeEditingState();
    const fromNodeUUID = event.sourceId.split(':')[0];
    try {
      detectLoops(this.props.nodes, fromNodeUUID, event.targetId);
    } catch {
      return false;
    }
    return true;
  }

  /**
   * Called the moment a connector is done dragging, whether it is dropped on an
   * existing node or on to empty space.
   */
  private onConnectorDrop(event: ConnectionEvent): boolean {
    const ghostNode = this.props.ghostNode;
    // Don't show the node editor if we a dragging back to where we were
    if (isRealValue(ghostNode) && !isDraggingBack(event)) {
      // Wire up the drag from to our ghost node
      this.Plumber.recalculate(ghostNode.node.uuid);

      const dragPoint = getDraggedFrom(ghostNode);

      this.Plumber.connect(dragPoint.nodeUUID + ':' + dragPoint.exitUUID, ghostNode.node.uuid);

      // Save our position for later
      const { left, top } = (this.ghost &&
        snapToGrid(this.ghost.ele.offsetLeft, this.ghost.ele.offsetTop)) || { left: 0, top: 0 };

      this.props.ghostNode.ui.position = { left, top };

      let originalAction = null;
      if (ghostNode.node.actions && ghostNode.node.actions.length === 1) {
        originalAction = ghostNode.node.actions[0];
      }

      // Bring up the node editor
      this.props.onOpenNodeEditor({
        originalNode: ghostNode,
        originalAction
      });
    }

    if (isDraggingBack(event)) {
      this.props.mergeEditorState({ ghostNode: null });
    }

    /* istanbul ignore next */
    document.removeEventListener('mousemove', (window as any).ghostListener);

    return true;
  }

  private beforeConnectionDrag(event: ConnectionEvent): boolean {
    if (event.source) {
      event.source.dispatchEvent(new Event('disconnect'));
    }
    return !this.props.translating;
  }

  private handleStickyCreation(props: CanvasDraggableProps) {
    const stickyMap = this.props.definition._ui.stickies || {};
    const uuid = props.uuid;
    return (
      <Sticky
        key={uuid}
        uuid={uuid}
        sticky={stickyMap[uuid]}
        selected={props.selected}
        mutable={this.context.config.mutable}
      />
    );
  }

  private handleNodeCreation(props: CanvasDraggableProps) {
    const onlyNode = Object.keys(this.props.nodes).length === 1;
    return (
      <Node
        onlyNode={onlyNode}
        startingNode={props.idx === 0}
        selected={props.selected}
        key={props.uuid}
        data-spec={nodeSpecId}
        nodeUUID={props.uuid}
        onNodeCopyClick={() => this.copyNodeToClipboard(props.uuid)}
        plumberMakeTarget={this.Plumber.makeTarget}
        plumberRemove={this.Plumber.remove}
        plumberRecalculate={this.Plumber.recalculate}
        plumberMakeSource={this.Plumber.makeSource}
        plumberConnectExit={this.Plumber.connectExit}
        plumberUpdateClass={this.Plumber.updateClass}
      />
    );
  }

  private getNodes(): CanvasDraggableProps[] {
    return getOrderedNodes(this.props.nodes).map((renderNode: RenderNode, idx: number) => {
      return {
        uuid: renderNode.node.uuid,
        position: renderNode.ui.position,
        elementCreator: this.handleNodeCreation,
        config: renderNode,
        idx
      };
    });
  }

  private copyNodeToClipboard(nodeUUID: string) {
    let node = this.props.nodes[nodeUUID];
    node.inboundConnections = {};
    navigator.clipboard.writeText(JSON.stringify(node)).then(() => console.log('Copied!'));
  }

  private pasteNodeFromClipbord(left: number, top: number): void {
    let callback = () => {
      if (
        !this.state.clipboardBuffer.validationFailures ||
        this.state.clipboardBuffer.validationFailures.length === 0
      ) {
        this.processCreatingOfNewFlowStep(left, top, this.state.clipboardBuffer.value);
        this.setState({
          displayClipboardBuffer: false,
          clipboardBuffer: { value: '' }
        });
      }
    };
    try {
      navigator.clipboard
        .readText()
        .then(text => this.processCreatingOfNewFlowStep(left, top, text))
        .catch(() => {
          this.setState({
            displayClipboardBuffer: true,
            pastingModalCallback: callback
          });
        });
    } catch {
      this.setState({
        displayClipboardBuffer: true,
        pastingModalCallback: callback
      });
    }
  }

  private processCreatingOfNewFlowStep(left: number, top: number, text: string): void {
    try {
      let nodeData: RenderNode = JSON.parse(text);
      if (!(nodeData.ui && nodeData.node)) {
        throw Error('Failed to paste node!');
      }
      let duplicatedNode = duplicateNode(nodeData);
      duplicatedNode.ui.position.left = left;
      duplicatedNode.ui.position.top = top;
      this.props.updateNode(duplicatedNode);
    } catch {
      this.props.mergeEditorState({
        modalMessage: {
          title: "Can't create a flow step.",
          body: 'There are no valid data to be pasted. Please copy one of the flow steps first.'
        },
        saving: false
      });
    }
  }

  private chackIsPasteAvailable(): void {
    try {
      navigator.clipboard
        .readText()
        .then(text => {
          this.setState({ isClipboardAvailable: this.validateStringifiedNode(text) });
        })
        .catch(() => {
          this.setState({ isClipboardAvailable: true });
        });
    } catch {
      this.setState({ isClipboardAvailable: true });
    }
  }

  private validateStringifiedNode(text: string): boolean {
    try {
      let nodeData: RenderNode = JSON.parse(text);
      if (!(nodeData.ui && nodeData.node)) {
        throw Error('No node found in the clipboard!');
      }
      return true;
    } catch {
      return false;
    }
  }

  private getStickies(): CanvasDraggableProps[] {
    const stickyMap = this.props.definition._ui.stickies || {};
    return Object.keys(stickyMap).map((uuid: string, idx: number) => {
      return {
        uuid,
        elementCreator: this.handleStickyCreation,
        position: stickyMap[uuid].position,
        idx
      };
    });
  }

  private getDragNode(): JSX.Element {
    return isRealValue(this.props.ghostNode) ? (
      <div
        data-spec={ghostNodeSpecId}
        key={this.props.ghostNode.node.uuid}
        style={{ position: 'absolute', display: 'block', visibility: 'hidden' }}
      >
        <Node
          onlyNode={false}
          selected={false}
          startingNode={false}
          ref={this.ghostRef}
          ghost={true}
          nodeUUID={this.props.ghostNode.node.uuid}
          plumberMakeTarget={this.Plumber.makeTarget}
          plumberRemove={this.Plumber.remove}
          plumberRecalculate={this.Plumber.recalculate}
          plumberMakeSource={this.Plumber.makeSource}
          plumberConnectExit={this.Plumber.connectExit}
          plumberUpdateClass={this.Plumber.updateClass}
        />
      </div>
    ) : null;
  }

  private getSimulator(): JSX.Element {
    return renderIf(this.context.config.endpoints && this.context.config.endpoints.simulateStart)(
      <Simulator
        key="simulator"
        popped={this.props.popped}
        mergeEditorState={this.props.mergeEditorState}
        onToggled={(visible: boolean, tab: PopTabType) => {
          this.props.mergeEditorState({
            popped: visible ? tab : null
          });
        }}
      />
    );
  }

  private getNodeEditor(): JSX.Element {
    return renderIf(this.props.nodeEditorSettings !== null)(
      <NodeEditor
        key="node-editor"
        helpArticles={this.context.config.help}
        plumberConnectExit={this.Plumber.connectExit}
      />
    );
  }

  // TODO: this should be a callback from the canvas
  private handleDoubleClick(position: FlowPosition): void {
    const { left, top } = position;
    this.props.updateSticky(createUUID(), {
      position: snapToGrid(left - 90 + NODE_PADDING, top - 40),
      title: STICKY_TITLE,
      body: STICKY_BODY
    });
  }

  private getEmptyFlow(): JSX.Element {
    return (
      <div key="create_node" className={styles.empty_flow}>
        <Trans i18nKey="empty_flow_message">
          <h1>Let's get started</h1>
          <div>
            We recommend starting your flow by sending a message. This message will be sent to
            anybody right after they join the flow. This is your chance to send a single message or
            ask them a question.
          </div>
        </Trans>

        <Button
          name={i18n.t('buttons.create_message', 'Create Message')}
          onClick={() => {
            const emptyNode = createEmptyNode(null, null, 1, this.context.config.flowType);
            this.props.onOpenNodeEditor({
              originalNode: emptyNode,
              originalAction: emptyNode.node.actions[0]
            });
          }}
        />
      </div>
    );
  }

  /*
  public componentDidUpdate(prevProps: FlowStoreProps): void {
    traceUpdate(this, prevProps);
  }
  */

  public handleDragging(uuids: string[]): void {
    uuids.forEach((uuid: string) => {
      try {
        const ele = document.getElementById(uuid);
        const exits = ele.querySelectorAll('.jtk-connected');
        this.Plumber.revalidate([ele, ...exits]);
      } catch (error) {}
    });
  }

  public handleCanvasLoaded(): void {
    this.Plumber.setContainer('canvas');
  }

  private getContextMenu(reference: RefObject<any>): JSX.Element {
    let menuItems = [
      {
        label: 'Create Message',
        onClick: (event: MouseEvent) => {
          // @ts-ignore
          const flowEditor = event.currentTarget.parentElement.parentElement;
          const emptyNode = createEmptyNode(null, null, 1, this.context.config.flowType);
          emptyNode.ui.position.left = event.pageX - flowEditor.offsetLeft - 50 || 0;
          emptyNode.ui.position.top = event.pageY - flowEditor.offsetTop - 250 || 0;
          this.props.onOpenNodeEditor({
            originalNode: emptyNode,
            originalAction: emptyNode.node.actions[0]
          });
        }
      },
      {
        label: 'Paste Step',
        hidden: !this.state.isClipboardAvailable,
        onClick: (event: MouseEvent) => {
          // @ts-ignore
          const flowEditor = event.currentTarget.parentElement.parentElement;
          let left = event.pageX - flowEditor.offsetLeft - 50 || 0;
          let top = event.pageY - flowEditor.offsetTop - 250 || 0;
          this.pasteNodeFromClipbord(left, top);
        }
      }
    ];
    return (
      <>
        <ContextMenu ref={reference} items={menuItems} />
        <Modal width="600px" show={this.state.displayClipboardBuffer}>
          <Dialog
            className={styles.alert_modal}
            title="Create Flow Step"
            headerClass="msg"
            buttons={{
              primary: {
                name: 'Ok',
                onClick: this.state.pastingModalCallback
              },
              secondary: {
                name: 'Cancel',
                onClick: () => this.setState({ displayClipboardBuffer: false })
              }
            }}
          >
            <div
              className={styles.alert_body}
              onContextMenu={e => {
                e.stopPropagation();
              }}
            >
              <div style={{ padding: '10px 0' }}>
                Paste the copied text in the box below to duplicate the flow step. You will see a
                long JSON string appear if you are successful. Click the OK button to complete the
                process.
              </div>
              <TextInputElement
                name=""
                showLabel={false}
                onChange={value =>
                  this.setState({
                    clipboardBuffer: {
                      value: value,
                      validationFailures: this.validateStringifiedNode(value)
                        ? []
                        : [{ message: 'Invalid flowstep data' }]
                    }
                  })
                }
                entry={this.state.clipboardBuffer}
                autocomplete={false}
                focus={true}
                textarea={true}
              />
            </div>
          </Dialog>
        </Modal>
      </>
    );
  }

  public render(): JSX.Element {
    const nodes = this.getNodes();

    const draggables = this.getStickies().concat(nodes);
    const contextMenu = React.createRef<any>();

    return (
      <div
        ref={this.onRef}
        style={{ minWidth: document.body.scrollWidth }}
        onContextMenu={e => {
          if (this.context.config.mutable && !this.props.translating) {
            this.chackIsPasteAvailable();
            contextMenu.current.show(e);
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {nodes.length === 0 ? this.getEmptyFlow() : <>{this.getSimulator()}</>}
        {this.getNodeEditor()}
        {this.getContextMenu(contextMenu)}
        <Canvas
          mutable={this.context.config.mutable}
          draggingNew={!!this.props.ghostNode && !this.props.nodeEditorSettings}
          newDragElement={this.getDragNode()}
          onDragging={this.handleDragging}
          uuid={this.nodeContainerUUID}
          dragActive={this.props.dragActive}
          mergeEditorState={this.props.mergeEditorState}
          onRemoveNodes={this.props.onRemoveNodes}
          draggables={draggables}
          onDoubleClick={this.handleDoubleClick}
          onUpdatePositions={this.props.onUpdateCanvasPositions}
          onLoaded={this.handleCanvasLoaded}
        ></Canvas>
        <div id="activity_recent_messages"></div>
      </div>
    );
  }
}

/* istanbul ignore next */
const mapStateToProps = ({
  flowContext: { definition, metadata, nodes },
  editorState: { ghostNode, debug, translating, popped, dragActive },
  // tslint:disable-next-line: no-shadowed-variable
  nodeEditor: { settings }
}: AppState) => {
  return {
    nodeEditorSettings: settings,
    definition,
    nodes,
    metadata,
    ghostNode,
    debug,
    translating,
    popped,
    dragActive
  };
};

/* istanbul ignore next */
const mapDispatchToProps = (dispatch: DispatchWithState) =>
  bindActionCreators(
    {
      mergeEditorState,
      resetNodeEditingState,
      onConnectionDrag,
      onOpenNodeEditor,
      onUpdateCanvasPositions,
      onRemoveNodes,
      updateConnection,
      updateSticky,
      updateNode
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Flow);
