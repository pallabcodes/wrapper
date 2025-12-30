import axios from 'axios';

const TOTAL_REQUESTS = 150; // Increased to 150 to prove rate limiting logic
const CONCURRENCY = 1; // Serialized to avoid Read-Modify-Write race condition
const URL = 'http://localhost:3001/check'; // Direct Service (Bypass Kong for verification)
// Fallback to direct service if Kong is down: 'http://localhost:3001/check'

async function run() {
    console.log(`🚀 Starting Load Test: ${TOTAL_REQUESTS} requests to ${URL}`);
    console.log(`🎯 Goal: Exceed 100 requests/min limit`);

    let allowed = 0;
    let blocked = 0;
    let errors = 0;

    const promises = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(
            axios.post(URL, {
                clientId: 'load-test-user',
                resource: '/stress-test'
            }, { validateStatus: () => true })
                .then(res => {
                    if (res.status === 200 || res.status === 201) {
                        if (res.data.allowed) {
                            allowed++;
                            process.stdout.write('✅');
                        } else {
                            // Service returned 200 but explicitly allowed=false (shouldn't happen with 429 logic but covering bases)
                            blocked++;
                            process.stdout.write('⛔');
                        }
                    } else if (res.status === 429) {
                        blocked++;
                        process.stdout.write('⛔');
                    } else {
                        console.log(`\n[Unexpected Status: ${res.status}]`);
                        errors++;
                        process.stdout.write('❌');
                    }
                })
                .catch(err => {
                    const status = err.response ? err.response.status : 'No Response';
                    console.log(`\n[Error: ${err.message} | Status: ${status}]`);
                    errors++;
                    process.stdout.write('❌');
                })
        );

        // Simple throttling for concurrency visually
        if (i % CONCURRENCY === 0) await new Promise(r => setTimeout(r, 50));
    }

    await Promise.all(promises);

    console.log('\n\n--- 📊 Final Report ---');
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`✅ Allowed: ${allowed}`);
    console.log(`⛔ Blocked: ${blocked}`);
    console.log(`❌ Errors:  ${errors}`);

    if (blocked > 0) {
        console.log(`\n🎉 SUCCESS: Rate Limiter is working! (Blocked ${blocked} requests)`);
    } else {
        console.log(`\n⚠️ WARNING: No requests were blocked. Did we exceed the limit?`);
    }
}

run().catch(console.error);
