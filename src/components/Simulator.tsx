import * as React from 'react';
import * as axios from 'axios';
import * as UUID from 'uuid';
import * as update from 'immutability-helper';
import * as urljoin from 'url-join';
import * as ReactDOM from 'react-dom';

import { Modal } from './Modal';
import { FlowStore } from '../services/FlowStore';
import { Plumber } from '../services/Plumber';
import { External, FlowDetails } from '../services/External';
import { FlowDefinition, Group } from '../FlowDefinition';
import { ActivityManager, Activity } from "../services/ActivityManager";
import { Config, Endpoints } from "../services/Config";

var styles = require("./Simulator.scss");

const ACTIVE = "A";

interface Message {
    text: string;
    inbound: boolean;
}

interface SimulatorProps {
    flow: FlowDefinition;
    showDefinition(definition: FlowDefinition): void;
}

interface SimulatorState {
    visible: boolean;
    session?: Session;
    contact: Contact;
    channel: string;
    events: Event[];
    active: boolean;
}

interface Contact {
    uuid: string,
    urns: string[],
    fields: {},
    groups: Group[]
}

interface Event {
    uuid: string;
    created_on?: Date;
    type: string;
    text?: string;
    name?: string;
    value?: string;
    body?: string;
    email?: string;
    subject?: string;
    url?: string;
    status?: string;
    status_code?: number;
    request?: string;
    response?: string;
    groups?: Group[];
    field_name: string;
    field_uuid: string;
    result_name: string;
}

interface Step {
    arrived_on: Date;
    events: Event[];
    node: string;
    exit_uuid: string;
    node_uuid: string;
}

interface Wait {
    timeout: number;
    type: string;
}

interface Run {
    path: Step[];
    flow_uuid: string;
    status: string;
    wait?: Wait;
}

interface RunContext {
    contact: Contact;
    session: Session;
    events: Event[];
}

interface Session {
    runs: Run[];
    events: Event[];
    input?: any;
}

interface LogEventState {
    detailsVisible: boolean;
}

/**
 * Viewer for log events
 */
class LogEvent extends React.Component<Event, LogEventState> {

    constructor(props: Event) {
        super(props);
        this.state = {
            detailsVisible: false
        }
        this.showDetails = this.showDetails.bind(this);
    }

    showDetails() {
        this.setState({ detailsVisible: true });
    }

    render() {
        var classes = [];
        var text: JSX.Element = null;
        var details: JSX.Element = null;
        var detailTitle = "";

        if (this.props.type == "msg_received") {
            text = (<span>{this.props.text}</span>);
            classes.push(styles.msg_received);
        } else if (this.props.type == "send_msg") {
            var spans = this.props.text.split('\n').map((item, key) => {
                return <span key={key}>{item}<br /></span>
            });
            text = (<span> {spans} </span>);
            classes.push(styles.send_msg);
        } else if (this.props.type == "error") {
            text = (<span> Error: {this.props.text} </span>);
            classes.push(styles.error);
        } else if (this.props.type == "msg_wait") {
            text = (<span>Waiting for reply</span>)
            classes.push(styles.info);
        } else if (this.props.type == "add_to_group") {
            var groupText = "Added to "
            var delim = " "
            for (let group of this.props.groups) {
                groupText += delim + "\"" + group.name + "\""
                delim = ", "
            }
            text = (<span>{groupText}</span>)
            classes.push(styles.info);
        } else if (this.props.type == "remove_from_group") {
            var groupText = "Removed from "
            var delim = " "
            for (let group of this.props.groups) {
                groupText += delim + "\"" + group.name + "\""
                delim = ", "
            }
            text = (<span>{groupText}</span>)
            classes.push(styles.info);
        } else if (this.props.type == "save_contact_field") {
            text = (<span>Set contact field "{this.props.field_name}" to "{this.props.value}"</span>)
            classes.push(styles.info);
        } else if (this.props.type == "save_flow_result") {
            text = (<span>Set flow result "{this.props.result_name}" to "{this.props.value}"</span>)
            classes.push(styles.info);
        } else if (this.props.type == "update_contact") {
            text = (<span>Updated contact {this.props.field_name} to "{this.props.value}"</span>)
            classes.push(styles.info);
        } else if (this.props.type == "send_email") {
            text = (<span>Sent email to "{this.props.email}" with subject "{this.props.subject}" and body "{this.props.body}"</span>)
            classes.push(styles.info);
        } else if (this.props.type == "webhook_called") {
            text = (<span>Called webhook {this.props.url}</span>)
            classes.push(styles.info);
            classes.push(styles.webhook);
            detailTitle = "Webhook Details";
            details = (
                <div className={styles.webhook_details}>
                    <div className={styles.request}>
                        {this.props.request}
                    </div>
                    <div className={styles.response}>
                        {this.props.response}
                    </div>
                </div>
            )
        } else if (this.props.type == "info") {
            text = (<span>{this.props.text}</span>)
            classes.push(styles.info);
        }

        classes.push(styles.evt);

        if (details) {
            classes.push(styles.has_detail)
            return (
                <div>
                    <div className={classes.join(" ")} onClick={this.showDetails}>{text}</div>
                    <Modal
                        className={styles["detail_" + this.props.type]}
                        title={<div>{detailTitle}</div>}
                        show={this.state.detailsVisible}
                        buttons={{
                            primary: {
                                name: "Ok", onClick: () => {
                                    this.setState({ detailsVisible: false });
                                }
                            }
                        }}>

                        <div className={styles.event_viewer}>
                            {details}
                        </div>
                    </Modal>
                </div >
            )
        } else {
            return (
                <div>
                    <div className={classes.join(" ")}>{text}</div>
                </div >
            )
        }
    }
}

