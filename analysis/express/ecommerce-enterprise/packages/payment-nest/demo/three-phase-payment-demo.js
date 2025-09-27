#!/usr/bin/env node

/**
 * Three-Phase Payment Processing Demo
 * 
 * This demonstration showcases the traditional three-phase payment processing:
 * 1. Authorization - Verify payment method and reserve funds
 * 2. Capture - Actually charge the reserved funds
 * 3. Settlement - Transfer funds to merchant account
 * 
 * This is the enterprise-standard approach used by major payment processors.
 */

// Color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(80)}`, colors.cyan);
  log(`  ${title}`, colors.bright);
  log(`${'='.repeat(80)}`, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logPhase(phase, message) {
  const phaseColors = {
    1: colors.magenta,
    2: colors.yellow,
    3: colors.green
  };
  log(`🔹 Phase ${phase}: ${message}`, phaseColors[phase]);
}

// Sample payment data for three-phase processing
const samplePaymentData = {
  amount: 2500.00,
  currency: 'USD',
  paymentMethodId: 'pm_1234567890abcdef',
  customerId: 'cus_1234567890abcdef',
  description: 'Enterprise software license - Annual subscription',
  metadata: {
    productId: 'ent-license-2024',
    subscriptionType: 'annual',
    features: ['advanced-analytics', 'priority-support', 'custom-integrations'],
    orderId: 'order_123456789'
  },
  captureMethod: 'manual', // Manual capture for demonstration
  captureDelay: 0, // No delay
  settlementDelay: 1 // 1 day settlement delay
};

const context = {
  userId: 'user_123e4567-e89b-12d3-a456-426614174000',
  tenantId: 'tenant_123e4567-e89b-12d3-a456-426614174001',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  requestId: 'req_three_phase_123456789'
};

async function demonstratePhase1Authorization() {
  logSection('PHASE 1: AUTHORIZATION');
  logPhase(1, 'Verifying payment method and reserving funds...');
  
  try {
    // Mock authorization request
    const authorizationRequest = {
      amount: samplePaymentData.amount,
      currency: samplePaymentData.currency,
      paymentMethodId: samplePaymentData.paymentMethodId,
      customerId: samplePaymentData.customerId,
      description: samplePaymentData.description,
      metadata: samplePaymentData.metadata,
      captureMethod: samplePaymentData.captureMethod,
      captureDelay: samplePaymentData.captureDelay
    };

    // Mock authorization result
    const authorizationResult = {
      authorizationId: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'authorized',
      amount: authorizationRequest.amount,
      currency: authorizationRequest.currency,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      paymentMethodId: authorizationRequest.paymentMethodId,
      provider: 'STRIPE',
      metadata: {
        stripePaymentIntentId: `pi_${Date.now()}`,
        captureMethod: authorizationRequest.captureMethod,
        fraudScore: 0.15,
        riskLevel: 'LOW'
      }
    };

    logInfo(`Authorization Request:`);
    logInfo(`  Amount: $${authorizationRequest.amount}`);
    logInfo(`  Currency: ${authorizationRequest.currency}`);
    logInfo(`  Payment Method: ${authorizationRequest.paymentMethodId}`);
    logInfo(`  Capture Method: ${authorizationRequest.captureMethod}`);
    logInfo(`  Description: ${authorizationRequest.description}`);

    logSuccess(`Payment authorized successfully!`);
    logInfo(`Authorization ID: ${authorizationResult.authorizationId}`);
    logInfo(`Status: ${authorizationResult.status}`);
    logInfo(`Expires At: ${authorizationResult.expiresAt.toISOString()}`);
    logInfo(`Provider: ${authorizationResult.provider}`);
    logInfo(`Fraud Score: ${authorizationResult.metadata.fraudScore}`);
    logInfo(`Risk Level: ${authorizationResult.metadata.riskLevel}`);

    logInfo(`\n💡 What happened:`);
    logInfo(`  • Payment method was verified and validated`);
    logInfo(`  • Funds were reserved (not yet charged)`);
    logInfo(`  • Authorization token was created`);
    logInfo(`  • Payment is ready for capture when needed`);

    return authorizationResult;

  } catch (error) {
    logError(`Authorization failed: ${error.message}`);
    throw error;
  }
}

async function demonstratePhase2Capture(authorizationResult) {
  logSection('PHASE 2: CAPTURE');
  logPhase(2, 'Actually charging the reserved funds...');
  
  try {
    // Mock capture request
    const captureRequest = {
      authorizationId: authorizationResult.authorizationId,
      amount: authorizationResult.amount, // Full capture
      metadata: {
        reason: 'Order fulfillment',
        capturedBy: 'system',
        orderId: samplePaymentData.metadata.orderId
      }
    };

    // Mock capture result
    const captureResult = {
      captureId: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorizationId: captureRequest.authorizationId,
      status: 'captured',
      amount: captureRequest.amount,
      currency: authorizationResult.currency,
      capturedAt: new Date(),
      provider: authorizationResult.provider,
      metadata: {
        stripeChargeId: `ch_${Date.now()}`,
        capturedBy: captureRequest.metadata.capturedBy,
        orderId: captureRequest.metadata.orderId
      },
      fees: {
        amount: Math.round(captureRequest.amount * 0.029 + 30), // 2.9% + 30¢
        currency: authorizationResult.currency,
        breakdown: [
          { type: 'stripe_fee', amount: Math.round(captureRequest.amount * 0.029), description: 'Stripe processing fee' },
          { type: 'fixed_fee', amount: 30, description: 'Fixed fee' }
        ]
      }
    };

    logInfo(`Capture Request:`);
    logInfo(`  Authorization ID: ${captureRequest.authorizationId}`);
    logInfo(`  Amount: $${captureRequest.amount}`);
    logInfo(`  Reason: ${captureRequest.metadata.reason}`);

    logSuccess(`Payment captured successfully!`);
    logInfo(`Capture ID: ${captureResult.captureId}`);
    logInfo(`Status: ${captureResult.status}`);
    logInfo(`Captured At: ${captureResult.capturedAt.toISOString()}`);
    logInfo(`Provider: ${captureResult.provider}`);
    logInfo(`Fees: $${(captureResult.fees.amount / 100).toFixed(2)}`);
    logInfo(`  - Processing Fee: $${(captureResult.fees.breakdown[0].amount / 100).toFixed(2)}`);
    logInfo(`  - Fixed Fee: $${(captureResult.fees.breakdown[1].amount / 100).toFixed(2)}`);

    logInfo(`\n💡 What happened:`);
    logInfo(`  • Reserved funds were actually charged`);
    logInfo(`  • Money was transferred from customer to merchant`);
    logInfo(`  • Processing fees were calculated and applied`);
    logInfo(`  • Payment is now ready for settlement`);

    return captureResult;

  } catch (error) {
    logError(`Capture failed: ${error.message}`);
    throw error;
  }
}

async function demonstratePhase3Settlement(captureResult) {
  logSection('PHASE 3: SETTLEMENT');
  logPhase(3, 'Transferring funds to merchant account...');
  
  try {
    // Mock settlement request
    const settlementRequest = {
      captureId: captureResult.captureId,
      settlementDelay: samplePaymentData.settlementDelay,
      metadata: {
        settlementReason: 'Standard settlement cycle',
        merchantAccount: 'acct_1234567890',
        bankAccount: 'bank_1234567890'
      }
    };

    // Mock settlement result
    const settlementResult = {
      settlementId: `settle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      captureId: settlementRequest.captureId,
      status: 'settled',
      amount: captureResult.amount,
      currency: captureResult.currency,
      settledAt: new Date(),
      provider: captureResult.provider,
      netAmount: captureResult.amount - captureResult.fees.amount,
      fees: captureResult.fees,
      bankAccount: {
        last4: '1234',
        bankName: 'Chase Bank',
        routingNumber: '021000021'
      }
    };

    logInfo(`Settlement Request:`);
    logInfo(`  Capture ID: ${settlementRequest.captureId}`);
    logInfo(`  Settlement Delay: ${settlementRequest.settlementDelay} days`);
    logInfo(`  Merchant Account: ${settlementRequest.metadata.merchantAccount}`);

    logSuccess(`Payment settled successfully!`);
    logInfo(`Settlement ID: ${settlementResult.settlementId}`);
    logInfo(`Status: ${settlementResult.status}`);
    logInfo(`Settled At: ${settlementResult.settledAt.toISOString()}`);
    logInfo(`Provider: ${settlementResult.provider}`);
    logInfo(`Gross Amount: $${(settlementResult.amount / 100).toFixed(2)}`);
    logInfo(`Net Amount: $${(settlementResult.netAmount / 100).toFixed(2)}`);
    logInfo(`Total Fees: $${(settlementResult.fees.amount / 100).toFixed(2)}`);
    logInfo(`Bank Account: ****${settlementResult.bankAccount.last4}`);
    logInfo(`Bank Name: ${settlementResult.bankAccount.bankName}`);

    logInfo(`\n💡 What happened:`);
    logInfo(`  • Funds were transferred to merchant's bank account`);
    logInfo(`  • Processing fees were deducted`);
    logInfo(`  • Settlement was completed successfully`);
    logInfo(`  • Merchant can now access the funds`);

    return settlementResult;

  } catch (error) {
    logError(`Settlement failed: ${error.message}`);
    throw error;
  }
}

async function demonstratePaymentFlowOverview(authorizationResult, captureResult, settlementResult) {
  logSection('COMPLETE THREE-PHASE PAYMENT FLOW');
  
  const paymentFlow = {
    authorization: authorizationResult,
    capture: captureResult,
    settlement: settlementResult,
    status: 'settled',
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    updatedAt: new Date()
  };

  logInfo(`Payment Flow Summary:`);
  logInfo(`  Status: ${paymentFlow.status.toUpperCase()}`);
  logInfo(`  Created: ${paymentFlow.createdAt.toISOString()}`);
  logInfo(`  Updated: ${paymentFlow.updatedAt.toISOString()}`);
  
  logInfo(`\n📋 Phase Details:`);
  logInfo(`  Phase 1 - Authorization:`);
  logInfo(`    ID: ${paymentFlow.authorization.authorizationId}`);
  logInfo(`    Status: ${paymentFlow.authorization.status}`);
  logInfo(`    Amount: $${(paymentFlow.authorization.amount / 100).toFixed(2)}`);
  logInfo(`    Expires: ${paymentFlow.authorization.expiresAt.toISOString()}`);
  
  logInfo(`  Phase 2 - Capture:`);
  logInfo(`    ID: ${paymentFlow.capture.captureId}`);
  logInfo(`    Status: ${paymentFlow.capture.status}`);
  logInfo(`    Amount: $${(paymentFlow.capture.amount / 100).toFixed(2)}`);
  logInfo(`    Captured: ${paymentFlow.capture.capturedAt.toISOString()}`);
  
  logInfo(`  Phase 3 - Settlement:`);
  logInfo(`    ID: ${paymentFlow.settlement.settlementId}`);
  logInfo(`    Status: ${paymentFlow.settlement.status}`);
  logInfo(`    Net Amount: $${(paymentFlow.settlement.netAmount / 100).toFixed(2)}`);
  logInfo(`    Settled: ${paymentFlow.settlement.settledAt.toISOString()}`);

  logInfo(`\n💰 Financial Summary:`);
  logInfo(`  Gross Amount: $${(paymentFlow.capture.amount / 100).toFixed(2)}`);
  logInfo(`  Processing Fees: $${(paymentFlow.capture.fees.amount / 100).toFixed(2)}`);
  logInfo(`  Net Amount: $${(paymentFlow.settlement.netAmount / 100).toFixed(2)}`);
  logInfo(`  Fee Rate: ${((paymentFlow.capture.fees.amount / paymentFlow.capture.amount) * 100).toFixed(2)}%`);

  return paymentFlow;
}

async function demonstrateAdvancedThreePhaseFeatures() {
  logSection('ADVANCED THREE-PHASE FEATURES');
  
  logInfo('🔄 Partial Capture:');
  logInfo('  • Capture only part of authorized amount');
  logInfo('  • Useful for partial shipments or services');
  logInfo('  • Remaining amount can be captured later');
  
  logInfo('\n⏰ Delayed Capture:');
  logInfo('  • Authorize now, capture later');
  logInfo('  • Useful for pre-orders or subscriptions');
  logInfo('  • Authorization expires after 7 days (Stripe)');
  
  logInfo('\n🔄 Authorization Reversal:');
  logInfo('  • Cancel authorization before capture');
  logInfo('  • No fees charged to customer');
  logInfo('  • Funds are released back to customer');
  
  logInfo('\n💰 Settlement Options:');
  logInfo('  • Daily settlement (default)');
  logInfo('  • Weekly settlement');
  logInfo('  • Monthly settlement');
  logInfo('  • Custom settlement schedules');
  
  logInfo('\n🛡️ Risk Management:');
  logInfo('  • Fraud detection at authorization');
  logInfo('  • Risk assessment before capture');
  logInfo('  • Compliance checks throughout flow');
  
  logInfo('\n📊 Reporting & Analytics:');
  logInfo('  • Authorization success rates');
  logInfo('  • Capture timing analysis');
  logInfo('  • Settlement performance metrics');
  logInfo('  • Fee optimization insights');
}

async function demonstrateProviderComparison() {
  logSection('PROVIDER COMPARISON - THREE-PHASE SUPPORT');
  
  const providers = [
    {
      name: 'Stripe',
      authorization: '✅ Full Support',
      capture: '✅ Full Support',
      settlement: '✅ Automatic',
      fees: '2.9% + 30¢',
      authorizationExpiry: '7 days',
      features: ['3D Secure', 'SCA', 'Multi-currency', 'Webhooks']
    },
    {
      name: 'PayPal',
      authorization: '✅ Full Support',
      capture: '✅ Full Support',
      settlement: '✅ Automatic',
      fees: '3.4% + 30¢',
      authorizationExpiry: '3 days',
      features: ['PayPal Express', 'Venmo', 'Multi-currency', 'Webhooks']
    },
    {
      name: 'Braintree',
      authorization: '✅ Full Support',
      capture: '✅ Full Support',
      settlement: '✅ Automatic',
      fees: '2.9% + 30¢',
      authorizationExpiry: '7 days',
      features: ['3D Secure', 'SCA', 'Multi-currency', 'Webhooks']
    },
    {
      name: 'Square',
      authorization: '✅ Full Support',
      capture: '✅ Full Support',
      settlement: '✅ Next Business Day',
      fees: '2.9% + 30¢',
      authorizationExpiry: '7 days',
      features: ['Point of Sale', 'Online', 'Multi-currency', 'Webhooks']
    },
    {
      name: 'Adyen',
      authorization: '✅ Full Support',
      capture: '✅ Full Support',
      settlement: '✅ T+1',
      fees: '2.9% + 30¢',
      authorizationExpiry: '7 days',
      features: ['Global', 'SCA', 'Multi-currency', 'Webhooks']
    }
  ];

  logInfo('Payment Provider Three-Phase Support:');
  logInfo('');
  
  providers.forEach(provider => {
    logInfo(`${provider.name}:`);
    logInfo(`  Authorization: ${provider.authorization}`);
    logInfo(`  Capture: ${provider.capture}`);
    logInfo(`  Settlement: ${provider.settlement}`);
    logInfo(`  Fees: ${provider.fees}`);
    logInfo(`  Auth Expiry: ${provider.authorizationExpiry}`);
    logInfo(`  Features: ${provider.features.join(', ')}`);
    logInfo('');
  });
}

async function main() {
  log('🚀 THREE-PHASE PAYMENT PROCESSING DEMONSTRATION', colors.bright);
  log('   Traditional enterprise payment processing with authorization, capture, and settlement', colors.cyan);
  
  try {
    // Phase 1: Authorization
    const authorizationResult = await demonstratePhase1Authorization();
    
    // Small delay to simulate real-world processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 2: Capture
    const captureResult = await demonstratePhase2Capture(authorizationResult);
    
    // Small delay to simulate settlement processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 3: Settlement
    const settlementResult = await demonstratePhase3Settlement(captureResult);
    
    // Complete flow overview
    const paymentFlow = await demonstratePaymentFlowOverview(authorizationResult, captureResult, settlementResult);
    
    // Advanced features
    await demonstrateAdvancedThreePhaseFeatures();
    
    // Provider comparison
    await demonstrateProviderComparison();
    
    logSection('DEMONSTRATION COMPLETE');
    logSuccess('Three-phase payment processing demonstrated successfully!');
    logInfo('This showcases the traditional enterprise payment processing approach:');
    logInfo('  ✅ Phase 1: Authorization - Verify and reserve funds');
    logInfo('  ✅ Phase 2: Capture - Actually charge the reserved funds');
    logInfo('  ✅ Phase 3: Settlement - Transfer funds to merchant account');
    logInfo('  ✅ Multi-provider support (Stripe, PayPal, Braintree, Square, Adyen)');
    logInfo('  ✅ Advanced features (partial capture, delayed capture, reversals)');
    logInfo('  ✅ Risk management and fraud detection');
    logInfo('  ✅ Comprehensive reporting and analytics');
    logInfo('  ✅ Enterprise-grade compliance and security');
    logInfo('  ✅ Real-time monitoring and alerting');
    
    logInfo('\n🎯 Key Benefits:');
    logInfo('  • Better cash flow management');
    logInfo('  • Reduced chargeback risk');
    logInfo('  • Improved customer experience');
    logInfo('  • Enhanced fraud protection');
    logInfo('  • Flexible payment timing');
    logInfo('  • Enterprise compliance');
    
  } catch (error) {
    logError(`Demonstration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
