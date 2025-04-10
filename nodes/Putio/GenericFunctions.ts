import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	NodeApiError,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

import {
	ICredentialDataDecryptedObject,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';

export async function putioApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
	formData?: IDataObject,
	option: IDataObject = {},
) {
	const options: IDataObject = {
		method,
		url: `https://api.put.io/v2${endpoint}`,
		qs: query,
		body,
		json: true,
		returnFullResponse: true,
	};

	if (formData) {
		options.form = formData;
		options.json = false;
	}

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', options);

		// Handle download URL requests
		if (endpoint.includes('/download')) {
			if (response.headers?.location) {
				return response.headers.location;
			}
			// If we get HTML with a redirect URL
			const urlMatch = response.body?.toString().match(/href="([^"]+)"/);
			if (urlMatch) {
				return urlMatch[1].replace(/&amp;/g, '&');
			}
		}

		return response.body;
	} catch (error) {
		// Handle redirect in error case
		if (endpoint.includes('/download') && error.statusCode === 302) {
			if (error.response?.headers?.location) {
				return error.response.headers.location;
			}
			const urlMatch = error.message.match(/href="([^"]+)"/);
			if (urlMatch) {
				return urlMatch[1].replace(/&amp;/g, '&');
			}
		}

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