/**
 * Our dev console for simulating or testing expressions
 */
export class Simulator extends React.Component<SimulatorProps, SimulatorState> {

    private debug: Session[] = [];
    private flows: FlowDefinition[] = [];
    private currentFlow: string;
    private inputBox: HTMLInputElement;

    private external: External;
    private engineURL: string;

    // marks the bottom of our chat
    private bottom: any;

    constructor(props: SimulatorProps) {
        super(props);
        this.state = {
            active: false,
            visible: false,
            events: [],
            contact: {
                uuid: UUID.v4(),
                urns: ["tel:+12065551212"],
                fields: {},
                groups: []
            },
            channel: UUID.v4(),
        }
        this.currentFlow = this.props.flow.uuid;

        var config = Config.get();
        this.external = config.external;
        this.engineURL = config.endpoints.engine;
    }

    private updateActivity() {

        if (this.state.session) {
            var lastExit: string = null;
            var paths: { [key: string]: number } = {};
            var active: { [nodeUUID: string]: number } = {};
            var activeFlow: string;


            for (let run of this.state.session.runs) {
                var finalStep: Step = null;

                for (let step of run.path) {
                    if (lastExit) {
                        var key = lastExit + ":" + step.node_uuid;
                        var count = paths[key]
                        if (!count) { count = 0 }
                        paths[key] = ++count;
                    }
                    lastExit = step.exit_uuid;
                    finalStep = step;

                }

                if (run.status == ACTIVE && finalStep) {
                    var count = active[finalStep.node_uuid];
                    if (!count) { count = 0 }
                    active[finalStep.node_uuid] = ++count;
                    activeFlow = run.flow_uuid;
                }
            }

            var activity: Activity = { segments: paths, nodes: active };

            // console.log(JSON.stringify(activity, null, 1));
            ActivityManager.get().setSimulation(activity);

            if (activeFlow && activeFlow != this.currentFlow) {
                var flow = this.flows.find((flow: FlowDefinition) => { return flow.uuid == activeFlow });
                if (flow) {
                    this.props.showDefinition(flow);
                }
                this.currentFlow = activeFlow;
            } else if (!activeFlow) {
                this.props.showDefinition(null);
            }
        }
    }

    private updateRunContext(body: any, runContext: RunContext) {
        var events = update(this.state.events, { $push: runContext.events });

        var activeRuns = false;
        for (let run of runContext.session.runs) {
            if (run.status == "A") {
                activeRuns = true;
                break;
            }
        }

        if (!activeRuns) {
            events.push({
                type: "info",
                text: "Exited flow"
            });
        }

        this.setState({
            session: runContext.session,
            contact: runContext.contact,
            events: events,
            active: activeRuns
        }, () => {
            this.updateActivity();
            this.inputBox.focus();
        });
    }

