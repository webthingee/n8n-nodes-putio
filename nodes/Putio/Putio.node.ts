import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	NodeOperationError,
	NodeExecutionWithMetadata,
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
						description: 'List files and folders',
						action: 'List files and folders',
					},
					{
						name: 'Get File',
						value: 'getFile',
						description: 'Get file details',
						action: 'Get file details',
					},
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a file',
						action: 'Download a file',
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
						description: 'Upload a file to Put.io',
						action: 'Upload a file',
					},
				],
				default: 'listFiles',
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '0',
				description: 'The ID of the folder to list files from (use 0 for root directory)',
				displayOptions: {
					show: {
						operation: [
							'listFiles',
						],
					},
				},
			},
			{
				displayName: 'Selection Method',
				name: 'selectionMethod',
				type: 'options',
				options: [
					{
						name: 'File ID',
						value: 'id',
						description: 'Select file using its ID',
					},
					{
						name: 'File Path',
						value: 'path',
						description: 'Select file using its path',
					},
				],
				default: 'id',
				displayOptions: {
					show: {
						operation: [
							'getFile',
							'downloadFile',
						],
					},
				},
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				description: 'The ID of the file to get or download',
				displayOptions: {
					show: {
						operation: [
							'getFile',
							'downloadFile',
						],
						selectionMethod: [
							'id',
						],
					},
				},
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				placeholder: '/folder/subfolder/file.txt',
				description: 'The full path to the file (e.g., /folder/subfolder/file.txt)',
				displayOptions: {
					show: {
						operation: [
							'getFile',
							'downloadFile',
						],
						selectionMethod: [
							'path',
						],
					},
				},
			},
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				description: 'The name of the folder to create',
				displayOptions: {
					show: {
						operation: [
							'createFolder',
						],
					},
				},
			},
			{
				displayName: 'Parent Folder ID',
				name: 'parentFolderId',
				type: 'string',
				default: '0',
				description: 'The ID of the parent folder where the new folder will be created',
				displayOptions: {
					show: {
						operation: [
							'createFolder',
						],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property which contains the data for the file to be uploaded',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				description: 'Name of the file to be uploaded',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
			},
			{
				displayName: 'Parent Folder ID',
				name: 'uploadParentFolderId',
				type: 'string',
				default: '0',
				description: 'The ID of the parent folder where the file will be uploaded',
				displayOptions: {
					show: {
						operation: [
							'uploadFile',
						],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length;
		let responseData;

		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < length; i++) {
			try {
				if (operation === 'listFiles') {
					const folderId = this.getNodeParameter('folderId', i) as string;
					console.log('Put.io List Files - Folder ID:', folderId);
					
					// Convert folderId to a number to ensure proper type
					const parentId = parseInt(folderId, 10);
					if (isNaN(parentId)) {
						throw new NodeOperationError(this.getNode(), 'Invalid folder ID: must be a number');
					}

					const response = await putioApiRequest.call(this, 'GET', '/files/list', {}, { parent_id: parentId });
					
					// Separate files and folders
					const files = response.files || [];
					const folders = files.filter((item: IDataObject) => item.file_type === 'FOLDER');
					const nonFolders = files.filter((item: IDataObject) => item.file_type !== 'FOLDER');
					
					returnData.push({
						files: nonFolders,
						folders: folders,
					});
				} else if (operation === 'getFile') {
					const selectionMethod = this.getNodeParameter('selectionMethod', i) as string;
					let fileId: string;

					if (selectionMethod === 'path') {
						const filePath = this.getNodeParameter('filePath', i) as string;
						const response = await putioApiRequest.call(this, 'GET', '/files/list', {}, { path: filePath });
						if (!response.files || response.files.length === 0) {
							throw new NodeOperationError(this.getNode(), `File not found at path: ${filePath}`);
						}
						fileId = response.files[0].id;
					} else {
						fileId = this.getNodeParameter('fileId', i) as string;
					}

					const response = await putioApiRequest.call(this, 'GET', `/files/${fileId}`);
					returnData.push(response.file);
				} else if (operation === 'downloadFile') {
					const selectionMethod = this.getNodeParameter('selectionMethod', i) as string;
					let fileId: string;

					if (selectionMethod === 'path') {
						const filePath = this.getNodeParameter('filePath', i) as string;
						const response = await putioApiRequest.call(this, 'GET', '/files/list', {}, { path: filePath });
						if (!response.files || response.files.length === 0) {
							throw new NodeOperationError(this.getNode(), `File not found at path: ${filePath}`);
						}
						fileId = response.files[0].id;
					} else {
						fileId = this.getNodeParameter('fileId', i) as string;
					}

					const downloadUrl = await putioApiRequest.call(this, 'GET', `/files/${fileId}/download`);
					returnData.push({ downloadUrl });
				} else if (operation === 'createFolder') {
					const folderName = this.getNodeParameter('folderName', i) as string;
					const parentFolderId = this.getNodeParameter('parentFolderId', i) as string;

					const response = await putioApiRequest.call(this, 'POST', '/files/create-folder', {
						name: folderName,
						parent_id: parentFolderId,
					});

					returnData.push(response);
				} else if (operation === 'uploadFile') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const parentFolderId = this.getNodeParameter('uploadParentFolderId', i) as string;

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