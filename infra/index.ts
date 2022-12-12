import * as pulumi from '@pulumi/pulumi';
import * as newrelic from '@pulumi/newrelic';

const name = 'getting-started-pulumi';

// 1.
// Define an alert policy and condition
// 
const policy = new newrelic.AlertPolicy(`${name}-alert`);

export const _policy = policy

// 2.
// Define an alert condition to trigger an alert when the
// service's error rate exceeds 1% over a five-minute period.
// 
const condition = new newrelic.NrqlAlertCondition(`${name}-condition`, {
    policyId: policy.id.apply(id => parseInt(id)),
    nrql: {
        query: `SELECT count(*) FROM TransactionError WHERE (appName = '${name}') AND (\`error.expected\` IS FALSE OR \`error.expected\` IS NULL)`,
    },
    critical: {
        operator: "above",
        threshold: 1,
        thresholdDuration: 300,
        thresholdOccurrences: "at_least_once",
    },
    violationTimeLimitSeconds: 259200,
});

export const _condition = condition

// 3.
// Setup a notification destination.
// 
const notificationDestination = new newrelic.NotificationDestination(`${name}-destination`, {
    type: 'EMAIL',
    properties: [
        {
            key: 'email',
            value: 'pdunbar@newrelic.com',
        },
        {
            key: 'includeJsonAttachment',
            value: pulumi.output('true'),
        }
    ],
});

export const _notificationDestination = notificationDestination

// 4.
// Define a notification channel
// 
const notificationChannel = new newrelic.NotificationChannel(`${name}-channel`, {
    destinationId: notificationDestination.id.apply(id => id),
    product: "IINT",
    properties: [
        // {
        //     key: "subject",
        //     value: "New Subject Title",
        // },
        {
            key: "custom_message",
            value: "{{foobar}}",
        },
    ],
    type: "EMAIL",
});

export const _notificationChannel = notificationChannel

// 5.
// send a notification.
// 
const workflow = new newrelic.Workflow(`${name}-workflow`, {
    issuesFilter: {
        name,
        predicates: [{
            attribute: "labels.policyName",
            operator: "EXACTLY_MATCHES",
            values: [policy.name.apply(name => name)],
        }],
        type: "FILTER",
    },
    destinations: [{
        channelId: notificationChannel.id.apply(id => id)
    }],
    mutingRulesHandling: "NOTIFY_ALL_ISSUES",
});

export const _workflow = workflow