import http from 'k6/http';
import { check, group } from 'k6';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";
import { traceParent } from "../common/trace.js";

const checkFailures = new Counter('check_failures');
const checkSuccesses = new Counter('check_successes');

const fspList = JSON.parse(__ENV.K6_SCRIPT_SDK_FSP_POOL || '[]');
const idType = __ENV.K6_SCRIPT_ID_TYPE || 'ACCOUNT_ID';
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR || 'false').toLowerCase() === 'true';

const DEFAULT_NOTE_MIN = Number(__ENV.K6_SCRIPT_NOTE_SIZE_MIN || 128);
const DEFAULT_NOTE_MAX = Number(__ENV.K6_SCRIPT_NOTE_SIZE_MAX || 2048);
const timeoutMs = Number(__ENV.K6_SCRIPT_UNHAPPY_TIMEOUT_MS || 200);

const unhappyRate = normalizeRate(__ENV.K6_SCRIPT_UNHAPPY_RATE, 0.08);
const drppRate = normalizeRate(__ENV.K6_SCRIPT_DRPP_RATE, 0.65);
const p2mRate = normalizeRate(__ENV.K6_SCRIPT_DRPP_P2M_RATE, 0.30);

const unhappyEnabled = {
	timeout: parseBool(__ENV.K6_SCRIPT_UNHAPPY_TIMEOUT_ENABLED, true),
	payeeAbort: parseBool(__ENV.K6_SCRIPT_UNHAPPY_PAYEE_ABORT_ENABLED, true),
	fxpAbort: parseBool(__ENV.K6_SCRIPT_UNHAPPY_FXP_ABORT_ENABLED, true),
	quoteRule: parseBool(__ENV.K6_SCRIPT_UNHAPPY_QUOTE_RULE_ENABLED, true),
	liquidityNdc: parseBool(__ENV.K6_SCRIPT_UNHAPPY_LIQUIDITY_NDC_ENABLED, true),
	invalidNumber: parseBool(__ENV.K6_SCRIPT_UNHAPPY_INVALID_NUMBER_ENABLED, true)
};

const triggerStrings = {
	timeout: __ENV.K6_SCRIPT_TRIGGER_TIMEOUT || 'TRIG_TIMEOUT',
	payeeAbort: __ENV.K6_SCRIPT_TRIGGER_PAYEE_ABORT || 'TRIG_PAYEE_ABORT',
	fxpAbort: __ENV.K6_SCRIPT_TRIGGER_FXP_ABORT || 'TRIG_FXP_ABORT',
	quoteRule: __ENV.K6_SCRIPT_TRIGGER_QUOTE_RULE || 'TRIG_QUOTE_RULE',
	liquidityNdc: __ENV.K6_SCRIPT_TRIGGER_LIQUIDITY_NDC || 'TRIG_LIQUIDITY_NDC',
	invalidNumber: __ENV.K6_SCRIPT_TRIGGER_INVALID_NUMBER || 'TRIG_INVALID_NUMBER',
	happy: __ENV.K6_SCRIPT_TRIGGER_HAPPY || 'TRIG_HAPPY'
};

const fxSourceAmountTriggers = {
	timeout: __ENV.CBH_FX_SOURCE_AMOUNT_TIMEOUT || '11',
	fxpAbort: __ENV.CBH_FX_SOURCE_AMOUNT_FXP_ABORT || '12',
	quoteRule: __ENV.CBH_FX_SOURCE_AMOUNT_QUOTE_RULE || '13',
	liquidityNdc: __ENV.CBH_FX_SOURCE_AMOUNT_LIQUIDITY_NDC || '14',
	payeeAbort: __ENV.CBH_FX_SOURCE_AMOUNT_PAYEE_ABORT || '15',
	invalidNumber: __ENV.CBH_FX_SOURCE_AMOUNT_INVALID_NUMBER || '16'
};

const useAmountBasedScenarios = parseBool(__ENV.K6_SCRIPT_USE_AMOUNT_BASED_SCENARIOS, false);

function parseBool(value, defaultValue) {
	if (value === undefined || value === null || value === '') {
		return defaultValue;
	}
	return value.toString().toLowerCase() === 'true';
}

