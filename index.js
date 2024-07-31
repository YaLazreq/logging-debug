const functions = require('firebase-functions');
const { PubSub } = require('@google-cloud/pubsub');
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { Logging } = require('@google-cloud/logging');


const serviceAccountPath = './katniss-app-firebase-4f5c1c503eb5.json';
const serviceAccount = require(serviceAccountPath);

const logging = new Logging({
    projectId: serviceAccount.project_id,
    keyFilename: serviceAccountPath,
    // credentials: {
    //     client_email: serviceAccount.client_email,
    //     private_key: serviceAccount.private_key
    // },
});

console.log("project id: ", serviceAccount.project_id); // ✅ Works

logging.setProjectId(serviceAccount.project_id);

async function parseParams(event) {
    const params = event.data.message.json;
    if (!params) 
        throw(new Error(""));
    if (!params.rideId || !params.team)
        throw("");
    return params;
}


exports.pubsubTriggeredFunction = onMessagePublished('test-topic', async (message) => {
    try {
        const params = await parseParams(message);
        const log = logging.log(params.rideId);

        console.log("test 1"); // ✅ Works
        const metadata = {
            resource: { type: 'cloud_function', labels: { function_name: 'pubsubTriggeredFunction' } }
          };
          console.log("test 2"); // ✅ Works
        
          // Create a JSON payload
          const jsonPayload = {
            message: 'This is a log entry with a JSON payload',
            user: {
              id: 'user123',
              name: 'John Doe'
            },
            event: 'UserLogin',
            status: 'success'
          };
        
          console.log("test 3"); // ✅ Works


        const entry = log.entry(metadata, jsonPayload);

        console.log("test 4"); // ✅ Works

        await log.write(entry); // ❌ Error: External network resource requested! - URL: "http://169.254.169.254/computeMetadata/v1/instance/zone" - Be careful, this may be a production service.
	

        console.log("test 5"); // ❌ Echec

    } catch (error) {
    }
})

