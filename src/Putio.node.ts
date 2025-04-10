import type { IExecuteFunctions } from 'n8n-core';
import type { INodeExecutionData, INodeProperties, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { listFiles } from './operations/listFiles';
import { getFile } from './operations/getFile';
import { createFolder } from './operations/createFolder';
import { uploadFile } from './operations/uploadFile';
import { downloadFile } from './operations/downloadFile';

export class Putio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Put.io',
		name: 'putio',
		icon: 'file:putio.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Put.io API',
		defaults: {
			name: 'Put.io',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'File',
						value: 'file',
					},
				],
				default: 'file',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'List Files & Folders',
						value: 'listFiles',
						description: 'List files and folders in a directory',
						action: 'List files and folders',
						routing: {
							request: {
								method: 'GET',
								url: '=/files/list',
								qs: {
									parent_id: '={{$parameter.folderId}}',
								},
							},
							output: {
								postReceive: [
									{
										type: 'set',
										properties: {
											value: '={{ { "files": $response.body.files, "folders": $response.body.folders } }}',
										},
									},
								],
							},
						},
					},
					{
						name: 'Get Files & Folders',
						value: 'getFile',
						description: 'Get a file or folder by ID or path',
						action: 'Get a file or folder',
						routing: {
							request: {
								method: 'GET',
								url: '=/files/{{$parameter.fileId}}',
							},
							output: {
								postReceive: [
									{
										type: 'set',
										properties: {
											value: '={{ { "file": $response.body } }}',
										},
									},
								],
							},
						},
					},
					{
						name: 'Create Folder',
						value: 'createFolder',
						description: 'Create a new folder',
						action: 'Create a folder',
						routing: {
							request: {
								method: 'POST',
								url: '=/files/create-folder',
								body: {
									name: '={{$parameter.folderName}}',
									parent_id: '={{$parameter.parentId}}',
								},
							},
							output: {
								postReceive: [
									{
										type: 'set',
										properties: {
											value: '={{ { "folder": $response.body } }}',
										},
									},
								],
							},
						},
					},
					{
						name: 'Upload File',
						value: 'uploadFile',
						description: 'Upload a file to Put.io',
						action: 'Upload a file',
						routing: {
							request: {
								method: 'POST',
								url: '=/files/upload',
								body: {
									file: '={{$parameter.file}}',
									parent_id: '={{$parameter.parentId}}',
								},
							},
							output: {
								postReceive: [
									{
										type: 'set',
										properties: {
											value: '={{ { "file": $response.body } }}',
										},
									},
								],
							},
						},
					},
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a file from Put.io',
						action: 'Download a file',
						routing: {
							request: {
								method: 'GET',
								url: '=/files/{{$parameter.fileId}}/download',
							},
							output: {
								postReceive: [
									{
										type: 'set',
										properties: {
											value: '={{ { "downloadUrl": $response.body } }}',
										},
									},
								],
							},
						},
					},
				],
				default: 'listFiles',
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['listFiles'],
					},
				},
				description: 'The ID of the folder to list files from',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['getFile', 'downloadFile'],
					},
				},
				description: 'The ID of the file to get or download',
			},
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['createFolder'],
					},
				},
				description: 'The name of the folder to create',
			},
			{
				displayName: 'Parent ID',
				name: 'parentId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['createFolder', 'uploadFile'],
					},
				},
				description: 'The ID of the parent folder',
			},
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['uploadFile'],
					},
				},
				description: 'The file to upload',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'file') {
					if (operation === 'listFiles') {
						const responseData = await listFiles.call(this, i);
						returnData.push(...responseData);
					} else if (operation === 'getFile') {
						const responseData = await getFile.call(this, i);
						returnData.push(...responseData);
					} else if (operation === 'createFolder') {
						const responseData = await createFolder.call(this, i);
						returnData.push(...responseData);
					} else if (operation === 'uploadFile') {
						const responseData = await uploadFile.call(this, i);
						returnData.push(...responseData);
					} else if (operation === 'downloadFile') {
						const responseData = await downloadFile.call(this, i);
						returnData.push(...responseData);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
} 