function normalizeRate(value, defaultValue) {
	if (value === undefined || value === null || value === '') {
		return defaultValue;
	}
	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		return defaultValue;
	}
	let normalized = parsed;
	if (normalized > 1) {
		normalized = normalized / 100;
	}
	if (normalized < 0) {
		return 0;
	}
	if (normalized > 1) {
		return 1;
	}
	return normalized;
}

function randomItem(items) {
	return items[Math.floor(Math.random() * items.length)];
}

function buildVariableNote(prefix) {
	const minSize = Math.max(1, DEFAULT_NOTE_MIN);
	const maxSize = Math.max(minSize, DEFAULT_NOTE_MAX);
	const randomSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
	if (prefix.length >= randomSize) {
		return prefix.slice(0, randomSize);
	}
	return `${prefix}${'x'.repeat(randomSize - prefix.length)}`;
}

function chooseUseCase() {
	const isDrpp = Math.random() < drppRate;
	if (!isDrpp) {
		return {
			profile: 'GISP_P2P_SINGLE_CURRENCY',
			isFx: false,
			isP2M: false
		};
	}

	const isP2M = Math.random() < p2mRate;
	return {
		profile: isP2M ? 'DRPP_CROSS_BORDER_P2M' : 'DRPP_CROSS_BORDER_P2P',
		isFx: true,
		isP2M
	};
}

function chooseUnhappyCase(isFx) {
	if (Math.random() >= unhappyRate) {
		return null;
	}

	const candidates = [];
	if (unhappyEnabled.timeout) candidates.push('timeout');
	if (unhappyEnabled.payeeAbort) candidates.push('payeeAbort');
	if (unhappyEnabled.quoteRule) candidates.push('quoteRule');
	if (unhappyEnabled.liquidityNdc) candidates.push('liquidityNdc');
	if (unhappyEnabled.invalidNumber) candidates.push('invalidNumber');
	if (isFx && unhappyEnabled.fxpAbort) candidates.push('fxpAbort');

	if (!candidates.length) {
		return null;
	}
	return randomItem(candidates);
}

function chooseUnhappyCaseByAmount(amount, isFx) {
	// Check if any scenario amount matches
	if (amount === fxSourceAmountTriggers.timeout) return 'timeout';
	if (amount === fxSourceAmountTriggers.fxpAbort && isFx) return 'fxpAbort';
	if (amount === fxSourceAmountTriggers.quoteRule) return 'quoteRule';
	if (amount === fxSourceAmountTriggers.liquidityNdc) return 'liquidityNdc';
	if (amount === fxSourceAmountTriggers.payeeAbort) return 'payeeAbort';
	if (amount === fxSourceAmountTriggers.invalidNumber) return 'invalidNumber';
	return null;
}

function createExtensions(useCase, unhappyCase, sourceCurrency, targetCurrency) {
	return {
		extension: [
			{ key: 'useCaseProfile', value: useCase.profile },
			{ key: 'transactionChannel', value: useCase.isP2M ? 'P2M' : 'P2P' },
			{ key: 'regionalClearingScheme', value: useCase.profile.startsWith('DRPP') ? 'DRPP' : 'GISP' },
			{ key: 'crossBorder', value: useCase.isFx ? 'true' : 'false' },
			{ key: 'unhappyCase', value: unhappyCase || 'none' },
			{ key: 'sourceCurrency', value: sourceCurrency },
			{ key: 'targetCurrency', value: targetCurrency },
			{ key: 'clearingMetadata', value: 'REGIONAL_SETTLEMENT_BATCH_V1' }
		]
	};
}

function getTransferId(response) {
	try {
		return JSON.parse(response.body).transferId;
	} catch (_error) {
		return undefined;
	}
}

function checkAndCount(response, checkName, predicate, checkType, tags = {}) {
	const result = check(response, { [checkName]: predicate });
	if (result) {
		checkSuccesses.add(1, { check_type: checkType, ...tags });
	} else {
		checkFailures.add(1, { check_type: checkType, ...tags });
	}
	return result;
}

