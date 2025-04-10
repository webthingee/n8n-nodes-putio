import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

import {
	putioApiRequest,
} from './GenericFunctions';

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
		credentials: [
			{
				name: 'putioApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'List Files',
						value: 'listFiles',
						description: 'List files in a folder',
						action: 'List files in a folder',
					},
					{
						name: 'Create Folder',
						value: 'createFolder',
						description: 'Create a new folder',
						action: 'Create a new folder',
					},
					{
						name: 'Upload File',
						value: 'uploadFile',
						description: 'Upload a file',
						action: 'Upload a file',
					},
					{
						name: 'Get File',
						value: 'getFile',
						description: 'Get file details or download URL',
						action: 'Get file details or download URL',
					},
				],
				default: 'listFiles',
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '0',
				displayOptions: {
					show: {
						operation: [
							'listFiles',
						],
					},
				},
				description: 'ID of the folder to list files from',
			},
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'createFolder',
						],
					},
				},
				description: 'Name of the folder to create',
			},
			{
				displayName: 'Parent Folder ID',
				name: 'parentFolderId',
				type: 'string',
				default: '0',
				displayOptions: {
					show: {
						operation: [
							'createFolder',
						],
					},
				},
				description: 'ID of the parent folder',
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'getFile',
						],
					},
				},
				description: 'Path of the file to get',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'getFile',
						],
					},
				},
				description: 'ID of the file to get',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
				description: 'Name of the binary property which contains the file data to be uploaded',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
				description: 'Name of the file to be uploaded',
			},
			{
				displayName: 'Parent Folder ID',
				name: 'parentFolderId',
				type: 'string',
				default: '0',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
				description: 'ID of the parent folder',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'listFiles') {
					const folderId = this.getNodeParameter('folderId', i) as string;
					const response = await putioApiRequest.call(this, 'GET', '/files/list', {}, { parent_id: folderId });
					returnData.push(response);
				} else if (operation === 'createFolder') {
					const folderName = this.getNodeParameter('folderName', i) as string;
					const parentFolderId = this.getNodeParameter('parentFolderId', i) as string;
					const response = await putioApiRequest.call(this, 'POST', '/files/create-folder', {}, { name: folderName, parent_id: parentFolderId });
					returnData.push(response);
				} else if (operation === 'uploadFile') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const parentFolderId = this.getNodeParameter('parentFolderId', i) as string;

					if (items[i].binary === undefined) {
						throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
					}

					if (items[i].binary[binaryPropertyName] === undefined) {
						throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" does not exists on item!`);
					}

					const binaryData = items[i].binary[binaryPropertyName];
					const formData = {
						file: {
							value: Buffer.from(binaryData.data, 'base64'),
							options: {
								filename: fileName,
							},
						},
						parent_id: parentFolderId,
					};

					const response = await putioApiRequest.call(this, 'POST', '/files/upload', {}, {}, formData);
					returnData.push(response);
				} else if (operation === 'getFile') {
					const filePath = this.getNodeParameter('filePath', i) as string;
					const fileId = this.getNodeParameter('fileId', i) as string;

					if (filePath) {
						const response = await putioApiRequest.call(this, 'GET', '/files/list', {}, { path: filePath });
						if (!response.files || response.files.length === 0) {
							throw new NodeOperationError(this.getNode(), `File not found at path: ${filePath}`);
						}
						returnData.push(response.files[0]);
					} else if (fileId) {
						const response = await putioApiRequest.call(this, 'GET', `/files/${fileId}`);
						if (!response.file) {
							throw new NodeOperationError(this.getNode(), `File with ID ${fileId} not found`);
						}
						returnData.push(response.file);
					} else {
						throw new NodeOperationError(this.getNode(), 'Either file path or file ID must be provided');
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
} 