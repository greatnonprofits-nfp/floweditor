import {TypeConfig, Operator} from '../interfaces';
import {ChangeGroup, ChangeGroupForm} from '../components/actions/ChangeGroup';
import {SaveToContact, SaveToContactForm} from '../components/actions/SaveToContact';
import {SendMessage, SendMessageForm} from '../components/actions/SendMessage';
import {Webhook, WebhookForm} from '../components/actions/Webhook';
import {SendEmail, SendEmailForm} from '../components/actions/SendEmail';
import {SwitchRouterForm} from '../components/routers/SwitchRouter';
import {RandomRouterForm} from '../components/routers/RandomRouter';


export class Config {

    private static singleton: Config = new Config();

    static get(): Config {
        return Config.singleton;
    }

    private constructor() {
        // console.log('init config');
    }

    public typeConfigs: TypeConfig[] = [

        // actions
        {type: "reply", name: "Send Message", description: "Send them a message", form: SendMessageForm, component: SendMessage},
        {type: "add_to_group", name: "Add to Group", description: "Add them to a group", form: ChangeGroupForm, component: ChangeGroup},
        {type: "remove_from_group", name: "Remove from Group", description: "Remove them from a group", form: ChangeGroupForm, component: ChangeGroup},
        {type: "save_to_contact", name: "Update Contact", description: "Update one of their fields", form: SaveToContactForm, component: SaveToContact},
        {type: "email", name: "Send Email", description: "Send an email", form: SendEmailForm, component: SendEmail},
        // {type: "add_label", name: "Add Label", description: "Label the message", component: Missing},
        // {type: "set_preferred_channel", name: "Set Preferred Channel", description: "Set their preferred channel", component: Missing},
        
        // hybrids
        {type: "webhook", name: "Call Webhook", description: "Call a webook", form: WebhookForm, component: Webhook},
        // {type: "flow", name: "Run another flow", description: "Run another flow", component: Missing},

        // routers
        {type: "switch", name: "Wait for Response", description: "Wait for them to respond", form: SwitchRouterForm},
        // {type: "random", name: "Random Split", description: "Split them up randomly", form: RandomRouterForm}

    ]

    public getTypeConfig(type: string): TypeConfig {
        for (let config of this.typeConfigs) {
            if (config.type == type) {
                return config;
            }
        }

        console.error("No configuration found for", type);
        return null;
    }

    public getOperatorConfig(type: string): Operator {
        for (let operator of this.operators) {
            if (operator.type == type) {
                return operator;
            }
        }
        console.error("No operator found for", type);
        return null;
    }

    public operators: Operator[] = [
        { type: "has_any_word", verboseName: "has any of the words", operands: 1},
        { type: "has_all_words", verboseName: "has all of the words", operands: 1},
        { type: "has_phrase", verboseName: "has the phrase", operands: 1},
        { type: "has_only_phrase", verboseName: "has only the phrase", operands: 1},
        { type: "has_beginning", verboseName: "starts with", operands: 1},
        
        // { type: "has_number_between", verboseName: "has a number between", operands: 2},
        { type: "has_number_lt", verboseName: "has a number below", operands: 1},
        { type: "has_number_lte", verboseName: "has a number at or below", operands: 1},
        { type: "has_number_eq", verboseName: "has a number equal to", operands: 1},
        { type: "has_number_gte", verboseName: "has a number at or above", operands: 1},
        { type: "has_number_gt", verboseName: "has a number above", operands: 1},
        
        // { type: "has_date", verboseName: "has a date", operands: 0},
        { type: "has_date_lt", verboseName: "has a date before", operands: 1},
        { type: "has_date_eq", verboseName: "has a date equal to", operands: 1},
        { type: "has_date_gt", verboseName: "has a date after", operands: 1},

        // { type: "has_group", verboseName: "is in the group", operands: 1},        
        // { type: "has_text", verboseName: "has some text", operands: 0},
        // { type: "has_number", verboseName: "has a number", operands: 0},
        // { type: "has_phone", verboseName: "has a phone number", operands: 0},
        // { type: "has_email", verboseName: "has an email", operands: 0},
        // { type: "has_error", verboseName: "has an error", operands: 0},
        // { type: "has_value", verboseName: "is not empty", operands: 0},
    ]
}

export default Config;