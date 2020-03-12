# AWS DAILY BILLING REPORT

A Node.js script with the ```cron``` library that sends an email to some desired email addresses with basic information about the AWS bill. If having AWS multiple accounts, it will check these information for every account.

Example:  

Current bill value: 136.41 USD  
Bill value 24h ago: 100.19 USD  
Last 24h increment: 36.22 USD  

## Requirements

- AWS account
- Subscribe the origin and destination emails in AWS SES (AWS Simple Email Service)

## Installation steps

1. Clone this repository into any directory of your choice

    ```git clone git@github.com:rediris-es/zoom-licenses-chatbot.git```

2. In the same directory, create a file called ```.env``` with the following environment variables. The xxx must be replaced by real values

    | Variable                                 | Description                                      |
    | ---------------------------------------- | ------------------------------------------------ |
    | AWS_ACCESS_KEY_ID=xxx                    | AWS Access Key with Billing permissions          |
    | AWS_SECRET_ACCESS_KEY=xxx                | AWS Secret for the account                       |
    | AWS_REGION=xxx                           | AWS Region (i.e.: eu-west-01)                    |
    | FROM_EMAIL=xxx@xxx                       | Email address from where to send the emails      |
    | TO_EMAILS=["xxx@xxx","xxx@xxx"]          | Email address where to send the emails           |
    | AWS_ACCOUNTS=[{"name":"xxx","id":"xxx"}] | List of AWS accounts to watch                    |
    | CRON='SS MM HH DD MM WD'                 | Cron schedule                                    |

3. Install the project dependencies

    ```npm install```

## Run the script locally

    ```npm start```

## Run the script in Kubernetes

### Build

1. cd to the project directory
2. docker build --no-cache -t ``anyTagName:v1`` .

### Push the image to the Docker registry

docker push anyTagName:v1

### Deploy the image in Kubernetes

kubectl --namespace=``namespaceName`` run ``anyDeploymentName`` --image=``anyTagName:v1``

### Update the image (after building and pushing it)

kubectl --namespace=``namespaceName`` set image deployment/``anyDeploymentName`` ``anyDeploymentName``=``anyTagName:v2`
