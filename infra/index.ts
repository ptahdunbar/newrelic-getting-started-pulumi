import * as pulumi from '@pulumi/pulumi';
import * as newrelic from '@pulumi/newrelic';

const name = 'getting-started-pulumi';

// 
// 1. Define an alert policy and condition
// 
const policy = new newrelic.AlertPolicy(`${name}-alert`);

export const _policy = policy

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
        operator: "above",
        threshold: 1,
        thresholdDuration: 300,
        thresholdOccurrences: "at_least_once",
    },
    violationTimeLimitSeconds: 259200,
}, {
    dependsOn: [policy,]
});

// 
// 3. Setup a notification destination.
// 
const notificationDestination = new newrelic.NotificationDestination(`${name}-destination`, {
    type: 'EMAIL',
    properties: [
        {
            key: 'email',
            value: 'example@example.com',
        },
        {
            key: 'includeJsonAttachment',
            value: pulumi.output('true'),
        }
    ],
});

//
// 4. Define a notification channel
// 
const notificationChannel = new newrelic.NotificationChannel(`${name}-channel`, {
    destinationId: notificationDestination.id.apply(id => id),
    product: "IINT",
    properties: [
        // {
        //     key: "subject",
        //     value: "{{issueTitle}}",
        // },
    ],
    type: "EMAIL",
}, {
    dependsOn: [notificationDestination,]
});

// 
// 5. Create a workflow and attach notification channel.
// 
const workflow = new newrelic.Workflow(`${name}-workflow`, {
    accountId: newrelic.config.accountId,
    issuesFilter: {
        name,
        type: "FILTER",
        predicates: [{
            attribute: "labels.policyName",
            operator: "EXACTLY_MATCHES",
            values: [policy.name.apply(name => name)],
        }],
    },
    destinations: [{
        channelId: notificationChannel.id.apply(id => id)
    }],
    mutingRulesHandling: "NOTIFY_ALL_ISSUES",
}, {
    dependsOn: [notificationChannel,]
});

export const _workflow = workflow