import { AmazonProductScraper } from './nodes/AmazonProductScraper/AmazonProductScraper.node';
import { ApifyApi } from './credentials/ApifyApi.credentials';

export const nodeTypes = [AmazonProductScraper];

export const credentialTypes = [ApifyApi];
