import * as React from "react";
import * as UUID from "uuid";
import { Modal } from "./Modal";
import { Node, Router, Action, SendMessage, UINode } from "../FlowDefinition";
import { TypeConfig, Config } from "../services/Config";
import { ComponentMap } from "./ComponentMap";
import { TextInputElement } from "./form/TextInputElement";
import { FlowContext } from "./Flow";
import { FormWidget, FormValueState } from "./form/FormWidget";
import { FormElementProps } from "./form/FormElement";

var Select = require('react-select');
var formStyles = require("./NodeEditor.scss");
var shared = require("./shared.scss");

export interface NodeEditorProps {
    node: Node;
    action?: Action;

    nodeUI?: UINode;
    actionsOnly: boolean;

    context: FlowContext;

    // actions to perform when we are closed
    onClose?(canceled: boolean): void;
}

export interface NodeEditorState {
    config: TypeConfig;
    show: boolean;
}

function getType(props: NodeEditorProps) {
    var type: string;
    if (props.action) {
        return props.action.type
    } else {
        if (props.nodeUI && props.nodeUI.type) {
            return props.nodeUI.type;
        }
    }

    var details = ComponentMap.get().getDetails(props.node.uuid);
    return details.type;
}

export class NodeEditor extends React.PureComponent<NodeEditorProps, NodeEditorState> {

    private formElement: HTMLFormElement;
    private form: NodeEditorForm<NodeEditorFormState>;

    constructor(props: NodeEditorProps) {
        super(props);

        // determine our initial config
        var type = getType(props);

        if (!type) {
            throw new Error("Cannot initialize NodeEditor without a valid type: " + this.props.node.uuid);
        }

        this.state = {
            show: false,
            config: Config.get().getTypeConfig(type)
        }

        this.onOpen = this.onOpen.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onTypeChange = this.onTypeChange.bind(this);
    }

    getType(): string {
        var type: string;
        if (this.props.action) {
            type = this.props.action.type
        } else {
            var details = ComponentMap.get().getDetails(this.props.node.uuid);
            type = details.type;
        }
        return type;
    }

    open() {
        this.setState({
            show: true,
            config: Config.get().getTypeConfig(getType(this.props))
        });
    }

    close(canceled: boolean) {
        this.setState({
            show: false
        }, () => {
            this.props.onClose(canceled);
        })
    }

    onOpen() {
    };

    onSave() {
        if (this.form.submit()) {
            this.close(false);
        }
    }

    onCancel() {
        this.close(true);
    }

    /**
    * Allow enter key to submit our form
    */
    private onKeyPress(event: React.KeyboardEvent<HTMLFormElement>) {
        // enter key
        if (event.which == 13) {
            var isTextarea = $(event.target).prop("tagName") == 'TEXTAREA'
            if (!isTextarea || event.shiftKey) {
                event.preventDefault();
                this.form.submit();
            }
        }
    }

    private onTypeChange(config: TypeConfig) {
        this.setState({
            config: config
        });
    }

    render() {
        var form: any = null;
        if (this.state.show) {
            // create our form element
            if (this.state.config.form != null) {
                var ref = (ele: any) => { this.form = ele; }

                var formProps: NodeEditorFormProps = {
                    config: this.state.config,
                    node: this.props.node,
                    action: this.props.action,
                    onTypeChange: this.onTypeChange,
                    actionsOnly: this.props.actionsOnly,

                    updateAction: (action: Action) => {
                        this.props.context.eventHandler.onUpdateAction(this.props.node, action);
                    },

                    updateRouter: (node: Node, type: string) => {
                        this.props.context.eventHandler.onUpdateRouter(node, type);
                    }
                };

                form = React.createElement(this.state.config.form, { ref: ref, ...formProps });
            }
        }

        var key = 'modal_' + this.props.node.uuid;
        if (this.props.action) {
            key += '_' + this.props.action.uuid;
        }

        return (
            <Modal
                key={key}
                className={shared[this.state.config.type]}
                width="600px"
                title={<div>{this.state.config.name}</div>}
                show={this.state.show}
                onClickPrimary={this.onSave}
                onClickSecondary={this.onCancel}
                onModalOpen={this.onOpen}
                ok='Save'
                cancel='Cancel'>
                <div className={formStyles.node_editor}>
                    <form onKeyPress={this.onKeyPress} ref={(ele: any) => { this.formElement = ele; }}>
                        {<div>{form}</div>}
                    </form>
                </div>
            </Modal>
        )
    }
}

export interface TypeChooserProps {
    className: string;
    initialType: TypeConfig;
    onChange(config: TypeConfig): void;
    actionsOnly: boolean;
}

