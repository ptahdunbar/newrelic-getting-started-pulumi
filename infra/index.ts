import * as pulumi from '@pulumi/pulumi';
import * as newrelic from '@pulumi/newrelic';

// Quick access link to NR1
export const _nr1_dashboard = 'https://one.newrelic.com'

// 
// 0. Name of the app (should match app_name in app/newrelic.js)
// 
const name = 'getting-started-pulumi';

// 
// 1. Define an alert policy and condition
// 
const policy = new newrelic.AlertPolicy(`${name}-alert`);

// export const _policy = policy

// 
// 2. Define an alert condition to trigger an alert when the
//    service's error rate exceeds 1% over a five-minute period.
// 
const condition = new newrelic.NrqlAlertCondition(`${name}-condition`, {
    policyId: policy.id.apply(id => parseInt(id)),
    nrql: {
        query: `SELECT count(*) FROM TransactionError WHERE (appName = '${name}') AND (\`error.expected\` IS FALSE OR \`error.expected\` IS NULL)`,
    },
    critical: {
        operator: "above_or_equals",
        threshold: 1,
        thresholdDuration: 300,
        thresholdOccurrences: "at_least_once",
    },
    violationTimeLimitSeconds: 300000,
}, {
    dependsOn: policy,
});

// export const _condition = condition

// 
// 3. Setup a notification destination.
// 
const notificationDestination = new newrelic.NotificationDestination(`${name}-destination`, {
    type: 'EMAIL',
    properties: [
        {
            key: 'email',
            value: 'CHANGEME@example.com',
        },
        {
            key: 'includeJsonAttachment',
            value: pulumi.output('true'),
        }
    ],
});

// export const _notificationDestination = notificationDestination

//
// 4. Define a notification channel
// 
const notificationChannel = new newrelic.NotificationChannel(`${name}-channel`, {
    destinationId: notificationDestination.id.apply(id => id),
    product: "IINT",
    type: "EMAIL",
    properties: [
        // See the link on how to customize customDetailsEmail
        // https://docs.newrelic.com/docs/alerts-applied-intelligence/notifications/message-templates/#variables-menu
        {
            key: "subject",
            value: "{{issueTitle}}",
        },
        // {
        //     key: "customDetailsEmail",
        //     value: "issue id: '{{issueId}}'\nimpactedEntitiesCount: '{{impactedEntitiesCount}}'\nentitiesData.entities: '{{entitiesData.entities}}'\nlabels.targetId: '{{labels.targetId}}'\nPolicy Url: '{{policyUrl}}'\n'\n",
        // },
    ],
}, {
    dependsOn: notificationDestination,
});

// export const _notificationChannel = notificationChannel

// 
// 5. Create a workflow and attach notification channel.
// 
const workflow = new newrelic.Workflow(`${name}-workflow`, {
    accountId: newrelic.config.accountId,
    issuesFilter: {
        name,
        type: "FILTER",
        predicates: [{
            attribute: "accumulations.policyName",
            operator: "EXACTLY_MATCHES",
            values: [policy.name.apply(name => name)],
        }],
    },
    destinations: [{
        channelId: notificationChannel.id.apply(id => id)
    }],
    mutingRulesHandling: "NOTIFY_ALL_ISSUES",
}, {
    dependsOn: notificationChannel,
});

// export const _workflow = workflow