import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function uploadFile(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const file = this.getNodeParameter('file', itemIndex) as string;
	const parentId = this.getNodeParameter('parentId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'POST',
		url: 'https://api.put.io/v2/files/upload',
		body: {
			file,
			parent_id: parentId,
		},
	});

	return [
		{
			json: response,
		},
	];
} 