export interface TypeChooserState {
    config: TypeConfig;
}

class TypeChooser extends React.PureComponent<TypeChooserProps, TypeChooserState> {

    constructor(props: TypeChooserProps) {
        super(props);

        this.state = {
            config: this.props.initialType
        }
    }

    private onChangeType(config: TypeConfig) {
        this.setState({
            config: config
        }, () => {
            this.props.onChange(config);
        });
    }

    render() {
        var options = [];
        if (this.props.actionsOnly) {
            options = Config.get().getActionTypes();
        } else {
            options = Config.get().typeConfigs;
        }

        return (
            <div className={this.props.className}>
                <p>When a contact arrives at this point in your flow</p>
                <div>
                    <Select
                        value={this.state.config.type}
                        onChange={this.onChangeType.bind(this)}
                        valueKey="type"
                        searchable={false}
                        clearable={false}
                        labelKey="description"
                        options={options}
                    />
                </div>
            </div>
        )
    }
}

abstract class Widget extends FormWidget<FormElementProps, FormValueState> { }

export interface NodeEditorFormProps {
    config: TypeConfig;
    node: Node;
    action?: Action;

    actionsOnly: boolean;
    onTypeChange(config: TypeConfig): void;
    updateAction(action: Action): void;
    updateRouter(node: Node, type: string): void;
}

export interface NodeEditorFormState {
    showAdvanced: boolean;
}

abstract class NodeEditorForm<S extends NodeEditorFormState> extends React.PureComponent<NodeEditorFormProps, S> {

    abstract onValid(): void;
    abstract renderForm(ref: any): JSX.Element;

    private elements: { [name: string]: Widget } = {};
    private advancedWidgets: { [name: string]: boolean } = {};

    public getWidget(name: string): Widget {
        return this.elements[name];
    }

    public renderAdvanced(ref: any): JSX.Element {
        return null;
    }

    public addWidget(widget: Widget) {
        if (widget) {
            if (this.elements) {
                this.elements[widget.props.name] = widget;
            }
        }
    }

    public addAdvancedWidget(widget: Widget) {
        if (widget) {
            this.addWidget(widget);
            this.advancedWidgets[widget.props.name] = true;
        }
    }

    public submit(): boolean {

        var invalid: Widget[] = [];
        for (let key in this.elements) {
            let widget = this.elements[key];
            if (!widget.validate()) {
                invalid.push(widget);
            }
        }

        // if we are valid, submit it
        if (invalid.length == 0) {
            this.onValid();
            return true;
        } else {
            var advError = false;
            for (let widget of invalid) {
                if (this.advancedWidgets[widget.props.name]) {
                    advError = true;
                    break;
                }
            }

            this.setState({ showAdvanced: advError });
        }

        return false;
    }

    render() {
        this.elements = {};
        this.advancedWidgets = {};

        var advanced = this.renderAdvanced(this.addAdvancedWidget.bind(this));

        var form = null;
        var classes = [formStyles.form];
        if (this.state && this.state.showAdvanced) {
            classes.push(formStyles.advanced);
        }

        var advButtons = null;
        if (advanced) {
            advButtons = (
                <div className={formStyles.advanced_buttons}>
                    <div className={formStyles.show_advanced_button} onClick={() => { this.setState({ showAdvanced: true }) }}>Show Advanced</div>
                    <div className={formStyles.hide_advanced_button} onClick={() => { this.setState({ showAdvanced: false }) }}>Hide Advanced</div>
                </div>
            )
        }

        return (
            <div className={classes.join(" ")}>
                {advButtons}
                <TypeChooser className={formStyles.type_chooser} initialType={this.props.config} actionsOnly={this.props.actionsOnly} onChange={this.props.onTypeChange} />
                <div key={"primary"} className={formStyles.primary_form}>
                    {this.renderForm(this.addWidget.bind(this))}
                </div>
                <div key={"secondary"} className={formStyles.advanced_form}>
                    {advanced}
                </div>
            </div>
        )
    }
}

export abstract class NodeActionForm<A extends Action> extends NodeEditorForm<NodeEditorFormState> {
    private actionUUID: string;

    public getInitial(): A {
        if (this.props.action) {
            return this.props.action as A;
        }
        return null;
    }

    public getActionUUID(): string {
        if (this.props.action) {
            return this.props.action.uuid;
        }

        if (!this.actionUUID) {
            this.actionUUID = UUID.v4();
        }
        return this.actionUUID;
    }
}

export abstract class NodeRouterForm<R extends Router, S extends NodeEditorFormState> extends NodeEditorForm<S> {
    public getInitial(): R {
        if (this.props.node.router) {
            return this.props.node.router as R;
        }
    }
}







