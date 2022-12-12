
## Before you begin
To use this workshop, you should have some basic knowledge of [New Relic](https://newrelic.com), Pulumi, and (Java|Type)Script. Additionally, since you'll be working with Pulumi on the command line, you should [install the Pulumi CLI](https://www.pulumi.com/docs/get-started/install/), and make sure you've installed a recent version of [Node.js](https://nodejs.org/en/) as well.

Be sure to have your New Relic [account ID](https://docs.newrelic.com/docs/accounts/accounts-billing/account-structure/account-id/) and [user key](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/) available.


### Installation
0. `git clone`
1. `cd && npm install`

### Getting Started

#### Configure your credentials
```
pulumi config set newrelic:accountId XXXXXXXXXXXXXX
pulumi config set newrelic:apiKey YYYYYYYYYYYYYY --secret
pulumi config set newrelic:adminApiKey YYYYYYYYYYYYYY --secret
```

#### Start the App
```
node app/index.js
```

#### Setup the Alert Notification
```
pulumi up
```

#### Test the Alert
```
curl http://localhost:3000
```