function responseHasCommonFields(response) {
	try {
		const body = JSON.parse(response.body);
		if (!body || typeof body !== 'object') {
			return false;
		}
		return Boolean(body.transferId || body.currentState || body.fulfil || body.fulfill);
	} catch (_error) {
		return false;
	}
}

function logConfiguration() {
	console.log('Env Vars -->');
	console.log(`  K6_SCRIPT_SDK_FSP_POOL=${__ENV.K6_SCRIPT_SDK_FSP_POOL}`);
	console.log(`  K6_SCRIPT_ID_TYPE=${idType}`);
	console.log(`  K6_SCRIPT_DRPP_RATE=${drppRate}`);
	console.log(`  K6_SCRIPT_DRPP_P2M_RATE=${p2mRate}`);
	console.log(`  K6_SCRIPT_UNHAPPY_RATE=${unhappyRate}`);
	console.log(`  K6_SCRIPT_NOTE_SIZE_MIN=${DEFAULT_NOTE_MIN}`);
	console.log(`  K6_SCRIPT_NOTE_SIZE_MAX=${DEFAULT_NOTE_MAX}`);
	console.log(`  K6_SCRIPT_UNHAPPY_TIMEOUT_MS=${timeoutMs}`);
	console.log(`  K6_SCRIPT_USE_AMOUNT_BASED_SCENARIOS=${useAmountBasedScenarios}`);
	console.log(`  Trigger mapping=${JSON.stringify(triggerStrings)}`);
	console.log(`  FX Source Amount Triggers=${JSON.stringify(fxSourceAmountTriggers)}`);
}

export function setup() {
	console.log('Provisioning accounts for sdkSendE2EMixedUsecase...');
	for (const fsp of fspList) {
		const sdkEndpointUrl = fsp.outboundUrl;
		const partyId = fsp.partyId;
		if (!sdkEndpointUrl || !partyId) {
			continue;
		}

		const startupResponse = http.post(
			`${sdkEndpointUrl}/accounts`,
			JSON.stringify([{ idType, idValue: partyId }]),
			{
				tags: {
					name: 'post_accounts',
					url: `${sdkEndpointUrl}/accounts`,
					endpoint: 'accounts',
					operation: 'post_accounts'
				},
				headers: {
					'Content-Type': 'application/json',
					'Date': (new Date()).toUTCString()
				}
			}
		);

		checkAndCount(
			startupResponse,
			'MIXED_SETUP_ACCOUNTS_STATUS_2XX',
			(r) => r.status >= 200 && r.status < 300,
			'setup_accounts'
		);
	}
}

