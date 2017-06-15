import * as React from 'react';
import * as UUID from 'uuid';
import { NodeForm } from "../NodeForm";
import { SwitchRouterForm } from "./SwitchRouter";
import { StartFlow, Case, Exit, SwitchRouter } from '../../FlowDefinition';
import { NodeModal } from "../NodeModal";
import { FlowElement } from "../form/FlowElement";

/*
interface SubflowProps extends SwitchRouterProps {

}

interface SubflowState extends SwitchRouterState {

}

export class SubflowForm extends SwitchRouterForm<SubflowProps, SubflowState> {

    renderForm(): JSX.Element {
        var flow_name, flow_uuid: string = null;
        if (this.props.action) {
            var action = this.props.action;
            if (action.type == "start_flow") {
                var startAction: StartFlow = action as StartFlow;
                flow_name = startAction.flow_name;
                flow_uuid = startAction.flow_uuid;
            }
        }

        return (
            <div>
                <p>Select a flow to run</p>
                <FlowElement
                    ref={this.ref.bind(this)}
                    name="Flow"
                    endpoint={this.props.context.endpoints.flows}
                    flow_name={flow_name}
                    flow_uuid={flow_uuid}
                    required
                />
            </div>
        )

    }

    getUUID(): string {
        if (this.props.action) {
            return this.props.action.uuid;
        }
        return UUID.v4();
    }

    submit(modal: NodeModal): void {
        var select = this.getElements()[0] as FlowElement;
        var flow = select.state.flow;

        var newAction: StartFlow = {
            uuid: this.getUUID(),
            type: this.props.config.type,
            flow_name: flow.name,
            flow_uuid: flow.id
        }

        // if we were already a subflow, lean on those exits
        var exits = [];
        if (this.props.type == "subflow") {
            exits = this.props.exits;
        } else {
            exits = [
                {
                    uuid: UUID.v4(),
                    name: "Complete",
                    destination_node_uuid: null
                }/*,
                {
                    uuid: UUID.v4(),
                    name: "Other",
                    destination_node_uuid: null
                }*//*
            ]
        }

        var cases: Case[] = [
            {
                uuid: UUID.v4(),
                type: "has_run_status",
                arguments: ["C"],
                exit_uuid: exits[0].uuid
            }
        ]

        var router: SwitchRouter = {
            type: "switch",
            operand: "@child",
            cases: cases,
            default_exit_uuid: null
        }

        // HACK: this should go away with modal <refactor></refactor>
        var nodeUUID = this.props.uuid;
        if (this.props.action && this.props.action.uuid == nodeUUID) {
            nodeUUID = UUID.v4();
        }

        modal.onUpdateRouter({
            uuid: nodeUUID,
            router: router,
            exits: exits,
            actions: [newAction],
            wait: { type: "flow", flow_uuid: flow.id }
        }, "subflow");
    }
}
*/