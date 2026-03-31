import twilio from 'twilio';
import https from 'https';

// ------------------------------------------------------------
// Step 1:  Configure Twilio account and destination number
// ------------------------------------------------------------
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const DESTINATION_PHONE_NUMBER = process.env.DESTINATION_PHONE_NUMBER || '';

// ------------------------------------------------------------
// Step 2:  Configure Ultravox API key
//
// Optional: Modify the system prompt
// ------------------------------------------------------------
const ULTRAVOX_API_KEY = 'WVuwIV8W.1YMNx70e5HIP97d53n3CsvOi3oxxh1gi';
const SYSTEM_PROMPT = `
1) Identity
You are Maya, a virtual travel consultant at Travel Co.
Travel Co. provides luxury accommodations including rooms, villas, beach residences, and royal estates across multiple destinations.
You handle inbound and outbound calls to understand customer travel needs and provide the best luxury accommodation solutions.
You must always begin the call by saying:
"Hello! This is Maya from Travel Co. Is this a good time to talk for two minutes?"

2) Call Flow Logic
1. Check Availability
- If the customer says no, call later, or tries to skip the call:
"Okay, no problem. I will call you some other time. Have a nice day!"
(End the call politely.)
- If the customer agrees to talk:
"Thank you. I will keep it short."

2. Company Introduction
"I am calling from Travel Co. We provide luxury accommodations including rooms, villas, beach residences, and royal estates.
We help travelers, families, and corporate groups experience the culture, beauty, and luxury of the world's most sought-after destinations.
All our properties come with VIP concierge service, exclusive access, and 24/7 support."

3. Need Discovery
"Can you please tell me what kind of travel experience you are looking for?"
"Are you planning a secluded island retreat, a cultural city expedition, or an adventurous experience?"
"How many people will be traveling, and what are your preferred travel dates?"
Listen carefully to what the customer says and understand their needs before replying.

4. Solution and Value Pitch
When the customer explains their situation, reply politely and offer a matching solution.

- If they are seeking luxury and exclusivity:
"We offer royal estates and villas with private amenities and VIP concierge service for the ultimate luxury experience."

- If they want a beach or island experience:
"We have stunning beach residences in exotic locations with exclusive access to pristine beaches and water activities."

- If they are traveling with family or a group:
"We can arrange spacious villas or multiple rooms with customized itineraries and 24/7 support for your entire group."

After sharing the solution, say:
"Would you like me to send you our property options and itinerary details that fit your travel plans?"

3) Style Guidelines
- Use simple, polite, and professional language.
- Always listen first, then give your response.
- Speak in a clear and helpful tone.
- Keep the conversation short and natural.
- Collect customer details step-by-step:
  - Name
  - Destination preferences
  - Contact email or WhatsApp number
  - Travel dates (check-in and check-out)
  - Number of guests/rooms needed
  - Budget or accommodation type (room, villa, beach residence, royal estate)

Response Guidelines
- Always stay in your travel consultant role.
- Keep your tone polite, confident, and respectful.
- Focus on helping the customer, not just booking.
- If the customer is not interested, end the call nicely.
- Always thank the customer before ending the call.
`;

const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: 'ultravox-v0.7',
    voice: 'Mark',
    temperature: 0.3,
    firstSpeakerSettings: { user: {} },     // For outgoing calls, the user will answer the call (i.e. speak first)
    medium: { twilio: {} }                  // Use twilio medium
};

