import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	ICredentialDataDecryptedObject,
	ICredentialTestFunctions,
	IDataObject,
	IHttpRequestOptions,
	IHttpRequestMethods,
	INodeCredentialTestResult,
	NodeApiError,
} from 'n8n-workflow';

export async function putioApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	formData?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('putioApi') as ICredentialDataDecryptedObject;

	const options: IHttpRequestOptions = {
		headers: {
			'Authorization': `Bearer ${credentials.accessToken}`,
		},
		method,
		url: `https://api.put.io/v2${endpoint}`,
		qs,
		body: formData || body,
		json: true,
	};

	console.log('Put.io API Request Options:', {
		method: options.method,
		url: options.url,
		qs: options.qs,
		headers: options.headers,
	});

	try {
		const response = await this.helpers.request(options);
		return response;
	} catch (error) {
		console.log('Put.io API Error:', error);
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function validateCredentials(
	this: ICredentialTestFunctions,
	decryptedCredentials: ICredentialDataDecryptedObject,
): Promise<INodeCredentialTestResult> {
	try {
		const options: IHttpRequestOptions = {
			headers: {
				'Authorization': `Bearer ${decryptedCredentials.accessToken}`,
			},
			method: 'GET',
			url: 'https://api.put.io/v2/account/info',
			json: true,
		};

		await this.helpers.request(options);
		return {
			status: 'OK',
			message: 'Connection successful!',
		};
	} catch (error) {
		return {
			status: 'Error',
			message: 'The credentials are not valid!',
		};
	}
} 