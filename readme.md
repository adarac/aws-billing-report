# AWS BILLING REPORT

A Node.js script that sends an email to some desired email addresses with basic information about the AWS bill. If having AWS multiple accounts, it will check these information for every account.

**Example**:  

Current bill value: 135.00 USD  
Bill value 24h ago: 100.00 USD  
Last 24h increment: 35.00 USD  

## Contents
1. [Requirements](#Requirements)
2. [Installation steps](#Installation-steps)
3. [Run the script locally](#Run-the-script-locally)
4. [Run the script in a Docker container](#Run-the-script-in-a-Docker-container)
5. [Run the script in Kubernetes](#Run-the-script-in-Kubernetes)

## Requirements

- AWS account with Billing permissions
- Two options:
    - **OPTION 1 (mailer)**: If you want to send the report from a Gmail account using Nodemailer, you need to create a project using the Gmail API in <https://console.developers.google.com/> and authorize the application.
    - **OPTION 2 (ses)**: If you prefer to send the report from AWS SES (AWS Simple Email Service), you must subscribe the origin and destination emails in AWS SES.

## Installation steps

1. Clone this repository into any directory of your choice

    ```git clone git@github.com:adarac/aws-billing-report-cron.git```

2. In the same directory, create a file called ```.env``` with the following environment variables. The xxx must be replaced by real values

    | Variable                                 | Description                                      |
    | ---------------------------------------- | ------------------------------------------------ |
    | AWS_ACCESS_KEY_ID=xxx                    | AWS Access Key with Billing permissions          |
    | AWS_SECRET_ACCESS_KEY=xxx                | AWS Secret for the account                       |
    | AWS_REGION=xxx                           | AWS Region (ie: ``us-east-1``)                   |
    | TO_EMAILS=["xxx@xxx","xxx@xxx"]          | Email address where to send the emails           |
    | AWS_ACCOUNTS=[{"name":"xxx","id":"xxx"}] | List of AWS accounts to watch                    |
    | SENDING_METHOD=xxx                       | Sending method chosen: ``mailer`` or ``ses``     |

    For **OPTION 1 (mailer)**, add these variables:

    | Variable                                 | Description                                      |
    | ---------------------------------------- | ------------------------------------------------ |
    | GMAIL_USER=xxx@gmail<i></i>.com          | Gmail account from where to send the emails      |
    | GMAIL_CLIENT_ID=xxx                      | Obtained from the Google API Console             |
    | GMAIL_CLIENT_SECRET=xxx                  | Obtained from the Google API Console             |
    | GMAIL_REFRESH_TOKEN=xxx                  | Obtained from the Google API Console             |
    | GMAIL_ACCESS_TOKEN=xxx                   | Obtained from the Google API Console             |

    For **OPTION 2 (ses)**, add this variable:

    | Variable                                 | Description                                      |
    | ---------------------------------------- | ------------------------------------------------ |
    | FROM_EMAIL=xxx@xxx                       | Email address from where to send the emails      |

3. Install the project dependencies

    ```npm install```

## Run the script locally

```npm start```

## Run the script in a Docker container

### Build the image

cd to the project directory  
docker build --no-cache -t ``tagName`` .

### Run the image in a container

docker run ``tagName``

## Run the script in Kubernetes

### Build the image

cd to the project directory  
docker build --no-cache -t ``tagName:v1`` .

### Push the image to your Docker registry

docker push ``tagName:v1``

### Deploy the image in Kubernetes

kubectl --namespace=``namespaceName`` run ``deploymentName`` --image=``tagName:v1``

### Update the image (after building and pushing it)

kubectl --namespace=``namespaceName`` set image deployment/``deploymentName`` ``deploymentName``=``tagName:v2`