export function sdkSendE2EMixedUsecase() {
	!exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && logConfiguration();

	group('SDK Mixed Regional Transfers', function () {
		if (fspList.length < 2) {
			console.error('K6_SCRIPT_SDK_FSP_POOL must contain at least 2 FSPs');
			if (abortOnError) {
				exec.test.abort();
			}
			return;
		}

		let payerFsp;
		let payeeFsp;

		if ((__ENV.UNIDIRECTIONAL || '').toLowerCase() === 'true') {
			payerFsp = fspList[0];
			payeeFsp = fspList[1];
		} else {
			const selectedFsps = getTwoItemsFromArray(fspList);
			payerFsp = selectedFsps[0];
			payeeFsp = selectedFsps[1];
		}

		const useCase = chooseUseCase();
		const amount = payerFsp.amount || '2';

		let unhappyCase;
		if (useAmountBasedScenarios && useCase.isFx) {
			unhappyCase = chooseUnhappyCaseByAmount(amount, useCase.isFx);
		} else {
			unhappyCase = chooseUnhappyCase(useCase.isFx);
		}

		const trigger = unhappyCase ? triggerStrings[unhappyCase] : triggerStrings.happy;

		const payerFspId = payerFsp.fspId;
		const payeeFspId = payeeFsp.fspId;
		const sourceCurrency = payerFsp.currency || 'USD';
		const targetCurrency = payeeFsp.currency || (useCase.isFx ? 'KES' : sourceCurrency);

		const invalidPayeeId = `${payeeFsp.partyId || '900000'}-INVALID`;
		const payeePartyId = unhappyCase === 'invalidNumber' ? invalidPayeeId : payeeFsp.partyId;

		const notePrefix = `region=${useCase.profile};scenario=${trigger};vu=${exec.vu.idInTest};iter=${exec.vu.iterationInScenario};`;
		const note = buildVariableNote(notePrefix);

		const transferRequestExtensions = createExtensions(useCase, unhappyCase, sourceCurrency, targetCurrency);
		const quoteRequestExtensions = createExtensions(useCase, unhappyCase, sourceCurrency, targetCurrency);

		const body = {
			homeTransactionId: crypto.randomUUID(),
			from: {
				type: 'CONSUMER',
				idType,
				idValue: payerFsp.partyId,
				displayName: trigger,
				firstName: 'Regional',
				middleName: 'Soak',
				lastName: 'Payer',
				dateOfBirth: '1992-02-29',
				fspId: payerFspId,
				extensionList: {
					extension: [
						{ key: 'senderRegion', value: 'SADC' },
						{ key: 'senderSegment', value: useCase.isP2M ? 'P2M' : 'P2P' }
					]
				}
			},
			to: {
				type: useCase.isP2M ? 'MERCHANT' : 'CONSUMER',
				idType,
				idValue: payeePartyId,
				displayName: useCase.isP2M ? 'Regional Merchant' : 'Regional Payee',
				firstName: useCase.isP2M ? 'Merchant' : 'Regional',
				lastName: useCase.isP2M ? 'Store' : 'Payee',
				merchantClassificationCode: useCase.isP2M ? '5411' : undefined,
				fspId: payeeFspId
			},
			amountType: 'SEND',
			currency: useCase.isFx ? sourceCurrency : targetCurrency,
			amount,
			transactionType: useCase.isP2M ? 'MERCHANT_PAYMENT' : 'TRANSFER',
			note,
			quoteRequestExtensions,
			transferRequestExtensions
		};

		const requestTimeout = unhappyCase === 'timeout' ? `${timeoutMs}ms` : undefined;
		const requestParams = {
			tags: {
				payerFspId,
				payeeFspId,
				useCase: useCase.profile,
				unhappyCase: unhappyCase || 'none',
				name: 'init_transfer',
				mlTransferPhase: 'discovery',
				endpoint: 'transfers',
				operation: 'post_transfers'
			},
			headers: {
				'Date': (new Date()).toUTCString(),
				'Content-Type': 'application/json',
				'traceparent': traceParent()
			}
		};

		if (requestTimeout) {
			requestParams.timeout = requestTimeout;
		}

		const sdkEndpointUrl = payerFsp.outboundUrl;
		const postTransferResponse = http.post(
			`${sdkEndpointUrl}/transfers`,
			JSON.stringify(body),
			requestParams
		);

		const postExpectedToFail = unhappyCase === 'timeout' || unhappyCase === 'invalidNumber';
		const postOk = checkAndCount(
			postTransferResponse,
			'MIXED__POST_TRANSFER_EXPECTED_STATUS',
			(r) => postExpectedToFail ? r.status !== 200 : r.status === 200,
			'post_transfer',
			{ use_case: useCase.profile, unhappy: unhappyCase || 'none' }
		);

		if (!postOk || postExpectedToFail) {
			if (abortOnError && !postExpectedToFail) {
				exec.test.abort();
			}
			return;
		}

		const transferId = getTransferId(postTransferResponse);
		if (!transferId) {
			checkFailures.add(1, { check_type: 'missing_transfer_id', use_case: useCase.profile });
			if (abortOnError) {
				exec.test.abort();
			}
			return;
		}

		const acceptParty = unhappyCase !== 'payeeAbort';
		const acceptPartyResponse = http.put(
			`${sdkEndpointUrl}/transfers/${transferId}`,
			JSON.stringify({ acceptParty }),
			{
				tags: {
					payerFspId,
					payeeFspId,
					useCase: useCase.profile,
					unhappyCase: unhappyCase || 'none',
					name: 'accept_party',
					mlTransferPhase: 'quotes',
					endpoint: 'transfers',
					operation: 'put_transfer'
				},
				headers: requestParams.headers
			}
		);

		const acceptPartyExpected = unhappyCase === 'payeeAbort' ? acceptPartyResponse.status !== 200 : acceptPartyResponse.status === 200;
		const acceptPartyOk = checkAndCount(
			acceptPartyResponse,
			'MIXED__PUT_ACCEPT_PARTY_EXPECTED_STATUS',
			() => acceptPartyExpected,
			'accept_party',
			{ use_case: useCase.profile, unhappy: unhappyCase || 'none' }
		);

		if (!acceptPartyOk || unhappyCase === 'payeeAbort') {
			if (abortOnError && unhappyCase !== 'payeeAbort') {
				exec.test.abort();
			}
			return;
		}

		if (useCase.isFx) {
			const acceptConversion = unhappyCase !== 'fxpAbort';
			const acceptConversionResponse = http.put(
				`${sdkEndpointUrl}/transfers/${transferId}`,
				JSON.stringify({ acceptConversion }),
				{
					tags: {
						payerFspId,
						payeeFspId,
						useCase: useCase.profile,
						unhappyCase: unhappyCase || 'none',
						name: 'accept_conversion',
						mlTransferPhase: 'conversion',
						endpoint: 'transfers',
						operation: 'put_transfer'
					},
					headers: requestParams.headers
				}
			);

			const conversionExpected = unhappyCase === 'fxpAbort' ? acceptConversionResponse.status !== 200 : acceptConversionResponse.status === 200;
			const conversionOk = checkAndCount(
				acceptConversionResponse,
				'MIXED__PUT_ACCEPT_CONVERSION_EXPECTED_STATUS',
				() => conversionExpected,
				'accept_conversion',
				{ use_case: useCase.profile, unhappy: unhappyCase || 'none' }
			);

			if (!conversionOk || unhappyCase === 'fxpAbort') {
				if (abortOnError && unhappyCase !== 'fxpAbort') {
					exec.test.abort();
				}
				return;
			}
		}

		const acceptQuote = !(unhappyCase === 'quoteRule' || unhappyCase === 'liquidityNdc');
		const acceptQuoteResponse = http.put(
			`${sdkEndpointUrl}/transfers/${transferId}`,
			JSON.stringify({ acceptQuote }),
			{
				tags: {
					payerFspId,
					payeeFspId,
					useCase: useCase.profile,
					unhappyCase: unhappyCase || 'none',
					name: 'accept_quote',
					mlTransferPhase: 'transfers',
					endpoint: 'transfers',
					operation: 'put_transfer'
				},
				headers: requestParams.headers
			}
		);

		const quoteExpected =
			unhappyCase === 'quoteRule' || unhappyCase === 'liquidityNdc'
				? acceptQuoteResponse.status !== 200
				: acceptQuoteResponse.status === 200;

		const quoteOk = checkAndCount(
			acceptQuoteResponse,
			'MIXED__PUT_ACCEPT_QUOTE_EXPECTED_STATUS',
			() => quoteExpected,
			'accept_quote',
			{ use_case: useCase.profile, unhappy: unhappyCase || 'none' }
		);

		if (!quoteOk) {
			if (abortOnError) {
				exec.test.abort();
			}
			return;
		}

		checkAndCount(
			acceptQuoteResponse,
			'MIXED__RESPONSE_HAS_INTEGRATION_FIELDS',
			(r) => responseHasCommonFields(r),
			'response_shape',
			{ use_case: useCase.profile, unhappy: unhappyCase || 'none' }
		);

		if (unhappyCase) {
			checkAndCount(
				acceptQuoteResponse,
				'MIXED__UNHAPPY_NOT_COMPLETED',
				(r) => {
					try {
						const body = JSON.parse(r.body);
						return body.currentState !== 'COMPLETED';
					} catch (_error) {
						return true;
					}
				},
				'unhappy_state',
				{ use_case: useCase.profile, unhappy: unhappyCase }
			);
			return;
		}

		checkAndCount(
			acceptQuoteResponse,
			'MIXED__HAPPY_STATE_COMPLETED',
			(r) => {
				try {
					const body = JSON.parse(r.body);
					return body.currentState === 'COMPLETED';
				} catch (_error) {
					return false;
				}
			},
			'happy_state',
			{ use_case: useCase.profile, unhappy: 'none' }
		);
	});
}
