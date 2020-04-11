/*
* Documentation: 
* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#getMetricStatistics-property
* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
* https://developers.google.com/gmail/api/auth/web-server?hl=es
*
*/ 

//// Requires and configuration

require('dotenv').config({path:`${__dirname}/.env`})
const AWS = require('aws-sdk')
const nodemailer = require('nodemailer');

//// Main function 

let init = async () => {

    //// AWS Cloudwatch query parameters

    let date = new Date()

    // Last 12 hours total bill

    let oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    let paramsOneDayAgo = {
        "Namespace": "AWS/Billing",
        "MetricName": "EstimatedCharges",
        "Dimensions": [{
            "Name": "Currency",
            "Value": "USD"
        }],
        "StartTime": oneDayAgo,
        "EndTime": date,
        "Statistics": [ "Maximum" ],
        "Period": 60
    }

    // One day ago total bill

    let twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    let paramsTwoDaysAgo = {
        "Namespace": "AWS/Billing",
        "MetricName": "EstimatedCharges",
        "Dimensions": [{
            "Name": "Currency",
            "Value": "USD"
        }],
        "StartTime": twoDaysAgo,
        "EndTime": oneDayAgo,
        "Statistics": [ "Maximum" ],
        "Period": 60
    }

    // Get the report message with the values obtained from AWS Cloudwatch in HTML format

    let messages = await getMessages(JSON.parse(process.env.AWS_ACCOUNTS),[], paramsOneDayAgo, paramsTwoDaysAgo)

    // Send the report by email

    await sendEmail(process.env.SENDING_METHOD, messages, process.env.TO_EMAILS)

}	

init();

//// Funtions

// Function that returns the messages to include in the report, for each account, with the values obtained from Cloudwatch
async function getMessages (accounts, messages, paramsOneDayAgo, paramsTwoDaysAgo) {

    for await (let account of accounts) {

        paramsOneDayAgo.Dimensions.push({ "Name": "LinkedAccount", "Value": account.id })
        paramsTwoDaysAgo.Dimensions.push({ "Name": "LinkedAccount", "Value": account.id })

        await messages.push(await getIncrement(account.name, paramsOneDayAgo, paramsTwoDaysAgo))
    
    }

    return await messages

}

// Function that calculates the difference between the values and returns it formatted as an HTML message
async function getIncrement (account, paramsOneDayAgo, paramsTwoDaysAgo) {

    let oneDayAgoTotal = await executeRequest(paramsOneDayAgo)
    .then((data) => {
        if (data.Datapoints[0]){
            return data.Datapoints[0].Maximum 
        } else {
            throw new Error('Impossible to get the metric from AWS')
        }
    })
    .catch((e) => {
        console.log(e)
    })

    let twoDaysAgoTotal = await executeRequest(paramsTwoDaysAgo)
    .then((data) => {
        if (data.Datapoints[0]){
            return data.Datapoints[0].Maximum 
        } else {
            throw new Error('Impossible to get the metric from AWS')
        }
    })
    .catch((e) => {
        console.log(e)
    })

    // Increment
    let increment = (oneDayAgoTotal - twoDaysAgoTotal).toFixed(2)

    // Return message
    let message = `<h4>${account} account</h4><p>Current bill value: ${oneDayAgoTotal} USD</p><p>Bill value 24h ago: ${twoDaysAgoTotal} USD</p><p>Last 24h increment: <b>${increment} USD</b></p>`
    return message
}

// Function that queries AWS Cloudwatch to get the billing values
function executeRequest (params) {
    return new Promise((resolve, reject) => {

        const cloudwatch = new AWS.CloudWatch()

        cloudwatch.getMetricStatistics(params, (err, data) => {
            if (err) reject(err, err.stack)
            else     resolve(data)
        })

    })
}

// Function that sends the report by email
async function sendEmail (sendingMethod, messages, toEmails) {

    if (sendingMethod !== 'mailer' && sendingMethod !== 'ses') {

        throw new Error('I\'m sorry, you must set the environment variable "SENDING_METHOD" to either "mailer" or "ses".')

    } else if (sendingMethod == 'mailer') {

    //********* WITH NODEMAILER *********//

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_USER,
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: process.env.GMAIL_ACCESS_TOKEN
            }
        })

        let mailOptions = {
            from: `AWS Billing Report <${process.env.GMAIL_USER}>`,
            to: toEmails,
            subject: 'AWS Billing Report',
            text: `<h3>AWS daily billing report</h3>${await messages.join('')}`,
            html: `<h3>AWS daily billing report</h3>${await messages.join('')}`
        }

        await transporter.sendMail(mailOptions, (err, res) => { 
            if (err) {
                console.log(err)
            } else {
                console.log(`${new Date().toISOString()} :: Email sent`)
            }
        });

    } else if (sendingMethod == 'mailer') {

    //********* WITH AWS SES *********//

        let finalMessage = await `<h3>AWS daily billing report</h3>${await messages.join('')}`

        let emailParams = await {
            "Source": process.env.FROM_EMAIL,
            "Destination": {
                "BccAddresses": [],
                "CcAddresses": [],
                "ToAddresses": JSON.parse(toEmails)
            },
            "Message": {
                "Body": {
                    "Html": {
                        "Charset": "UTF-8",
                        "Data": finalMessage
                    }
                },
                "Subject": {
                    "Charset": "UTF-8",
                    "Data": "AWS daily billing report"
                }
            }

        }

        AWS.config.region = "eu-west-1"
        const ses = new AWS.SES()
        
        await ses.sendEmail(emailParams, (err, data) => {
            if (err) console.log(err, err.stack)
        });
    }
}
