import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function getFile(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'GET',
		url: `https://api.put.io/v2/files/${fileId}`,
	});

	return [
		{
			json: response,
		},
	];
} 