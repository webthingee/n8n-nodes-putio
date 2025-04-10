import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';

export async function createFolder(this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const folderName = this.getNodeParameter('folderName', itemIndex) as string;
	const parentId = this.getNodeParameter('parentId', itemIndex) as string;
	const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', {
		method: 'POST',
		url: 'https://api.put.io/v2/files/create-folder',
		body: {
			name: folderName,
			parent_id: parentId,
		},
	});

	return [
		{
			json: response,
		},
	];
} 