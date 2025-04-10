import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function downloadFile(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'GET',
		url: `https://api.put.io/v2/files/${fileId}/download`,
	});

	// Extract the download URL from the HTML response
	const urlMatch = response.match(/href="([^"]+)"/);
	if (!urlMatch) {
		throw new Error('Could not find download URL in response');
	}

	const downloadUrl = urlMatch[1].replace(/&amp;/g, '&');

	return [
		{
			json: {
				downloadUrl,
			},
		},
	];
} 