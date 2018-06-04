# postToCloudWatch.js

Lambda function to show how to post to a specific CloudWatch stream.
Uses environment variables to get the logGroup and logStream names,
and creates them if they don't exist. 

Note that rapid requests may fail due to the way AWS Cloudwatch Logs works.
Also, there is a limit on the size of each Cloudwatch Log (262144 bytes).

Usage:
```
postToCloutwatch = require('./src/postToCloudwatch.js')
....
postToCloudwatch(thingToPost,logGroup,logStream)
```

Note that the IAM Role that executes this must have access to post to Cloudwatch.

