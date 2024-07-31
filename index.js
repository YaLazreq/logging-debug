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

        await log.write(entry);

        console.log("test 5"); // ❌ Echec

    } catch (error) {
    }
})


//==============================================================================
//==============================================================================
//==============================================================================


function isTopicParametersValid(params) {
    // Topic for instant distribution with team "default"
    if (params.topicName == 'test-topic' && (!params.rideId || !params.team)) {
        throw(new Error("isTopicParametersValid() parameter invalid"));
    }
}

async function isTopicExist(pubsub, params) {
        if (!params.topicName)
            throw(new Error("isTopicExist() topicname"));

        const [topics] = await pubsub.getTopics()

        const testTopic = topics.filter((topic) => 
            topic.name.includes(params.topicName))?.[0]
        if (!testTopic) {
            await pubsub.createTopic('test-topic')
            // throw(new Error("isTopicExist() topic null"));
        }
        isTopicParametersValid(params);
}

exports.testPubsubManager = functions.https.onRequest(async (req, res) => {
	// 1. make sure the function can't be used in production
	// if (!process.env.PUBSUB_EMULATOR_HOST) {
	// 	functions.logger.error('This function should only run locally in an emulator.')
	// 	res.status(400).end()
	// }

    /**
     *  Filter for topics
     */
    const params = {
        topicName: req.body.topicName ? req.body.topicName : null,
        rideId: req.body.rideId ? req.body.rideId : null,
        team: req.body.team ? req.body.team : null,
    }

    try {
        const pubsub = new PubSub()

	    await isTopicExist(pubsub, params);

	    // 3. publish to test topic and get message ID
	    const messageID = await pubsub.topic(params.topicName).publishMessage({
	    	json: params,
	    })

        //4 do something with the messageID
        // here

        // 5. send back a helpful message
	    res.status(201).send({ success: 'Published to pubsub test-topic -- message ID: ', messageID })
    } catch (error) {
        res.status(500).send(`Internal Server Error ${error}`);
    }  
})
