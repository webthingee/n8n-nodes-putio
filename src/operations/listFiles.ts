import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function listFiles(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const folderId = this.getNodeParameter('folderId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'GET',
		url: 'https://api.put.io/v2/files/list',
		qs: {
			parent_id: folderId,
		},
	});

	return [
		{
			json: response,
		},
	];
} 