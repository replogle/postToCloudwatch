# postToCloudWatch.js

Lambda function to show how to post to a specific CloudWatch stream.
Provide the desired logGroup and logStream names; this function will
create them if they don't exist. 

Note that requests in rapid succession may fail due to the way AWS Cloudwatch Logs works.
Also, there is a limit on the size of each Cloudwatch Log (262144 bytes).

Usage:
```
postToCloutwatch = require('./src/postToCloudwatch.js')
....
postToCloudwatch(thingToPost,logGroup,logStream)
```

The intention is to be very liberal about what can be posted, an object, a string, a number, etc.

Note that the IAM Role that executes this must have access to post to Cloudwatch.

