// See Pulumi API Docs for more wizardy:
// https://www.pulumi.com/registry/packages/newrelic/api-docs/
import * as pulumi from '@pulumi/pulumi';
import * as newrelic from '@pulumi/newrelic';

// 
// 0. Name of the app (should match app_name in app/newrelic.js)
// 
const name = 'getting-started-pulumi';

// Load up the configuration state
const config = new pulumi.Config

// 
// 1. Define an alert policy and condition
// 
const policy = new newrelic.AlertPolicy(`${name}-alert`);

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
    ],
    mutingRulesHandling: 'NOTIFY_ALL_ISSUES',
});

// That's all folks!