// Validates all required config vars are set
function validateConfiguration() {
    const requiredConfig = [
        { name: 'TWILIO_ACCOUNT_SID', value: TWILIO_ACCOUNT_SID, pattern: /^AC[a-zA-Z0-9]{32}$/ },
        { name: 'TWILIO_AUTH_TOKEN', value: TWILIO_AUTH_TOKEN, pattern: /^[a-zA-Z0-9]{32}$/ },
        { name: 'TWILIO_PHONE_NUMBER', value: TWILIO_PHONE_NUMBER, pattern: /^\+[1-9]\d{1,14}$/ },
        { name: 'DESTINATION_PHONE_NUMBER', value: DESTINATION_PHONE_NUMBER, pattern: /^\+[1-9]\d{1,14}$/ },
        { name: 'ULTRAVOX_API_KEY', value: ULTRAVOX_API_KEY, pattern: /^[a-zA-Z0-9]{8}\.[a-zA-Z0-9]{32}$/ }
    ];

    const errors = [];

    for (const config of requiredConfig) {
        if (!config.value || config.value.includes('your_') || config.value.includes('_here')) {
            errors.push(`❌ ${config.name} is not set or still contains placeholder text`);
        } else if (config.pattern && !config.pattern.test(config.value)) {
            errors.push(`❌ ${config.name} format appears invalid`);
        }
    }

    if (errors.length > 0) {
        console.error('🚨 Configuration Error(s):');
        errors.forEach(error => console.error(`   ${error}`));
        console.error('\n💡 Please update the configuration variables at the top of this file:');
        console.error('   • TWILIO_ACCOUNT_SID should start with "AC" and be 34 characters');
        console.error('   • TWILIO_AUTH_TOKEN should be 32 characters');
        console.error('   • Phone numbers should be in E.164 format (e.g., +1234567890)');
        console.error('   • ULTRAVOX_API_KEY should be 8 chars + period + 32 chars (e.g., Zk9Ht7Lm.wX7pN9fM3kLj6tRq2bGhA8yE5cZvD4sT)');
        console.error('\n📦 If you get module import errors, install dependencies with:');
        console.error('   npm install twilio');
        process.exit(1);
    }

    console.log('✅ Configuration validation passed!');
}

// Creates the Ultravox call using the above config
async function createUltravoxCall() {
    const ULTRAVOX_API_URL = 'https://api.ultravox.ai/api/calls';
    const request = https.request(ULTRAVOX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ULTRAVOX_API_KEY
        }
    });

    return new Promise((resolve, reject) => {
        let data = '';
        request.on('response', (response) => {
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(parsedData);
                    } else {
                        reject(new Error(`Ultravox API error (${response.statusCode}): ${data}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse Ultravox response: ${data}`));
                }
            });
        });
        request.on('error', (error) => {
            reject(new Error(`Network error calling Ultravox: ${error.message}`));
        });
        request.write(JSON.stringify(ULTRAVOX_CALL_CONFIG));
        request.end();
    });
}

// Starts the program and makes the call
async function main() {
    console.log('🚀 Starting Outbound Ultravox Voice AI Phone Call...\n');
    validateConfiguration();

    try {
        console.log('📞 Creating Ultravox call...');
        const ultravoxResponse = await createUltravoxCall();

        if (!ultravoxResponse.joinUrl) {
            throw new Error('No joinUrl received from Ultravox API');
        }

        console.log('✅ Got Ultravox joinUrl:', ultravoxResponse.joinUrl);

        console.log('📱 Initiating Twilio call...');
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const call = await client.calls.create({
            twiml: `<Response><Connect><Stream url="${ultravoxResponse.joinUrl}"/></Connect></Response>`,
            to: DESTINATION_PHONE_NUMBER,
            from: TWILIO_PHONE_NUMBER
        });

        console.log('🎉 Twilio outbound phone call initiated successfully!');
        console.log(`📋 Twilio Call SID: ${call.sid}`);
        console.log(`📞 Calling ${DESTINATION_PHONE_NUMBER} from ${TWILIO_PHONE_NUMBER}`);

    } catch (error) {
        console.error('💥 Error occurred:');

        if (error.message.includes('Authentication')) {
            console.error('   🔐 Authentication failed - check your Twilio credentials');
        } else if (error.message.includes('phone number')) {
            console.error('   📞 Phone number issue - verify your phone numbers are correct');
        } else if (error.message.includes('Ultravox')) {
            console.error('   🤖 Ultravox API issue - check your API key and try again');
        } else {
            console.error(`   ${error.message}`);
        }

        console.error('\n🔍 Troubleshooting tips:');
        console.error('   • Double-check all configuration values');
        console.error('   • Ensure phone numbers are in E.164 format (+1234567890)');
        console.error('   • Verify your Twilio account has sufficient balance');
        console.error('   • Check that your Ultravox API key is valid');
        console.error('   • If you get import errors, run: npm install twilio');
    }
}

main();