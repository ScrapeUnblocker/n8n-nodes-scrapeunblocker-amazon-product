import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import type { OptionField } from './GenericFunctions';
import { applyOptions, requireList, runActorAndGetItems } from './GenericFunctions';

// ScrapeUnblocker's public "Amazon Product Scraper" Actor: https://apify.com/scrapeunblocker/amazon-product-scraper
const ACTOR_ID = 'WiufywOfa9PSH6RoO';
const INTEGRATION_APP_ID = 'scrapeunblocker-amazon-product-scraper';

// Node option name -> Actor input key.
const OPTION_FIELDS: Record<string, OptionField> = {
	marketplace: {
		key: 'marketplace',
	},
	proxyCountry: {
		key: 'proxy_country',
		kind: 'upper',
	},
};

function buildActorInput(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	options: IDataObject,
	itemIndex: number,
): IDataObject {
	const input: IDataObject = {};

	switch (`${resource}:${operation}`) {
		case 'product:getByAsin': {
			input.asins = requireList.call(this, 'asins', 'ASINs', itemIndex);
			break;
		}
		case 'product:getByUrl': {
			input.urls = requireList.call(this, 'urls', 'Product URLs', itemIndex);
			break;
		}
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported for resource "${resource}"`,
				{ itemIndex },
			);
	}

	applyOptions(input, options, OPTION_FIELDS);
	return input;
}

export class AmazonProductScraper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Amazon Product Scraper',
		name: 'amazonProductScraper',
		icon: {
			light: 'file:amazonProductScraper.png',
			dark: 'file:amazonProductScraper.dark.png',
		},
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Get Amazon product details by ASIN or URL with the ScrapeUnblocker Actor on Apify',
		defaults: {
			name: 'Amazon Product Scraper',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'apifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Product',
						value: 'product',
					},
				],
				default: 'product',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['product'],
					},
				},
				options: [
					{
						name: 'Get by ASIN',
						value: 'getByAsin',
						description: 'Get Amazon products by ASIN',
						action: 'Get products by ASIN',
					},
					{
						name: 'Get by URL',
						value: 'getByUrl',
						description: 'Get Amazon products from product page URLs',
						action: 'Get products by URL',
					},
				],
				default: 'getByAsin',
			},
			{
				displayName: 'ASINs',
				name: 'asins',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'B0BSHF7WHW',
				description: 'One or more Amazon ASINs (10-character product codes), e.g. B0BSHF7WHW',
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['getByAsin'],
					},
				},
			},
			{
				displayName: 'Product URLs',
				name: 'urls',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://www.amazon.de/dp/B0BSHF7WHW',
				description: 'One or more Amazon product page URLs. The marketplace is read from each URL.',
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['getByUrl'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Marketplace',
						name: 'marketplace',
						type: 'options',
						options: [
							{
								name: 'Australia (amazon.com.au)',
								value: 'amazon.com.au',
							},
							{
								name: 'Belgium (amazon.com.be)',
								value: 'amazon.com.be',
							},
							{
								name: 'Brazil (amazon.com.br)',
								value: 'amazon.com.br',
							},
							{
								name: 'Canada (amazon.ca)',
								value: 'amazon.ca',
							},
							{
								name: 'France (amazon.fr)',
								value: 'amazon.fr',
							},
							{
								name: 'Germany (amazon.de)',
								value: 'amazon.de',
							},
							{
								name: 'India (amazon.in)',
								value: 'amazon.in',
							},
							{
								name: 'Italy (amazon.it)',
								value: 'amazon.it',
							},
							{
								name: 'Japan (amazon.co.jp)',
								value: 'amazon.co.jp',
							},
							{
								name: 'Mexico (amazon.com.mx)',
								value: 'amazon.com.mx',
							},
							{
								name: 'Netherlands (amazon.nl)',
								value: 'amazon.nl',
							},
							{
								name: 'Poland (amazon.pl)',
								value: 'amazon.pl',
							},
							{
								name: 'Saudi Arabia (amazon.sa)',
								value: 'amazon.sa',
							},
							{
								name: 'Singapore (amazon.sg)',
								value: 'amazon.sg',
							},
							{
								name: 'Spain (amazon.es)',
								value: 'amazon.es',
							},
							{
								name: 'Sweden (amazon.se)',
								value: 'amazon.se',
							},
							{
								name: 'Turkey (amazon.com.tr)',
								value: 'amazon.com.tr',
							},
							{
								name: 'United Arab Emirates (amazon.ae)',
								value: 'amazon.ae',
							},
							{
								name: 'United Kingdom (amazon.co.uk)',
								value: 'amazon.co.uk',
							},
							{
								name: 'United States (amazon.com)',
								value: 'amazon.com',
							},
						],
						default: 'amazon.com',
						description:
							'Regional Amazon site the ASINs belong to. Prices, currency and availability differ per marketplace.',
						displayOptions: {
							show: {
								'/operation': ['getByAsin'],
							},
						},
					},
					{
						displayName: 'Proxy Country',
						name: 'proxyCountry',
						type: 'string',
						default: '',
						placeholder: 'DE',
						description:
							"Exit-IP country (ISO-2, e.g. DE). Defaults to the marketplace's home country, so prices come in its currency.",
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'Maximum run time of the Apify Actor run. 0 keeps the Actor default. A run that times out fails the node.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const { timeout, ...actorOptions } = options;

				const input = buildActorInput.call(this, resource, operation, actorOptions, i);
				const { items: results } = await runActorAndGetItems.call(this, {
					actorId: ACTOR_ID,
					integrationAppId: INTEGRATION_APP_ID,
					input,
					itemIndex: i,
					timeoutSecs: (timeout as number) || undefined,
				});

				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Both constructors return an error of their own class unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
