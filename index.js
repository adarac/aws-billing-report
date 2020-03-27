/*
* Documentation: 
* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#getMetricStatistics-property
* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
*
*/ 

// Requires and configuration
require('dotenv').config({path:`${__dirname}/.env`})
const AWS = require('aws-sdk')

// Date variables

let date = new Date()

let oneDayAgo = new Date()
oneDayAgo.setDate(oneDayAgo.getDate() - 1)

let twoDaysAgo = new Date()
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

// Other variables

let accounts = JSON.parse(process.env.AWS_ACCOUNTS)

let params = {
    "Namespace": "AWS/Billing",
    "MetricName": "EstimatedCharges",
    "Dimensions": [{
        "Name": "Currency",
        "Value": "USD"
    }],
    "StartTime": undefined,
    "EndTime": undefined,
    "Statistics": [ "Maximum" ],
    "Period": 60
}

let paramsOneDayAgo = {...params}
let paramsTwoDaysAgo = {...params}

// Last 12 hours total bill
paramsOneDayAgo.StartTime = oneDayAgo
paramsOneDayAgo.EndTime = date

// One day ago total bill
paramsTwoDaysAgo.StartTime = twoDaysAgo
paramsTwoDaysAgo.EndTime = oneDayAgo

// Funtions

async function getMessages (messages) {

    for await (let account of accounts) {

        if ( (account.name != 'Master') && (!paramsOneDayAgo.Dimensions[1]) && (!paramsTwoDaysAgo.Dimensions[1])) {
            paramsOneDayAgo.Dimensions.push({ "Name": "LinkedAccount", "Value": account.id })
            paramsTwoDaysAgo.Dimensions.push({ "Name": "LinkedAccount", "Value": account.id })
        } else if (paramsOneDayAgo.Dimensions[1] && paramsTwoDaysAgo.Dimensions[1]) {
            paramsOneDayAgo.Dimensions.pop()
            paramsOneDayAgo.Dimensions[1] = { "Name": "LinkedAccount", "Value": account.id }
            paramsTwoDaysAgo.Dimensions.pop()
            paramsTwoDaysAgo.Dimensions[1] = { "Name": "LinkedAccount", "Value": account.id }
        }

        await messages.push(await getIncrement(account.name, paramsOneDayAgo, paramsTwoDaysAgo))
    
    }

    return await messages

}

function executeRequest (params) {
    return new Promise((resolve, reject) => {

        const cloudwatch = new AWS.CloudWatch()

        cloudwatch.getMetricStatistics(params, (err, data) => {
            if (err) reject(err, err.stack)
            else     resolve(data)
        })

    })
}

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

async function sendEmail (messages) {

    let finalMessage = await `<h3>AWS daily billing report</h3>${await messages.join('')}`

    let emailParams = await {
        "Source": process.env.FROM_EMAIL,
        "Destination": {
            "BccAddresses": [],
            "CcAddresses": [],
            "ToAddresses": JSON.parse(process.env.TO_EMAILS)
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

// Main function 

let init = async () => {

    let messages = await getMessages([])
    await sendEmail(messages)
  
}	

init();
