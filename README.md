
## How to send alerts using Pulumi and New Relic Workflows

### Before you begin
To use this workshop, you should have some basic knowledge of [New Relic](https://newrelic.com), Pulumi, and (Java|Type)Script. Additionally, since you'll be working with Pulumi on the command line, you should [install the Pulumi CLI](https://www.pulumi.com/docs/get-started/install/), and make sure you've installed a recent version of [Node.js](https://nodejs.org/en/) as well.

Be sure to have your New Relic [account ID](https://docs.newrelic.com/docs/accounts/accounts-billing/account-structure/account-id/) and [user key](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/) available.


### Installation
0. `git clone`
1. `cd && npm install`

### Getting Started

#### Configure your app
0. `cd app`
1. Install package dependencies
2. Copy the `newrelic.js` config and set the `app_name` and `license_key` respectfully.
3. Profit!

```
npm install
cp node_modules/newrelic/newrelic.js .
```

#### Configure your infrastructure

0. `cd infra`
1. Before running the following script, replace all the placeholder values with their appropriate value.

```
pulumi config set newrelic:accountId XXXXXXXXXXXXXX
pulumi config set newrelic:apiKey YYYYYYYYYYYYYY --secret
pulumi config set newrelic:adminApiKey YYYYYYYYYYYYYY --secret

pulumi config set notifyViaEmail CHANGEME@example.com

pulumi config set notifyViaWebhook https://webhook.site
pulumi config set webhookPayloadTemplate '{"name": "foo"}'

pulumi config set slackChannelId C00YYYYXXXX
pulumi config set slackTeamName AmceCorp
```

#### Start the App
```
node app/index.js
```

#### Setup the Alert Notification
```
cd infra
pulumi up
```

#### Test the Alert
```
curl http://localhost:3000
for i in `seq 1 100`; do curl localhost:3000; done
```

#### Teardown
```
cd infra
pulumi destroy
```


#### Setting up slack integration
* [Slack's authentication requires a UI.](https://docs.newrelic.com/docs/alerts-applied-intelligence/notifications/notification-integrations/#slack)
* <ID> -- After successfully linking slack to newrelic, copy the destination id from the newrelic UI and replace that with <ID>.
* <NAME> -- The name MUST be the same as the `slackDestination` name.
* `cd infra`

```
pulumi import newrelic:index/notificationDestination:NotificationDestination getting-started-pulumi-slack <ID>
```