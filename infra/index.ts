// 
// See Pulumi API Docs for more wizardy:
// https://www.pulumi.com/registry/packages/newrelic/api-docs/
// 
import * as pulumi from '@pulumi/pulumi';
import * as newrelic from '@pulumi/newrelic';

// 
// 0. Name of the app (should match app_name in app/newrelic.js)
// 
const name = 'getting-started-pulumi';

// Load up the configuration state
const config = new pulumi.Config

// Quick access link to NR1
export const _nr1_link = 'https://one.newrelic.com'

// Fetch app object
export const app = newrelic.getEntityOutput({
    name,
    // type: 'APPLICATION',
});

// Fetch account object
export const account = newrelic.getAccountOutput({
    scope: 'global',
    accountId: newrelic.config.accountId,
});

// 
// 1. Define an alert policy and condition
// 
const policy = new newrelic.AlertPolicy(`${name}-alert`);

// export const _policy = policy

// 
// 2. Define an alert condition to trigger an alert when the
//    service's error rate exceeds 1% over a five-minute period.
// 
const condition = new newrelic.NrqlAlertCondition('condition', {
    description: 'Alert when errors exceed acceptable threshold.',
    policyId: policy.id.apply(id => parseInt(id)),
    nrql: {
        query: `SELECT count(*) FROM TransactionError WHERE (appName = '${name}') AND (\`error.expected\` IS FALSE OR \`error.expected\` IS NULL)`,
    },
    critical: {
        operator: 'above_or_equals',
        threshold: 1,
        thresholdDuration: 300,
        thresholdOccurrences: 'at_least_once',
    },
    violationTimeLimitSeconds: 300000,
}, {
    dependsOn: policy,
});

// export const _condition = condition

// 
// 3.1 Setup a notification destination (email)
// 
const emailDestination = new newrelic.NotificationDestination(`${name}-email`, {
    type: 'EMAIL',
    active: true,
    properties: [
        {
            key: 'email',
            value: config.require('notifyViaEmail'),
        },
        {
            key: 'includeJsonAttachment',
            value: pulumi.output('true'),
        }
    ],
});

// export const _emailDestination = emailDestination

//
// 3.2 Define a notification channel (email)
// 
// Learn how to customize properties values below:
// https://docs.newrelic.com/docs/alerts-applied-intelligence/notifications/message-templates/#variables-menu
// 
const emailChannel = new newrelic.NotificationChannel('email-channel', {
    destinationId: emailDestination.id.apply(id => id),
    product: 'IINT',
    type: 'EMAIL',
    properties: [
        {
            key: 'subject',
            value: '{{issueTitle}}',
        },
        // {
        //     key: 'customDetailsEmail',
        //     value: "issue id: '{{issueId}}'\nimpactedEntitiesCount: '{{impactedEntitiesCount}}'\nentitiesData.entities: '{{entitiesData.entities}}'\nlabels.targetId: '{{labels.targetId}}'\nPolicy Url: '{{policyUrl}}'\n'\n",
        // },
    ],
}, {
    dependsOn: emailDestination,
});

// export const _emailChannel = emailChannel

// 
// -- Setup a notification destination (slack)
// 

const webhookDestination = new newrelic.NotificationDestination(`${name}-webhook`, {
    type: 'WEBHOOK',
    active: true,
    properties: [
        {
            key: 'url',
            value: config.get('notifyViaWebhook') ? config.require('notifyViaWebhook') : '',
        },
    ],
});

// export _webhookDestination = webhookDestination

// 
// -- Define a notification channel (webhook)
//
const webhookChannel = new newrelic.NotificationChannel('webhook-channel', {
    destinationId: webhookDestination.id.apply(id => id),
    product: 'IINT',
    type: 'WEBHOOK',
    properties: [
        {
            key: 'payload',
            value: config.get('webhookPayloadTemplate') ? config.require('webhookPayloadTemplate') : '',
        },
    ],
});

// export const _webhookChannel = webhookChannel

// 
// -- Setup a notification destination (slack)
// 
const slackDestination = new newrelic.NotificationDestination(`${name}-slack`, {
    type: 'SLACK',
    active: true,
    properties: [
        {
            key: 'scope',
            label: 'Permissions',
            value: 'app_mentions:read,channels:join,channels:read,chat:write,chat:write.public,commands,groups:read,links:read,links:write,team:read,users:read',
        },
        {
            key: 'teamName',
            value: config.require('slackTeamName'),
        },
    ]
}, {
    protect: true,
    ignoreChanges: ['authToken'],
});

// export const _slackDestination = slackDestination

//
// -- Define a notification channel (slack)
//
const slackChannel = new newrelic.NotificationChannel('slack-channel', {
    destinationId: slackDestination.id.apply(id => id),
    product: 'IINT',
    type: 'SLACK',
    properties: [
        {
            key: 'channelId',
            value: config.require('slackChannelId'),
        },
        {
            key: 'customDetailsSlack',
            value: "issue id: '{{issueId}}'\nimpactedEntitiesCount: '{{impactedEntitiesCount}}'\nentitiesData.entities: '{{entitiesData.entities}}'\nlabels.targetId: '{{labels.targetId}}'\nPolicy Url: '{{policyUrl}}'\n'\n",
        }
    ],
});

// export const _slackChannel = slackChannel

//
// 4. Create a workflow and attach all notifications.
//
const workflow = new newrelic.Workflow(`${name}-workflow`, {
    accountId: newrelic.config.accountId,
    issuesFilter: {
        name,
        type: 'FILTER',
        predicates: [{
            attribute: 'accumulations.policyName',
            operator: 'EXACTLY_MATCHES',
            values: [policy.name.apply(name => name)],
        }],
    },
    destinations: [
        {
            channelId: emailChannel.id.apply(id => id)
        },
        {
            channelId: webhookChannel.id.apply(id => id)
        },
        {
            channelId: slackChannel.id.apply(id => id)
        },
    ],
    mutingRulesHandling: 'NOTIFY_ALL_ISSUES',
});

// export const _workflow = workflow