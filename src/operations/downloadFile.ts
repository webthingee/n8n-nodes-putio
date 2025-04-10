import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function downloadFile(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'GET',
		url: `https://api.put.io/v2/files/${fileId}/download`,
	});

	// The response will be the redirect URL
	return [
		{
			json: {
				downloadUrl: response,
			},
		},
	];
} 