    private startFlow() {

        // reset our events and contact
        this.setState({
            events: [],
            contact: {
                uuid: UUID.v4(),
                urns: ["tel:+12065551212"],
                fields: {},
                groups: []
            }
        }, () => {

            this.external.getFlow(this.props.flow.uuid, true).then((details: FlowDetails) => {
                this.flows = [this.props.flow].concat(details.dependencies)
                var body: any = {
                    flows: this.flows,
                    contact: this.state.contact,
                };

                axios.default.post(urljoin(this.engineURL + '/flow/start'), JSON.stringify(body, null, 2)).then((response: axios.AxiosResponse) => {
                    this.updateRunContext(body, response.data as RunContext);
                });
            });

        });
    }

    private resume(text: string) {
        if (text == "\\debug") {
            console.log(JSON.stringify(this.debug, null, 2));
            return;
        }

        if (text == "\\recalc") {
            console.log("recal..");
            Plumber.get().repaint();
            return;
        }

        this.external.getFlow(this.props.flow.uuid, true).then((details: FlowDetails) => {
            this.flows = [this.props.flow].concat(details.dependencies)
            var body: any = {
                flows: this.flows,
                session: this.state.session,
                contact: this.state.contact,
                event: {
                    type: "msg_received",
                    text: text,
                    urn: this.state.contact.urns[0],
                    channel_uuid: this.state.channel,
                    contact_uuid: this.state.contact.uuid,
                    created_on: new Date(),
                }
            };

            axios.default.post(this.engineURL + 'flow/resume', JSON.stringify(body, null, 2)).then((response: axios.AxiosResponse) => {
                this.updateRunContext(body, response.data as RunContext);
            }).catch((error) => {
                var events = update(this.state.events, {
                    $push: [{
                        type: "error",
                        text: error.response.data.error
                    }]
                });
                this.setState({ events: events });
            });;
        });
    }

    private onReset(event: any) {
        this.startFlow();
    }

    componentDidUpdate(prevProps: SimulatorProps) {
        const node = ReactDOM.findDOMNode(this.bottom);
        if (node != null) {
            node.scrollIntoView(false);
        }
    }

    private onKeyUp(event: any) {
        if (event.key === 'Enter') {
            var ele = event.target;
            var text = ele.value;
            ele.value = "";
            this.resume(text);
        }
    }

    private toggle(event: any) {
        var newVisible = !this.state.visible;
        this.setState({ visible: newVisible }, () => {

            // clear our viewing definition
            if (!this.state.visible) {
                this.props.showDefinition(null);
                window.setTimeout(() => {
                    ActivityManager.get().clearSimulation();
                }, 500);
            } else {
                this.updateActivity();

                // start our flow if we haven't already
                if (this.state.events.length == 0) {
                    this.startFlow();
                }

                this.inputBox.focus();
            }
        });

    }

    public render() {
        var messages: JSX.Element[] = [];
        for (let event of this.state.events) {
            messages.push(<LogEvent {...event} key={String(event.created_on)} />);
        }

        var simHidden = !this.state.visible ? styles.sim_hidden : "";
        var tabHidden = this.state.visible ? styles.tab_hidden : "";

        return (
            <div>
                <div className={styles.simulator_container}>
                    <div className={styles.simulator + " " + simHidden} key={"sim"}>
                        <a className={styles.reset + " " + (this.state.active ? styles.active : styles.inactive)} onClick={this.onReset.bind(this)} />
                        <div className={styles.icon_simulator + " icon-simulator"} />
                        <div className={styles.icon_close + " icon-remove"} onClick={this.toggle.bind(this)} />
                        <div className={styles.screen}>
                            <div className={styles.messages}>
                                {messages}
                                <div id="bottom" style={{ float: "left", clear: "both" }} ref={(el) => { this.bottom = el; }}></div>
                            </div>
                            <div className={styles.controls}>
                                <input ref={(ele) => { this.inputBox = ele }} type="text" onKeyUp={this.onKeyUp.bind(this)} disabled={!this.state.active} placeholder={this.state.active ? "Enter message" : "Press home to start again"} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.simulator_tab + " " + tabHidden} onClick={this.toggle.bind(this)}>
                    <div className={styles.simulator_tab_icon + " icon-simulator"} />
                    <div className={styles.simulator_tab_text}>
                        Run in<br />Simulator
                    </div>
                </div>
            </div>
        )
    }
}

export default Simulator;