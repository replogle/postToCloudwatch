/*
* postToCloudWatch.js
*
* Lambda function to show how to post to a specific CloudWatch stream.
* Uses environment variables to get the logGroup and logStream names,
* and creates them if they don't exist. 
*
* Note that rapid requests may fail due to the way AWS Cloudwatch Logs works.
* Also, there is a limit on the size of each Cloudwatch Log (262144 bytes).
*
*  Usage:
*   postToCloutwatch = require('./src/postToCloudwatch.js')
*   ....
*   postToCloudwatch(thingToPost,logGroup,logStream)
*
* Note that the IAM Role that executes this must have access to post to Cloudwatch.
*
* v 1.0.1 2017-09-26 jdr - don't log data from successful posting
* v 1.0.0 2017-09-26 jdr - initial version as a node.js module
*/

const aws = require('aws-sdk')
const cloudWatchLogs = new aws.CloudWatchLogs()

function postToCloudWatch(thingToPost,logGroup,logStream) {
    // Starting with the logGroup, create if it doesn't exist and post to the stream.
    // If the stream doesn't exist, create it and post the event. If the stream does
    // exist, get the stream token and then post the event.
    // At the final stage 'thingToPost' is converted to something appropriate based on its type.

    if (typeof(logGroup) != "string" || logGroup === "" || typeof(logStream) != "string" || logStream === "") {
        // bail out
        console.log("Warn: Invalid logGroup or logStream for posting to Cloudwatch")
        return false
    }

    manageLogGroups (thingToPost,logGroup,logStream)
}

    //Manage the log group
    function manageLogGroups (thingToPost,logGroup,logStream) {
        
        var describeLogGroupParams = {
            logGroupNamePrefix: logGroup  
        };
        
        //check if the log group already exists
        cloudWatchLogs.describeLogGroups(describeLogGroupParams, function (err, data){
            if (err) {
                // console.log('Error while describing log group:', err);
                createLogGroup (thingToPost,logGroup,logStream);
            } else {
                if (!data.logGroups[0]) {
                    // console.log ('Need to  create log group:', data);
                    //create log group
                    createLogGroup(thingToPost,logGroup,logStream);
                } else {
                    // console.log('Success while describing log group:', data);
                    manageLogStreams(thingToPost,logGroup,logStream);
                }
            }
        });
    }
    
    //Create log group
    function createLogGroup (thingToPost,logGroup,logStream) {
        var logGroupParams = {
            logGroupName: logGroup
        }
        cloudWatchLogs.createLogGroup(logGroupParams, function (err, data){
            if (err) {
                console.log('error while creating log group: ', err, err.stack);
                return;
            } else {
                console.log ('Success in creating log group: ', logGroup);
                manageLogStreams(thingToPost,logGroup,logStream);
            }
        });
    }
    
    //Manage the log stream and get the sequenceToken
    function manageLogStreams (thingToPost,logGroup,logStream) {
        var describeLogStreamsParams = {
            logGroupName: logGroup,
            logStreamNamePrefix: logStream 
        }
        
        //check if the log stream already exists and get the sequenceToken
        cloudWatchLogs.describeLogStreams (describeLogStreamsParams, function (err, data) {
            if (err) {
                console.log ('Error during describe log streams:', err);
                //create log stream
                createLogStream(thingToPost,logGroup,logStream);
            } else {
                if (!data.logStreams[0]) {
                    console.log ('Need to  create log stream:', data);
                    //create log stream
                    createLogStream(thingToPost,logGroup,logStream);
                } else {
                    // console.log ('Log Stream already defined:', logStream);
                    //console.log("describeLogStreams " + logStream + " - Received Data: ", data)

                    postToStreamWithToken(data.logStreams[0].uploadSequenceToken, thingToPost,logGroup,logStream)
                }
            }
        });
    }
    
    //Create Log Stream
    function createLogStream (thingToPost,logGroup,logStream) {
        var logStreamParams = {
            logGroupName: logGroup,
            logStreamName: logStream
        };
        
        cloudWatchLogs.createLogStream(logStreamParams, function (err, data){
            if (err) {
                console.log('error while creating log stream: ', err, err.stack);
                    return;
            } else {
                console.log ('Success in creating log stream: ', logStream);
                postToStreamWithToken(null, thingToPost,logGroup,logStream)
                
            }
        });
    }


function postToStreamWithToken(sequenceTokenVal,thingToPost,logGroup,logStream) {
    let canSend = true
    let message = ''

    // Converty 'thingToPost' to 'message' based on its type.
    switch (typeof(thingToPost)) {
        case "string":
            message = thingToPost
            break
        case "number":
            message += thingToPost
            break
        case "boolean":
            message = (thingToPost) ? "true" : "false"
            break
        case "object":
            message = JSON.stringify(thingToPost)
            break
        default:
            canSend = false  
    }
        
    // console.log({sequenceToken: sequenceTokenVal})

    if (canSend) {
        var params = {
          logEvents: [
            {
              message: message,
              timestamp: Date.now()
            }           // FYI can have multiple objects separated by commas
          ],
          logGroupName: logGroup,
          logStreamName: logStream,
          sequenceToken: sequenceTokenVal
        };

        cloudWatchLogs.putLogEvents(params, function(err, data) {
          if (err) console.log({attemptedSequence: sequenceTokenVal}, err, err.stack); // an error occurred
          // else     console.log(data);           // successful response but don't need to log it
        });
    } else {
        // something went wrong; bail and warn
        console.log("Warn: Unable to send to Cloudwatch")
    }
}


module.exports = postToCloudWatch
