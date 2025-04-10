import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	NodeOperationError,
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
				description: 'The ID of the folder to list files from',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length;
		let responseData;

		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < length; i++) {
			try {
				if (operation === 'listFiles') {
					const folderId = this.getNodeParameter('folderId', i) as string;
					const response = await putioApiRequest.call(this, 'GET' as IHttpRequestMethods, `/files/list`, {
						parent_id: folderId,
					});

					// Ensure we're working with the files array from the response
					const filesArray = response.files || [];

					// Separate files and folders
					const files = filesArray.filter((item: IDataObject) => item.file_type !== 'FOLDER');
					const folders = filesArray.filter((item: IDataObject) => item.file_type === 'FOLDER');

					// Include parent folder information and status
					responseData = {
						files,
						folders,
						total_files: files.length,
						total_folders: folders.length,
						parent: response.parent,
						status: response.status,
						total: response.total,
					};
				} else if (operation === 'getFile' || operation === 'downloadFile') {
					const selectionMethod = this.getNodeParameter('selectionMethod', i) as string;
					let fileId: string;

					if (selectionMethod === 'id') {
						fileId = this.getNodeParameter('fileId', i) as string;
					} else {
						// Get file by path
						const filePath = this.getNodeParameter('filePath', i) as string;
						const searchResponse = await putioApiRequest.call(this, 'GET' as IHttpRequestMethods, '/files/search', {
							query: filePath,
							per_page: 1,
						});

						if (!searchResponse.files || !searchResponse.files.length) {
							throw new NodeOperationError(this.getNode(), `File not found at path: ${filePath}`);
						}

						// Find exact path match
						const exactMatch = searchResponse.files.find((file: IDataObject) => file.full_path === filePath);
						if (!exactMatch) {
							throw new NodeOperationError(this.getNode(), `File not found at exact path: ${filePath}`);
						}

						fileId = exactMatch.id as string;
					}

					if (operation === 'getFile') {
						responseData = await putioApiRequest.call(this, 'GET' as IHttpRequestMethods, `/files/${fileId}`);
					} else {
						responseData = await putioApiRequest.call(this, 'GET' as IHttpRequestMethods, `/files/${fileId}/download`);
					}
				} else if (operation === 'createFolder') {
					const folderName = this.getNodeParameter('folderName', i) as string;
					const parentFolderId = this.getNodeParameter('parentFolderId', i) as string;
					responseData = await putioApiRequest.call(this, 'POST' as IHttpRequestMethods, `/files/create-folder`, {
						name: folderName,
						parent_id: parentFolderId,
					});
				} else if (operation === 'uploadFile') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const parentFolderId = this.getNodeParameter('uploadParentFolderId', i) as string;

					if (items[i].binary === undefined) {
						throw new Error('No binary data exists on item!');
					}

					if (items[i].binary[binaryPropertyName] === undefined) {
						throw new Error(`No binary data property "${binaryPropertyName}" does not exists on item!`);
					}

					const binaryData = items[i].binary[binaryPropertyName];
					const binaryDataBuffer = Buffer.from(binaryData.data, 'base64');

					const formData = {
						file: {
							value: binaryDataBuffer,
							options: {
								filename: fileName,
							},
						},
						parent_id: parentFolderId,
					};

					responseData = await putioApiRequest.call(this, 'POST' as IHttpRequestMethods, '/files/upload', {}, {}, formData);
				}

				if (Array.isArray(responseData)) {
					returnData.push.apply(returnData, responseData as IDataObject[]);
				} else {
					returnData.push(responseData as IDataObject);
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